"use server";

import { revalidatePath } from "next/cache";

import { type ActionState, readText } from "@/lib/forms";
import { requireOnboardedUser } from "@/modules/auth/session";
import { removeDevice } from "@/modules/devices/service";

/** Öğrencinin kendi cihazını silmesi (PROJE.md §5d). */
export async function removeOwnDeviceAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireOnboardedUser();

  const deviceSessionId = readText(formData, "deviceSessionId");
  if (!deviceSessionId) return { error: "Cihaz bulunamadı." };

  const result = await removeDevice({
    userId: user.id,
    deviceSessionId,
    currentDeviceSessionId: user.deviceSessionId,
  });

  if (!result.ok) {
    return {
      error:
        result.reason === "current_device"
          ? "Şu an kullandığınız cihazı silemezsiniz."
          : "Cihaz bulunamadı.",
    };
  }

  revalidatePath("/panel/hesabim");
  revalidatePath("/yonetim/hesabim");
  revalidatePath("/yonetim/ogrenciler/[id]", "page");
  return { success: "Cihaz silindi. O cihazdaki oturum sonlandırıldı." };
}
