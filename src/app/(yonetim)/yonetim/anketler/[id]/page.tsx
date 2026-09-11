import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SurveyForm } from "@/components/admin/survey-form";
import { SurveyResultsChart } from "@/components/admin/survey-results";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSurvey, getSurveyResults, surveyOptions } from "@/modules/surveys/service";

export const metadata: Metadata = { title: "Anket Sonuçları" };

export default async function AnketDetayPage({
  params,
}: PageProps<"/yonetim/anketler/[id]">) {
  const { id } = await params;
  const [survey, results] = await Promise.all([getSurvey(id), getSurveyResults(id)]);
  if (!survey || !results) notFound();

  return (
    <div className="space-y-5">
      <Link
        href="/yonetim/anketler"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-kum-500 hover:text-zumrut-700"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Anketler
      </Link>

      <h1 className="text-xl font-semibold tracking-tight text-zumrut-900 sm:text-2xl">
        {survey.question}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Sonuçlar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SurveyResultsChart results={results} />
          <Alert tone="info">
            Bu anket anonimdir: hangi öğrencinin hangi seçeneği işaretlediği hiçbir
            yerde tutulmaz, yalnızca sayaçlar artar.
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Anketi düzenle</CardTitle>
        </CardHeader>
        <CardContent>
          <SurveyForm
            survey={{
              id: survey.id,
              question: survey.question,
              options: surveyOptions(survey),
              grades: survey.grades.map((g) => g.gradeLevel),
              isActive: survey.isActive,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
