"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Skeleton } from "@/components/ui";
import { Plus, Trash2 } from "lucide-react";

type Admin = { id: string; email: string; name: string; role: string; isActive: boolean; createdAt: string };

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", role: "SUPPORT_ADMIN" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    apiFetch<Admin[]>("/admin/auth/admins").then(setAdmins).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const addAdmin = async () => {
    setSaving(true); setError("");
    try {
      await apiFetch("/admin/auth/admins", { method: "POST", body: JSON.stringify(form) });
      setShowAdd(false); setForm({ email: "", name: "", role: "SUPPORT_ADMIN" }); load();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  const toggleActive = async (a: Admin) => {
    await apiFetch(`/admin/auth/admins/${a.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !a.isActive }) });
    load();
  };

  const deleteAdmin = async (id: string) => {
    if (!confirm("Delete this admin?")) return;
    await apiFetch(`/admin/auth/admins/${id}`, { method: "DELETE" });
    load();
  };

  const roleColor: Record<string, "default" | "secondary" | "destructive" | "success"> = {
    SUPER_ADMIN: "destructive", SUPPORT_ADMIN: "default", FINANCE_ADMIN: "success", ANALYTICS_VIEWER: "secondary",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admins</h1>
        <Button onClick={() => setShowAdd(v => !v)}><Plus size={14} /> Add Admin</Button>
      </div>

      {showAdd && (
        <Card>
          <CardHeader><CardTitle className="text-base">New Admin</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <Input placeholder="admin@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Name</label>
                <Input placeholder="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Role</label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {["SUPER_ADMIN", "SUPPORT_ADMIN", "FINANCE_ADMIN", "ANALYTICS_VIEWER"].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={addAdmin} disabled={!form.email || !form.name || saving}>{saving ? "Saving…" : "Create Admin"}</Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? <Skeleton className="h-48 w-full" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.email}</TableCell>
                    <TableCell><Badge variant={roleColor[a.role] ?? "secondary"}>{a.role.replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell><Badge variant={a.isActive ? "success" : "destructive"}>{a.isActive ? "Active" : "Suspended"}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" className="h-7 px-2 text-xs" onClick={() => toggleActive(a)}>
                          {a.isActive ? "Suspend" : "Activate"}
                        </Button>
                        <Button variant="outline" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={() => deleteAdmin(a.id)}>
                          <Trash2 size={12} />
                        </Button>
                      </div>
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
