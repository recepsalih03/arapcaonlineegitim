import { BarChart3 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ConfirmForm } from "@/components/admin/confirm-form";
import { SurveyForm } from "@/components/admin/survey-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { gradeLabel } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { deleteSurveyAction } from "@/modules/surveys/actions";
import { listAllSurveys, surveyOptions } from "@/modules/surveys/service";

export const metadata: Metadata = { title: "Anketler" };

export default async function YonetimAnketlerPage() {
  const surveys = await listAllSurveys();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zumrut-900 sm:text-2xl">
          Anketler
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yeni anket</CardTitle>
        </CardHeader>
        <CardContent>
          <SurveyForm />
        </CardContent>
      </Card>

      {surveys.length === 0 ? (
        <EmptyState title="Henüz anket yok." />
      ) : (
        <ul className="space-y-3">
          {surveys.map((survey) => (
            <li
              key={survey.id}
              className="rounded-card border border-kum-200 bg-white p-4"
            >
              <p className="text-xs text-kum-400">{formatDate(survey.createdAt)}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2">
                <span className="font-medium text-kum-900">{survey.question}</span>
                {!survey.isActive ? <Badge tone="kirmizi">Kapalı</Badge> : null}
              </p>
              <p className="mt-1 flex flex-wrap gap-1.5">
                {survey.grades.map(({ gradeLevel }) => (
                  <Badge key={gradeLevel} tone="yesil">
                    {gradeLabel(gradeLevel)}
                  </Badge>
                ))}
              </p>
              <p className="mt-2 text-sm text-kum-500">
                {surveyOptions(survey).length} seçenek
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/yonetim/anketler/${survey.id}`}>
                    <BarChart3 className="size-4" aria-hidden />
                    Sonuçlar
                  </Link>
                </Button>
                <ConfirmForm
                  action={deleteSurveyAction}
                  fields={{ surveyId: survey.id }}
                  confirmMessage={`"${survey.question}" anketi ve tüm oyları silinsin mi?`}
                  showFeedback={false}
                >
                  Sil
                </ConfirmForm>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
