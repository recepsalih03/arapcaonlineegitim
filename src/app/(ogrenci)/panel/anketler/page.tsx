import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

import { VoteForm } from "@/components/surveys/vote-form";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { requireStudent } from "@/modules/auth/session";
import { listSurveysForStudent, surveyOptions } from "@/modules/surveys/service";

export const metadata: Metadata = { title: "Anketler" };

export default async function OgrenciAnketlerPage() {
  const student = await requireStudent();
  const surveys = await listSurveysForStudent(student.id, student.gradeLevel);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zumrut-900 sm:text-2xl">
          Anketler
        </h1>
        <p className="mt-1 text-sm text-kum-500">
          Cevaplarınız anonimdir, kimin ne oyladığı tutulmaz.
        </p>
      </div>

      {surveys.length === 0 ? (
        <EmptyState title="Şu anda açık anket yok." />
      ) : (
        <div className="space-y-3">
          {surveys.map((survey) => {
            const options = surveyOptions(survey);
            return (
              <Card key={survey.id}>
                <CardContent className="p-4 sm:p-5">
                  <p className="text-xs text-kum-400">
                    {formatDate(survey.createdAt)}
                  </p>
                  <h2 className="mt-1 font-medium text-kum-900">
                    {survey.question}
                  </h2>

                  <div className="mt-4">
                    {survey.hasVoted ? (
                      <p className="flex items-center gap-2 text-sm text-zumrut-700">
                        <CheckCircle2 className="size-4" aria-hidden />
                        Bu ankete oy verdiniz. Teşekkürler!
                      </p>
                    ) : (
                      <VoteForm surveyId={survey.id} options={options} />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
