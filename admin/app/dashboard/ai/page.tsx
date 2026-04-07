"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/components/ui";

type AiUsage = {
  totalForms: number;
  totalAiEdits: number;
  totalCreditsUsed: number;
  avgAiEditsPerForm: number;
  avgTimeSavedSec: number;
  acceptedDirectly: number;
  editedByUser: number;
  acceptanceRate: number;
};

const stats = (d: AiUsage) => [
  { label: "Total Forms", value: d.totalForms },
  { label: "Total AI Edits", value: d.totalAiEdits },
  { label: "Total Credits Used", value: d.totalCreditsUsed },
  { label: "Avg AI Edits / Form", value: d.avgAiEditsPerForm.toFixed(2) },
  { label: "Avg Time Saved", value: `${d.avgTimeSavedSec.toFixed(1)}s` },
  { label: "Accepted Directly", value: d.acceptedDirectly },
  { label: "Edited by User", value: d.editedByUser },
  { label: "Acceptance Rate", value: `${(d.acceptanceRate * 100).toFixed(1)}%` },
];

export default function AiPage() {
  const [data, setData] = useState<AiUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AiUsage>("/admin/ai-usage")
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">AI Usage</h1>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats(data).map(({ label, value }) => (
              <Card key={label}>
                <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{value}</p></CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>Out of <span className="text-foreground font-medium">{data.totalForms}</span> forms filled, AI suggestions were accepted directly <span className="text-foreground font-medium">{data.acceptedDirectly}</span> times ({(data.acceptanceRate * 100).toFixed(1)}% acceptance rate).</p>
              <p>Users edited AI output <span className="text-foreground font-medium">{data.editedByUser}</span> times, with an average of <span className="text-foreground font-medium">{data.avgAiEditsPerForm.toFixed(2)}</span> AI edits per form.</p>
              <p>Total credits consumed by AI: <span className="text-foreground font-medium">{data.totalCreditsUsed}</span>. Average time saved per form: <span className="text-foreground font-medium">{data.avgTimeSavedSec.toFixed(1)}s</span>.</p>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
