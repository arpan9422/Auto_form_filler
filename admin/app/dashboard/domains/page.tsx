"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/utils";
import {
  Card, CardContent, CardHeader, CardTitle,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Skeleton,
} from "@/components/ui";

type DomainStat = {
  platform: string;
  totalFills: number;
  avgTimeSavedSec: number;
  avgFieldsFilled: number;
  totalCreditsUsed: number;
};

export default function DomainsPage() {
  const [data, setData] = useState<DomainStat[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<DomainStat[]>("/admin/domains")
      .then((res) => setData([...res].sort((a, b) => b.totalFills - a.totalFills)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Domains</h1>

      <Card>
        <CardHeader><CardTitle>Domain Stats</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>Total Fills</TableHead>
                  <TableHead>Avg Time Saved</TableHead>
                  <TableHead>Avg Fields Filled</TableHead>
                  <TableHead>Total Credits Used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((d) => (
                  <TableRow key={d.platform}>
                    <TableCell className="font-medium">{d.platform}</TableCell>
                    <TableCell>{d.totalFills}</TableCell>
                    <TableCell>{d.avgTimeSavedSec.toFixed(1)}s</TableCell>
                    <TableCell>{d.avgFieldsFilled.toFixed(1)}</TableCell>
                    <TableCell>{d.totalCreditsUsed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
