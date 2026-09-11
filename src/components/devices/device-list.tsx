"use client";

import { Laptop, Smartphone, Trash2 } from "lucide-react";
import { useActionState } from "react";

import { ActionFeedback } from "@/components/ui/action-feedback";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { EMPTY_ACTION_STATE } from "@/lib/forms";
import { formatDateTime } from "@/lib/utils";
import { removeOwnDeviceAction } from "@/modules/devices/actions";

export type DeviceRow = {
  id: string;
  deviceLabel: string;
  ipHint: string | null;
  lastSeenAt: string;
};

/**
 * Öğrencinin cihaz listesi (PROJE.md §5c-d).
 * Şu an kullanılan cihaz silinemez; butonu hiç gösterilmez.
 */
export function DeviceList({
  devices,
  currentDeviceSessionId,
  maxDevices,
}: {
  devices: DeviceRow[];
  currentDeviceSessionId: string;
  maxDevices: number;
}) {
  const [state, formAction] = useActionState(
    removeOwnDeviceAction,
    EMPTY_ACTION_STATE,
  );

  return (
    <div className="space-y-3">
      <ActionFeedback state={state} />

      <ul className="space-y-2">
        {devices.map((device) => {
          const isCurrent = device.id === currentDeviceSessionId;
          const mobile = /iPhone|Android|iPad/i.test(device.deviceLabel);
          const Icon = mobile ? Smartphone : Laptop;

          return (
            <li
              key={device.id}
              className="flex items-center gap-3 rounded-xl border border-kum-200 bg-white px-3.5 py-3"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-kum-100 text-kum-600">
                <Icon className="size-4.5" aria-hidden />
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium text-kum-900">
                  <span className="truncate">{device.deviceLabel}</span>
                  {isCurrent ? <Badge tone="yesil">Bu cihaz</Badge> : null}
                </p>
                <p className="mt-0.5 text-xs text-kum-400">
                  Son giriş: {formatDateTime(device.lastSeenAt)}
                  {device.ipHint ? ` · ${device.ipHint}` : ""}
                </p>
              </div>

              {isCurrent ? null : (
                <form action={formAction}>
                  <input type="hidden" name="deviceSessionId" value={device.id} />
                  <SubmitButton
                    variant="danger"
                    size="sm"
                    pendingLabel="Siliniyor…"
                    aria-label={`${device.deviceLabel} cihazını sil`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                    Sil
                  </SubmitButton>
                </form>
              )}
            </li>
          );
        })}
      </ul>

      <p className="text-xs leading-relaxed text-kum-500">
        Hesabınız en fazla {maxDevices} cihazdan kullanılabilir ({devices.length}/
        {maxDevices} dolu). Cihaz ayrımı tarayıcı parmak izine göre yapılır ve
        %100 kesin değildir: aynı bilgisayarda farklı bir tarayıcı kullanırsanız
        ayrı bir cihaz olarak sayılabilir.
      </p>
    </div>
  );
}
