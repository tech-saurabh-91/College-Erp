"use client"
import { useEffect, useState } from "react"
import { Plus, Search, X, Shield, CheckCircle, XCircle, Mail, Key, UserCheck, UserX, Settings } from "lucide-react"

const MODULES = [
  { key: "admission", label: "Admissions" }, { key: "student", label: "Students" },
  { key: "curriculum", label: "Curriculum" }, { key: "examination", label: "Examinations" },
  { key: "attendance", label: "Attendance" }, { key: "faculty", label: "Faculty" },
  { key: "fee", label: "Fee Management" }, { key: "account", label: "Accounts" },
  { key: "library", label: "Library" }, { key: "hostel", label: "Hostel" },
  { key: "hr", label: "HR & Payroll" }, { key: "transport", label: "Transport" },
  { key: "communication", label: "Communication" }, { key: "report", label: "Reports" },
  { key: "alumni", label: "Alumni" }, { key: "portal", label: "Portals" },
  { key: "timetable", label: "Timetable" }, { key: "settings", label: "Settings" },
]

interface Role { id: string; name: string; description: string | null; isSystem: boolean }
interface UserPerm { module: string; canCreate: boolean; canRead: boolean; canUpdate: boolean; canDelete: boolean }

interface User {
  id: string; name: string; email: string; phone: string | null; role: string;
  isActive: boolean; createdAt: string;
  roleAssignments: { role: Role }[];
  student: { id: string; rollNo: string } | null;
  faculty: { id: string; employeeId: string } | null;
  parent: { id: string } | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState<string | null>(null)
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
  const [assigningUser, setAssigningUser] = useState<User | null>(null)
  const [showPermModal, setShowPermModal] = useState<string | null>(null)
  const [userPerms, setUserPerms] = useState<Record<string, UserPerm>>({})

  useEffect(() => { fetchUsers(); fetchRoles() }, [])

