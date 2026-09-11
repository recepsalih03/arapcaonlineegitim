import type { Metadata } from "next";

import { StudentCreateForm } from "@/components/admin/student-create-form";
import { StudentTable } from "@/components/admin/student-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listStudents } from "@/modules/students/service";

export const metadata: Metadata = { title: "Öğrenciler" };

export default async function YonetimOgrencilerPage() {
  const students = await listStudents();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zumrut-900 sm:text-2xl">
          Öğrenciler
        </h1>
        <p className="mt-1 text-sm text-kum-500">{students.length} öğrenci</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yeni öğrenci oluştur</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentCreateForm />
        </CardContent>
      </Card>

      <StudentTable students={students} />
    </div>
  );
}
