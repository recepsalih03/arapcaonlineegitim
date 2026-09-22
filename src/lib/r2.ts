import "server-only";

import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
  SIGNED_SEGMENT_TTL_SECONDS,
  SIGNED_UPLOAD_TTL_SECONDS,
  isDocumentPrefix,
  isVideoPrefix,
} from "@/lib/constants";
import { env } from "@/lib/env";

/**
 * Cloudflare R2 istemcisi (S3 uyumlu API).
 *
 * ÖNEMLİ (PROJE.md §1): Video verisi hiçbir zaman Vercel fonksiyonlarından geçmez.
 * - Yükleme: tarayıcı presigned PUT ile doğrudan R2'ye yazar.
 * - İzleme: segmentler (.ts) doğrudan R2'den, kısa ömürlü imzalı linklerle çekilir.
 *   Sunucudan geçen tek şey birkaç kilobaytlık .m3u8 playlist metnidir.
 *
 * Bucket public DEĞİLDİR; erişim yalnızca imzalı isteklerle olur (PROJE.md §2e).
 */

let cachedClient: S3Client | null = null;

export function r2Client(): S3Client {
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: "auto",
      endpoint: env.r2.endpoint,
      credentials: {
        accessKeyId: env.r2.accessKeyId,
        secretAccessKey: env.r2.secretAccessKey,
      },
    });
  }
  return cachedClient;
}

/** Segment/playlist okumak için kısa ömürlü imzalı GET linki üretir. */
export async function signedGetUrl(
  key: string,
  expiresIn: number = SIGNED_SEGMENT_TTL_SECONDS,
): Promise<string> {
  return getSignedUrl(
    r2Client(),
    new GetObjectCommand({ Bucket: env.r2.bucket, Key: key }),
    { expiresIn },
  );
}

/** Tarayıcının doğrudan R2'ye yükleyebilmesi için presigned PUT linki üretir. */
export async function signedPutUrl(
  key: string,
  contentType: string,
  expiresIn: number = SIGNED_UPLOAD_TTL_SECONDS,
): Promise<string> {
  return getSignedUrl(
    r2Client(),
    new PutObjectCommand({
      Bucket: env.r2.bucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn },
  );
}

/** Doküman gibi dosyaları doğrudan stream etmek için R2 nesnesini döner. */
export async function getObject(key: string) {
  return r2Client().send(
    new GetObjectCommand({ Bucket: env.r2.bucket, Key: key }),
  );
}

/** Küçük metin dosyalarını (playlist) sunucu tarafında okur. */
export async function getObjectText(key: string): Promise<string> {
  const result = await getObject(key);
  if (!result.Body) {
    throw new Error(`R2 nesnesi boş: ${key}`);
  }
  return result.Body.transformToString("utf-8");
}

/** Bir ön ekin altındaki tüm anahtarları listeler (sayfalı). */
export async function listKeys(prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const page = await r2Client().send(
      new ListObjectsV2Command({
        Bucket: env.r2.bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );
    for (const item of page.Contents ?? []) {
      if (item.Key) keys.push(item.Key);
    }
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);

  return keys;
}

/**
 * Bir videonun klasörünü siler.
 *
 * GÜVENLİK SINIRI: yalnızca "videos/<id>/" kalıbına uyan ön ekler kabul edilir.
 * Boş ya da geniş bir ön ek (örneğin "" veya "videos/") buraya geçseydi tek bir
 * çağrı bucket'taki BÜTÜN videoları silerdi. Yanlış bir ön eki sessizce
 * genişletmektense hata fırlatıp işlemi durduruyoruz.
 */
export async function deletePrefix(prefix: string): Promise<number> {
  if (!isVideoPrefix(prefix)) {
    throw new Error(
      `Güvenli olmayan silme ön eki reddedildi: ${JSON.stringify(prefix)}. ` +
        'Yalnızca "videos/<id>/" biçimindeki klasörler silinebilir.',
    );
  }

  const keys = await listKeys(prefix);
  if (keys.length === 0) return 0;

  // DeleteObjects tek seferde en fazla 1000 anahtar alır.
  for (let i = 0; i < keys.length; i += 1000) {
    const chunk = keys.slice(i, i + 1000);
    await r2Client().send(
      new DeleteObjectsCommand({
        Bucket: env.r2.bucket,
        Delete: { Objects: chunk.map((Key) => ({ Key })) },
      }),
    );
  }
  return keys.length;
}

/**
 * Doküman klasörünü siler (docs/<id>/ kalıbı).
 * Video silmeyle aynı güvenlik sınırı.
 */
export async function deleteDocPrefix(prefix: string): Promise<number> {
  if (!isDocumentPrefix(prefix)) {
    throw new Error(
      `Güvenli olmayan silme ön eki reddedildi: ${JSON.stringify(prefix)}. ` +
        'Yalnızca "docs/<id>/" biçimindeki klasörler silinebilir.',
    );
  }

  const keys = await listKeys(prefix);
  if (keys.length === 0) return 0;

  for (let i = 0; i < keys.length; i += 1000) {
    const chunk = keys.slice(i, i + 1000);
    await r2Client().send(
      new DeleteObjectsCommand({
        Bucket: env.r2.bucket,
        Delete: { Objects: chunk.map((Key) => ({ Key })) },
      }),
    );
  }
  return keys.length;
}
