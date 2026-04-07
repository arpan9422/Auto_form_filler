"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/utils";
import {
  Card, CardContent, CardHeader, CardTitle,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Skeleton,
} from "@/components/ui";

type Referrer = {
  user: { email: string; firstName: string; lastName: string };
  referralCount: number;
};

type ReferralsRes = {
  totalReferrals: number;
  topReferrers: Referrer[];
};

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralsRes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<ReferralsRes>("/admin/referrals")
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Referrals</h1>

      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <Card className="w-fit">
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{data?.totalReferrals ?? 0}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Top Referrers</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Referral Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.topReferrers.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{r.user.firstName} {r.user.lastName}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{r.user.email}</TableCell>
                    <TableCell>{r.referralCount}</TableCell>
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