  async function fetchUsers() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (roleFilter) params.set("role", roleFilter)
    if (statusFilter) params.set("status", statusFilter)
    try { const res = await fetch(`/api/users?${params}`); setUsers(await res.json()) }
    catch { setUsers([]) }
    setLoading(false)
  }

  async function fetchRoles() {
    try { const res = await fetch("/api/roles"); setRoles(await res.json()) }
    catch { setRoles([]) }
  }

  useEffect(() => { fetchUsers() }, [roleFilter, statusFilter])

  async function toggleStatus(userId: string, current: boolean) {
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !current }) })
      if (!res.ok) { const d = await res.json(); alert(d.error || "Failed") }
      fetchUsers()
    } catch { alert("Failed to update status") }
  }

  function openRoleModal(user: User) {
    setAssigningUser(user); setSelectedRoleIds(user.roleAssignments.map(ra => ra.role.id)); setShowRoleModal(user.id)
  }

  async function saveRoles() {
    if (!assigningUser) return
    try {
      const res = await fetch(`/api/users/${assigningUser.id}/roles`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roleIds: selectedRoleIds }) })
      if (!res.ok) { const d = await res.json(); alert(d.error || "Failed") }
      setShowRoleModal(null); setAssigningUser(null); fetchUsers()
    } catch { alert("Failed to assign roles") }
  }

  async function openPermModal(user: User) {
    setAssigningUser(user)
    try {
      const res = await fetch(`/api/users/${user.id}/permissions`)
      if (res.ok) {
        const data = await res.json()
        const map: Record<string, UserPerm> = {}
        for (const p of data) map[p.module] = p
        setUserPerms(map)
      }
    } catch {}
    setShowPermModal(user.id)
  }

  function togglePerm(module: string, field: "canCreate" | "canRead" | "canUpdate" | "canDelete") {
    setUserPerms(prev => {
      const existing = prev[module] || { module, canCreate: false, canRead: false, canUpdate: false, canDelete: false }
      return { ...prev, [module]: { ...existing, [field]: !existing[field] } }
    })
  }

  async function saveUserPerms() {
    if (!assigningUser) return
    try {
      const perms = Object.entries(userPerms).map(([mod, p]) => ({ module: mod, canCreate: p.canCreate, canRead: p.canRead, canUpdate: p.canUpdate, canDelete: p.canDelete }))
      const res = await fetch(`/api/users/${assigningUser.id}/permissions`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ permissions: perms }) })
      if (!res.ok) alert("Failed to save")
      setShowPermModal(null); setAssigningUser(null)
    } catch { alert("Failed to save permissions") }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Master</h1>
          <p className="text-sm text-gray-500">Central user registry — manage logins, roles, permissions, and account status</p>
        </div>
        <button onClick={() => { setShowModal(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by name, email, phone..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && fetchUsers()} className="input-field pl-9" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option><option value="FACULTY">Faculty</option><option value="STUDENT">Student</option><option value="PARENT">Parent</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option>
        </select>
        <button onClick={fetchUsers} className="btn-secondary text-sm">Search</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Name</th><th className="table-header">Email</th><th className="table-header">Base Role</th>
                <th className="table-header">Profile</th><th className="table-header">Assigned Roles</th><th className="table-header">Status</th><th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500">No users found</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{u.name}</td>
                  <td className="table-cell text-sm">{u.email}</td>
                  <td className="table-cell">
                    <span className={`badge ${u.role === "ADMIN" ? "badge-danger" : u.role === "FACULTY" ? "badge-warning" : u.role === "STUDENT" ? "badge-info" : "badge-secondary"}`}>{u.role}</span>
                  </td>
                  <td className="table-cell text-xs">{u.student ? u.student.rollNo : u.faculty ? u.faculty.employeeId : u.parent ? "Parent" : "—"}</td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-1">
                      {u.roleAssignments.length === 0 ? <span className="text-xs text-gray-400">None</span> : u.roleAssignments.slice(0, 2).map(ra => <span key={ra.role.id} className="badge badge-default text-xs">{ra.role.name}</span>)}
                      {u.roleAssignments.length > 2 && <span className="text-xs text-gray-400">+{u.roleAssignments.length - 2}</span>}
                    </div>
                  </td>
                  <td className="table-cell">
                    {u.isActive ? <span className="badge badge-success flex items-center gap-1 w-fit"><CheckCircle size={12} /> Active</span> : <span className="badge badge-danger flex items-center gap-1 w-fit"><XCircle size={12} /> Inactive</span>}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openRoleModal(u)} className="p-1.5 hover:bg-purple-50 rounded text-purple-600" title="Assign Roles"><Shield size={15} /></button>
                      <button onClick={() => openPermModal(u)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600" title="Page Permissions"><Settings size={15} /></button>
                      <button onClick={() => toggleStatus(u.id, u.isActive)} className={`p-1.5 rounded ${u.isActive ? "hover:bg-red-50 text-red-600" : "hover:bg-green-50 text-green-600"}`} title={u.isActive ? "Deactivate" : "Activate"}>
                        {u.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Add User</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <UserForm onClose={() => { setShowModal(false); fetchUsers() }} roles={roles} />
          </div>
        </div>
      )}

      {showRoleModal && assigningUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowRoleModal(null); setAssigningUser(null) }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Assign Roles — {assigningUser.name}</h2>
              <button onClick={() => { setShowRoleModal(null); setAssigningUser(null) }} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
              {roles.length === 0 ? <p className="text-sm text-gray-500">No roles available.</p> : roles.map(r => (
                <label key={r.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={selectedRoleIds.includes(r.id)} onChange={() => setSelectedRoleIds(prev => prev.includes(r.id) ? prev.filter(id => id !== r.id) : [...prev, r.id])} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                  <div><p className="text-sm font-medium text-gray-800">{r.name}</p>{r.description && <p className="text-xs text-gray-500">{r.description}</p>}</div>
                  {r.isSystem && <span className="badge badge-default text-xs ml-auto">System</span>}
                </label>
              ))}
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={() => { setShowRoleModal(null); setAssigningUser(null) }} className="btn-secondary text-sm">Cancel</button>
              <button onClick={saveRoles} className="btn-primary text-sm">Save Roles</button>
            </div>
          </div>
        </div>
      )}

      {showPermModal && assigningUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowPermModal(null); setAssigningUser(null) }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-800">Button-Level Permissions — {assigningUser.name}</h2>
              <button onClick={() => { setShowPermModal(null); setAssigningUser(null) }} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-1">
              <p className="text-xs text-gray-500 mb-3">Override CRUD access for each module. These override role-based permissions.</p>
              {MODULES.map(mod => {
                const p = userPerms[mod.key] || { module: mod.key, canCreate: false, canRead: false, canUpdate: false, canDelete: false }
                return (
                  <div key={mod.key} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 border border-gray-100">
                    <span className="text-sm font-medium text-gray-700 w-1/3">{mod.label}</span>
                    <div className="flex gap-4">
                      {(["canRead", "canCreate", "canUpdate", "canDelete"] as const).map(field => (
                        <label key={field} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={p[field]} onChange={() => togglePerm(mod.key, field)} className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600" />
                          <span className="text-xs text-gray-600 capitalize">{field.replace("can", "")}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={() => { setShowPermModal(null); setAssigningUser(null) }} className="btn-secondary text-sm">Cancel</button>
              <button onClick={saveUserPerms} className="btn-primary text-sm">Save Permissions</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function UserForm({ onClose, roles }: { onClose: () => void; roles: Role[] }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "changeme123", role: "STUDENT", roleIds: [] as string[] })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [createdUser, setCreatedUser] = useState<any>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) { setError("Name, email, and password are required"); return }
    setSaving(true); setError("")
    try {
      const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Failed to create"); setSaving(false); return }
      setCreatedUser(data)
    } catch { setError("Failed to create user"); setSaving(false) }
    setSaving(false)
  }

  if (createdUser) {
    return (
      <div className="p-5 space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium flex items-center gap-2"><CheckCircle size={18} /> User Created Successfully</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <p><strong>Name:</strong> {createdUser.name}</p>
          <p><strong>Email:</strong> {createdUser.email}</p>
          <p><strong>Password:</strong> <code className="bg-gray-200 px-2 py-0.5 rounded">{form.password}</code></p>
          <p className="text-xs text-gray-500 flex items-center gap-1"><Mail size={12} /> Login credentials would be sent to {createdUser.email}</p>
        </div>
        <div className="flex justify-end"><button onClick={onClose} className="btn-primary text-sm">Done</button></div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}
      <div><label className="label">Full Name</label><input type="text" className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
      <div><label className="label">Email</label><input type="email" className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
      <div><label className="label">Phone</label><input type="text" className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
      <div><label className="label">Password</label><input type="text" className="input-field" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Key size={12} /> Default: changeme123</p></div>
      <div><label className="label">Base Role</label><select className="input-field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
        <option value="STUDENT">Student</option><option value="FACULTY">Faculty</option><option value="ADMIN">Admin</option><option value="PARENT">Parent</option>
      </select></div>
      <div><label className="label">Assign Roles</label>
        <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
          {roles.length === 0 ? <p className="text-sm text-gray-400">No custom roles yet.</p> : roles.map(r => (
            <label key={r.id} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.roleIds.includes(r.id)} onChange={() => setForm(prev => ({ ...prev, roleIds: prev.roleIds.includes(r.id) ? prev.roleIds.filter(id => id !== r.id) : [...prev.roleIds, r.id] }))} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
              <span className="text-sm">{r.name}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? "Creating..." : "Create User"}</button>
      </div>
    </form>
  )
}
