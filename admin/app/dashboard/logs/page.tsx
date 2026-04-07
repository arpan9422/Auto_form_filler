"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Skeleton } from "@/components/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Log = { id: string; level: string; context: string; message: string; meta: unknown; userId: string | null; createdAt: string };
type LogsRes = { logs: Log[]; total: number; page: number; pages: number };

const levelColor: Record<string, "default" | "destructive" | "secondary" | "success"> = {
  INFO: "secondary", WARN: "default", ERROR: "destructive", DEBUG: "secondary",
};

export default function LogsPage() {
  const [data, setData] = useState<LogsRes | null>(null);
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"app" | "requests">("app");

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (level) params.set("level", level);
    if (context) params.set("context", context);
    apiFetch<LogsRes>(`/admin/logs/${tab}?${params}`)
      .then(setData).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, tab]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">System Logs</h1>

      <div className="flex gap-2">
        {(["app", "requests"] as const).map(t => (
          <Button key={t} variant={tab === t ? "default" : "outline"} onClick={() => { setTab(t); setPage(1); }}>
            {t === "app" ? "App Logs" : "Request Logs"}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-3 flex-wrap">
            {tab === "app" && (
              <>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={level} onChange={e => setLevel(e.target.value)}>
                  <option value="">All Levels</option>
                  {["INFO", "WARN", "ERROR", "DEBUG"].map(l => <option key={l}>{l}</option>)}
                </select>
                <Input className="w-40" placeholder="Context…" value={context} onChange={e => setContext(e.target.value)} />
              </>
            )}
            <Button onClick={() => { setPage(1); load(); }}>Filter</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-64 w-full" /> : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    {tab === "app" ? (
                      <>
                        <TableHead>Level</TableHead>
                        <TableHead>Context</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>User</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead>Method</TableHead>
                        <TableHead>Path</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>User</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.logs as unknown[])?.map((log: unknown) => {
                    const l = log as Record<string, unknown>;
                    return (
                      <TableRow key={l.id as string}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(l.createdAt as string).toLocaleString()}
                        </TableCell>
                        {tab === "app" ? (
                          <>
                            <TableCell><Badge variant={levelColor[l.level as string] ?? "secondary"}>{l.level as string}</Badge></TableCell>
                            <TableCell className="text-xs font-mono">{l.context as string}</TableCell>
                            <TableCell className="text-xs max-w-xs truncate">{l.message as string}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{(l.userId as string) ?? "—"}</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="text-xs font-mono">{l.method as string}</TableCell>
                            <TableCell className="text-xs font-mono max-w-xs truncate">{l.path as string}</TableCell>
                            <TableCell>
                              <Badge variant={(l.statusCode as number) >= 500 ? "destructive" : (l.statusCode as number) >= 400 ? "default" : "success"}>
                                {l.statusCode as number}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{l.durationMs as number}ms</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{(l.userId as string) ?? "—"}</TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <span>{data?.total} total</span>
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
    </div>
  );
}
