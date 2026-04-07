"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/utils";
import {
  Card, CardContent, CardHeader, CardTitle,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Badge, Skeleton,
} from "@/components/ui";

type Purchase = {
  id: string;
  creditsBought: number;
  amountPaid: number;
  currency: string;
  status: string;
  createdAt: string;
  user: { email: string; firstName: string; lastName: string };
};

type CreditsRes = {
  totalPurchased: number;
  totalConsumed: number;
  totalUsers: number;
  recentPurchases: Purchase[];
};

const statusVariant = (s: string) => {
  if (s === "SUCCESS") return "success";
  if (s === "FAILED") return "destructive";
  return "secondary";
};

export default function CreditsPage() {
  const [data, setData] = useState<CreditsRes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<CreditsRes>("/admin/credits")
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Credits</h1>

      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Total Purchased</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{data?.totalPurchased ?? 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Total Consumed</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{data?.totalConsumed ?? 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Net Balance</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{(data?.totalPurchased ?? 0) - (data?.totalConsumed ?? 0)}</p></CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Recent Purchases</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.recentPurchases.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.user.firstName} {p.user.lastName}</div>
                      <div className="text-xs text-muted-foreground">{p.user.email}</div>
                    </TableCell>
                    <TableCell>{p.creditsBought}</TableCell>
                    <TableCell>{p.amountPaid}</TableCell>
                    <TableCell>{p.currency}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(p.status) as "success" | "destructive" | "secondary"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </TableCell>
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
