"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/utils";
import {
  Card, CardContent, CardHeader, CardTitle,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Badge, Skeleton, Button,
} from "@/components/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";

type FormRow = {
  id: string;
  platform: string;
  websiteUrl: string;
  fieldsFilled: number;
  timeSavedSec: number;
  creditsUsed: number;
  aiEdits: number;
  acceptedDirect: boolean;
  createdAt: string;
  user: { email: string; firstName: string; lastName: string };
};

type FormsRes = {
  rows: FormRow[];
  total: number;
  page: number;
  pages: number;
};

export default function FormsPage() {
  const [data, setData] = useState<FormsRes | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch<FormsRes>(`/admin/forms?page=${page}&limit=50`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Forms</h1>

      <Card>
        <CardHeader><CardTitle>Form Fills</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Fields</TableHead>
                    <TableHead>Time Saved</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>AI Edits</TableHead>
                    <TableHead>Accepted</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{r.user.firstName} {r.user.lastName}</div>
                        <div className="text-xs text-muted-foreground">{r.user.email}</div>
                      </TableCell>
                      <TableCell>{r.platform}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">{r.websiteUrl}</TableCell>
                      <TableCell>{r.fieldsFilled}</TableCell>
                      <TableCell>{r.timeSavedSec}s</TableCell>
                      <TableCell>{r.creditsUsed}</TableCell>
                      <TableCell>{r.aiEdits}</TableCell>
                      <TableCell>
                        <Badge variant={r.acceptedDirect ? "success" : "secondary"}>
                          {r.acceptedDirect ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <span>{data?.total} total forms</span>
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
