"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Skeleton } from "@/components/ui";
import { Search, ChevronLeft, ChevronRight, Plus, Minus } from "lucide-react";

type User = {
  id: string; email: string; firstName: string; lastName: string;
  credits: number; onboardingDone: boolean; createdAt: string;
  _count: { analytics: number };
};
type UsersRes = { users: User[]; total: number; page: number; pages: number };

export default function UsersPage() {
  const [data, setData] = useState<UsersRes | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [creditModal, setCreditModal] = useState<{ userId: string; name: string } | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const load = (p: number, q: string) => {
    setLoading(true);
    apiFetch<UsersRes>(`/admin/users?page=${p}&limit=20${q ? `&search=${encodeURIComponent(q)}` : ""}`)
      .then(setData).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(page, query); }, [page, query]);

  const handleSearch = () => { setPage(1); setQuery(search); };

  const adjustCredits = async () => {
    if (!creditModal || !creditAmount) return;
    setAdjusting(true);
    try {
      await apiFetch(`/admin/users/${creditModal.userId}/credits`, {
        method: "PATCH",
        body: JSON.stringify({ amount: parseInt(creditAmount), reason: creditReason || "Admin adjustment" }),
      });
      setCreditModal(null); setCreditAmount(""); setCreditReason("");
      load(page, query);
    } catch (e) { alert((e as Error).message); }
    finally { setAdjusting(false); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Users</h1>

      <Card>
        <CardHeader>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search by name or email…" value={search}
                onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} />
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-64 w-full" /> : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Forms</TableHead>
                    <TableHead>Onboarded</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.firstName} {u.lastName}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{u.email}</TableCell>
                      <TableCell>{u.credits}</TableCell>
                      <TableCell>{u._count.analytics}</TableCell>
                      <TableCell>
                        <Badge variant={u.onboardingDone ? "success" : "secondary"}>
                          {u.onboardingDone ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="outline" className="h-7 px-2 text-xs"
                            onClick={() => setCreditModal({ userId: u.id, name: `${u.firstName} ${u.lastName}` })}>
                            <Plus size={11} /> Credits
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <span>{data?.total} total users</span>
                <div className="flex gap-2">
                  <Button variant="outline" className="h-8 w-8 p-0" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft size={14} />
                  </Button>
                  <span className="flex items-center px-2">Page {page} / {data?.pages}</span>
                  <Button variant="outline" className="h-8 w-8 p-0" disabled={page >= (data?.pages ?? 1)} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Credit adjustment modal */}
      {creditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm">
            <CardHeader><CardTitle>Adjust Credits — {creditModal.name}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Amount (positive = add, negative = deduct)</label>
                <Input type="number" placeholder="e.g. 50 or -10" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Reason</label>
                <Input placeholder="e.g. Bonus for feedback" value={creditReason} onChange={e => setCreditReason(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={adjustCredits} disabled={!creditAmount || adjusting}>
                  {adjusting ? "Saving…" : "Apply"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setCreditModal(null)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
