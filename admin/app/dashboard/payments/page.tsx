"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/utils";
import {
  Card, CardContent, CardHeader, CardTitle,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Badge, Skeleton, Button,
} from "@/components/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Payment = {
  id: string;
  creditsBought: number;
  amountPaid: number;
  currency: string;
  status: string;
  paymentProvider: string;
  paymentRef: string;
  createdAt: string;
  user: { email: string; firstName: string; lastName: string };
};

type PaymentsRes = {
  payments: Payment[];
  total: number;
  page: number;
  pages: number;
};

const statusVariant = (s: string) => {
  if (s === "SUCCESS") return "success";
  if (s === "FAILED") return "destructive";
  return "secondary";
};

export default function PaymentsPage() {
  const [data, setData] = useState<PaymentsRes | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch<PaymentsRes>(`/admin/payments?page=${page}&limit=20`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payments</h1>

      <Card>
        <CardHeader><CardTitle>All Payments</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Ref</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-medium">{p.user.firstName} {p.user.lastName}</div>
                        <div className="text-xs text-muted-foreground">{p.user.email}</div>
                      </TableCell>
                      <TableCell>{p.creditsBought}</TableCell>
                      <TableCell>{p.amountPaid} {p.currency}</TableCell>
                      <TableCell>{p.paymentProvider}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{p.paymentRef}</TableCell>
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

              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <span>{data?.total} total payments</span>
                <div className="flex gap-2 items-center">
                  <Button variant="outline" className="h-8 w-8 p-0" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft size={14} />
                  </Button>
                  <span className="px-2">Page {page} / {data?.pages}</span>
                  <Button variant="outline" className="h-8 w-8 p-0" disabled={page >= (data?.pages ?? 1)} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
