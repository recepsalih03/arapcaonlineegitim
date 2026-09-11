import type { Metadata } from "next";

import { CredentialsForm } from "@/components/auth/credentials-form";
import { DeviceList } from "@/components/devices/device-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStudent } from "@/modules/auth/session";
import { listDevices, maxDevices } from "@/modules/devices/service";

export const metadata: Metadata = { title: "Hesabım" };

export default async function HesabimPage() {
  const student = await requireStudent();
  const devices = await listDevices(student.id);

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
            currentDeviceSessionId={student.deviceSessionId}
            maxDevices={maxDevices()}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Giriş bilgilerim</CardTitle>
        </CardHeader>
        <CardContent>
          <CredentialsForm currentUsername={student.username} />
        </CardContent>
      </Card>
    </div>
  );
}
