"use client"
import { useEffect, useState } from "react"
import { Plus, Search, X, Shield, CheckCircle, XCircle, Mail, Key, UserCheck, UserX } from "lucide-react"

interface Role {
  id: string; name: string; description: string | null; isSystem: boolean
}

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
  const [error, setError] = useState("")

  useEffect(() => { fetchUsers(); fetchRoles() }, [])

  async function fetchUsers() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (roleFilter) params.set("role", roleFilter)
    if (statusFilter) params.set("status", statusFilter)
    try {
      const res = await fetch(`/api/users?${params}`)
      setUsers(await res.json())
    } catch { setUsers([]) }
    setLoading(false)
  }

  async function fetchRoles() {
    try {
      const res = await fetch("/api/roles")
      setRoles(await res.json())
    } catch { setRoles([]) }
  }

  useEffect(() => { fetchUsers() }, [roleFilter, statusFilter])

  async function toggleStatus(userId: string, current: boolean) {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      })
      if (!res.ok) { const d = await res.json(); alert(d.error || "Failed") }
      fetchUsers()
    } catch { alert("Failed to update status") }
  }

  function openRoleModal(user: User) {
    setAssigningUser(user)
    setSelectedRoleIds(user.roleAssignments.map(ra => ra.role.id))
    setShowRoleModal(user.id)
  }

  async function saveRoles() {
    if (!assigningUser) return
    try {
      const res = await fetch(`/api/users/${assigningUser.id}/roles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleIds: selectedRoleIds }),
      })
      if (!res.ok) { const d = await res.json(); alert(d.error || "Failed") }
      setShowRoleModal(null)
      setAssigningUser(null)
      fetchUsers()
    } catch { alert("Failed to assign roles") }
  }

  function getProfileBadge(user: User) {
    if (user.student) return <span className="badge badge-info text-xs">{user.student.rollNo}</span>
    if (user.faculty) return <span className="badge badge-warning text-xs">{user.faculty.employeeId}</span>
    if (user.parent) return <span className="badge badge-secondary text-xs">Parent</span>
    return <span className="text-xs text-gray-400">—</span>
  }

  function getAssignedRoles(user: User) {
    return user.roleAssignments.map(ra => ra.role)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Master</h1>
          <p className="text-sm text-gray-500">Central user registry — manage logins, roles, and account status</p>
        </div>
        <button onClick={() => { setShowModal(true); setError("") }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by name, email, phone..." value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchUsers()}
            className="input-field pl-9" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="FACULTY">Faculty</option>
          <option value="STUDENT">Student</option>
          <option value="PARENT">Parent</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={fetchUsers} className="btn-secondary text-sm">Search</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Phone</th>
                <th className="table-header">Base Role</th>
                <th className="table-header">Linked Profile</th>
                <th className="table-header">Assigned Roles</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-500">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-500">No users found</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{u.name}</td>
                    <td className="table-cell text-sm">{u.email}</td>
                    <td className="table-cell text-sm">{u.phone || "-"}</td>
                    <td className="table-cell">
                      <span className={`badge ${u.role === "ADMIN" ? "badge-danger" : u.role === "FACULTY" ? "badge-warning" : u.role === "STUDENT" ? "badge-info" : "badge-secondary"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="table-cell">{getProfileBadge(u)}</td>
                    <td className="table-cell">
                      <div className="flex flex-wrap gap-1">
                        {getAssignedRoles(u).length === 0 ? (
                          <span className="text-xs text-gray-400">None</span>
                        ) : (
                          getAssignedRoles(u).slice(0, 2).map(r => (
                            <span key={r.id} className="badge badge-default text-xs">{r.name}</span>
                          ))
                        )}
                        {getAssignedRoles(u).length > 2 && (
                          <span className="text-xs text-gray-400">+{getAssignedRoles(u).length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      {u.isActive ? (
                        <span className="badge badge-success flex items-center gap-1 w-fit"><CheckCircle size={12} /> Active</span>
                      ) : (
                        <span className="badge badge-danger flex items-center gap-1 w-fit"><XCircle size={12} /> Inactive</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openRoleModal(u)}
                          className="p-1.5 hover:bg-purple-50 rounded text-purple-600" title="Assign Roles">
                          <Shield size={15} />
                        </button>
                        <button onClick={() => toggleStatus(u.id, u.isActive)}
                          className={`p-1.5 rounded ${u.isActive ? "hover:bg-red-50 text-red-600" : "hover:bg-green-50 text-green-600"}`}
                          title={u.isActive ? "Deactivate" : "Activate"}>
                          {u.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
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
              {roles.length === 0 ? (
                <p className="text-sm text-gray-500">No roles available. Create one in Roles & Permissions.</p>
              ) : (
                roles.map(r => (
                  <label key={r.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={selectedRoleIds.includes(r.id)}
                      onChange={() => {
                        setSelectedRoleIds(prev =>
                          prev.includes(r.id) ? prev.filter(id => id !== r.id) : [...prev, r.id]
                        )
                      }}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r.name}</p>
                      {r.description && <p className="text-xs text-gray-500">{r.description}</p>}
                    </div>
                    {r.isSystem && <span className="badge badge-default text-xs ml-auto">System</span>}
                  </label>
                ))
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={() => { setShowRoleModal(null); setAssigningUser(null) }} className="btn-secondary text-sm">Cancel</button>
              <button onClick={saveRoles} className="btn-primary text-sm">Save Roles</button>
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
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
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
        <div className="flex justify-end">
          <button onClick={onClose} className="btn-primary text-sm">Done</button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}
      <div>
        <label className="label">Full Name</label>
        <input type="text" className="input-field" value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" required />
      </div>
      <div>
        <label className="label">Email</label>
        <input type="email" className="input-field" value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" required />
      </div>
      <div>
        <label className="label">Phone</label>
        <input type="text" className="input-field" value={form.phone}
          onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91-9876543210" />
      </div>
      <div>
        <label className="label">Password</label>
        <input type="text" className="input-field" value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })} required />
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Key size={12} /> Default: changeme123 — change before sharing</p>
      </div>
      <div>
        <label className="label">Base Role</label>
        <select className="input-field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
          <option value="STUDENT">Student</option>
          <option value="FACULTY">Faculty</option>
          <option value="ADMIN">Admin</option>
          <option value="PARENT">Parent</option>
        </select>
      </div>
      <div>
        <label className="label">Assign Custom Roles</label>
        <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
          {roles.length === 0 ? (
            <p className="text-sm text-gray-400">No custom roles yet. Create them in Roles & Permissions.</p>
          ) : (
            roles.map(r => (
              <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.roleIds.includes(r.id)}
                  onChange={() => setForm(prev => ({
                    ...prev,
                    roleIds: prev.roleIds.includes(r.id) ? prev.roleIds.filter(id => id !== r.id) : [...prev.roleIds, r.id]
                  }))}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                <span className="text-sm">{r.name}</span>
                {r.isSystem && <span className="badge badge-default text-xs">System</span>}
              </label>
            ))
          )}
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? "Creating..." : "Create User"}</button>
      </div>
    </form>
  )
}
