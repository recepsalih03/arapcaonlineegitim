import type { Metadata } from "next";

import { CredentialsForm } from "@/components/auth/credentials-form";
import { DeviceList } from "@/components/devices/device-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/modules/auth/session";
import { listDevices, maxDevices } from "@/modules/devices/service";

export const metadata: Metadata = { title: "Hesabım" };

/**
 * Adminin kendi hesabı: cihazlarını görüp silebilir ve giriş bilgilerini
 * değiştirebilir. Öğrenci "Hesabım" sayfasıyla aynı bileşenler; fark, cihaz
 * limitinin admin için 6 olması (bkz. maxDevices).
 */
export default async function YonetimHesabimPage() {
  const admin = await requireAdmin();
  const devices = await listDevices(admin.id);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight text-zumrut-900 sm:text-2xl">
        Hesabım
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Cihazlarım</CardTitle>
        </CardHeader>
        <CardContent>
          <DeviceList
            devices={devices.map((device) => ({
              id: device.id,
              deviceLabel: device.deviceLabel,
              ipHint: device.ipHint,
              lastSeenAt: device.lastSeenAt.toISOString(),
            }))}
            currentDeviceSessionId={admin.deviceSessionId}
            maxDevices={maxDevices(admin.role)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Giriş bilgilerim</CardTitle>
        </CardHeader>
        <CardContent>
          <CredentialsForm currentUsername={admin.username} />
        </CardContent>
      </Card>
    </div>
  );
}
