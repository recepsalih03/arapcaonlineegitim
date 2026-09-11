import Link from "next/link";

import { CopyField } from "@/components/admin/copy-field";
import { StudentActions } from "@/components/admin/student-actions";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { gradeLabel } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { StudentRow } from "@/modules/students/service";

export function StudentTable({
  students,
  showGrade = true,
}: {
  students: StudentRow[];
  showGrade?: boolean;
}) {
  if (students.length === 0) {
    return <EmptyState title="Henüz öğrenci yok." />;
  }

  // Geçici şifreler tablonun altında toplanır: hem sütun şişmez hem de
  // öğrenciye iletilecek bilgiler tek yerde durur.
  const bekleyenler = students.filter((s) => s.initialPassword);

  return (
    <div className="space-y-3">
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>Öğrenci</Th>
              <Th>Kullanıcı adı</Th>
              {showGrade ? <Th>Sınıf</Th> : null}
              <Th>Durum</Th>
              <Th className="text-right">Cihaz</Th>
              <Th>Kayıt</Th>
              <Th className="text-right">İşlem</Th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const label = student.fullName ?? student.username;
              return (
                <Tr key={student.id}>
                  <Td className="font-medium text-kum-900">
                    <Link
                      href={`/yonetim/ogrenciler/${student.id}`}
                      className="hover:text-zumrut-700"
                    >
                      {label}
                    </Link>
                  </Td>
                  <Td className="font-mono text-xs text-kum-500">
                    {student.username}
                  </Td>
                  {showGrade ? (
                    <Td className="whitespace-nowrap text-kum-600">
                      {student.gradeLevel ? gradeLabel(student.gradeLevel) : "—"}
                    </Td>
                  ) : null}
                  <Td>
                    {!student.isActive ? (
                      <Badge tone="kirmizi">Pasif</Badge>
                    ) : student.mustChangeCredentials ? (
                      <Badge tone="altin">İlk giriş bekliyor</Badge>
                    ) : (
                      <Badge tone="yesil">Aktif</Badge>
                    )}
                  </Td>
                  <Td className="text-right tabular-nums text-kum-600">
                    {student.activeDeviceCount}
                  </Td>
                  <Td className="whitespace-nowrap text-xs text-kum-400">
                    {formatDate(student.createdAt)}
                  </Td>
                  <Td>
                    <div className="flex justify-end">
                      <StudentActions
                        studentId={student.id}
                        gradeLevel={student.gradeLevel}
                        isActive={student.isActive}
                        studentLabel={label}
                      />
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </TableWrap>

      {bekleyenler.length > 0 ? (
        <div className="space-y-2 rounded-card border border-altin-300 bg-altin-50 p-4">
          <p className="text-sm font-medium text-altin-700">
            İletilmeyi bekleyen giriş bilgileri
          </p>
          {bekleyenler.map((student) => (
            <CopyField
              key={student.id}
              label={`${student.fullName ?? student.username} · ${student.username}`}
              value={student.initialPassword!}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
