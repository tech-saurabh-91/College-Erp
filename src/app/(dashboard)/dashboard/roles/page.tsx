"use client"
import { useEffect, useState } from "react"
import { Plus, Save, Shield, Trash2, X } from "lucide-react"
import { MODULES } from "@/lib/permissions"

interface Role {
  id: string; name: string; description: string; isSystem: boolean;
  permissions: RolePermission[];
  _count: { assignments: number };
}
interface RolePermission {
  id: string; roleId: string; permissionId: string;
  canCreate: boolean; canRead: boolean; canUpdate: boolean; canDelete: boolean;
  permission: { id: string; key: string; name: string; module: string };
}
interface Permission {
  id: string; key: string; name: string; module: string; description: string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [editingNew, setEditingNew] = useState(false)
  const [roleName, setRoleName] = useState("")
  const [roleDesc, setRoleDesc] = useState("")
  const [readMap, setReadMap] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [rRes, pRes] = await Promise.all([
        fetch("/api/roles"),
        fetch("/api/permissions"),
      ])
      setRoles(await rRes.json())
      setPermissions(await pRes.json())
    } catch { setRoles([]); setPermissions([]) }
    setLoading(false)
  }

  function loadRole(role: Role) {
    setSelectedRole(role)
    setEditingNew(false)
    setRoleName(role.name)
    setRoleDesc(role.description || "")
    const map: Record<string, boolean> = {}
    role.permissions.forEach(rp => { map[rp.permissionId] = rp.canRead })
    setReadMap(map)
  }

  function newRole() {
    setSelectedRole(null)
    setEditingNew(true)
    setRoleName("")
    setRoleDesc("")
    setReadMap({})
  }

  function toggleRead(permId: string) {
    setReadMap(prev => ({ ...prev, [permId]: !prev[permId] }))
  }

  function selectAll(checked: boolean) {
    const map: Record<string, boolean> = {}
    permissions.forEach(p => { map[p.id] = checked })
    setReadMap(map)
  }

  async function handleSave() {
    if (!roleName.trim()) { alert("Enter a role name"); return }
    setSaving(true)
    try {
      let roleId = selectedRole?.id
      if (editingNew || !roleId) {
        const res = await fetch("/api/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: roleName.trim(), description: roleDesc.trim() }),
        })
        const created = await res.json()
        roleId = created.id
      }
      const perms = permissions.map(p => ({
        permissionId: p.id,
        canRead: readMap[p.id] || false,
        canCreate: false, canUpdate: false, canDelete: false,
      }))
      await fetch(`/api/roles/${roleId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: perms }),
      })
      fetchAll()
      setEditingNew(false)
      setSelectedRole(null)
    } catch { alert("Failed to save") }
    setSaving(false)
  }

  async function handleDelete(role: Role) {
    if (role.isSystem) { alert("Cannot delete system role"); return }
    if (!confirm(`Delete role "${role.name}"?`)) return
    try {
      await fetch(`/api/roles/${role.id}`, { method: "DELETE" })
      if (selectedRole?.id === role.id) { setSelectedRole(null); setEditingNew(false) }
      fetchAll()
    } catch { alert("Failed to delete") }
  }

  const selectedPerms = permissions.map(p => ({
    ...p,
    canRead: readMap[p.id] || false,
  }))
  const allChecked = selectedPerms.length > 0 && selectedPerms.every(p => p.canRead)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Role Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Roles List */}
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Shield size={18} /> Roles</h2>
            <button onClick={newRole} className="btn-primary text-xs flex items-center gap-1"><Plus size={14} /> New</button>
          </div>
          {loading ? (
            <p className="p-4 text-gray-500">Loading...</p>
          ) : roles.length === 0 ? (
            <p className="p-4 text-gray-500 text-sm">No roles yet. Click "New" to create one.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {roles.map(role => (
                <div key={role.id}
                  onClick={() => loadRole(role)}
                  className={`p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${selectedRole?.id === role.id ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}>
                  <div>
                    <p className="font-medium text-gray-800">{role.name}</p>
                    <p className="text-xs text-gray-500">{role.description || "No description"} &middot; {role._count.assignments} users</p>
                  </div>
                  {!role.isSystem && (
                    <button onClick={e => { e.stopPropagation(); handleDelete(role) }}
                      className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 size={14} /></button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Role Editor */}
        <div className="card p-4">
          {!selectedRole && !editingNew ? (
            <div className="text-center py-16 text-gray-400">
              <Shield size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a role from the left</p>
              <p className="text-xs mt-1">or click "New" to create one</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">
                  {editingNew ? "New Role" : `Edit: ${selectedRole?.name}`}
                </h2>
                {(editingNew || selectedRole) && (
                  <button onClick={() => { setSelectedRole(null); setEditingNew(false) }}
                    className="p-1 hover:bg-gray-100 rounded"><X size={16} /></button>
                )}
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                  <input value={roleName} onChange={e => setRoleName(e.target.value)}
                    className="input-field" placeholder="e.g. Accountant" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input value={roleDesc} onChange={e => setRoleDesc(e.target.value)}
                    className="input-field" placeholder="Optional" />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Page Access (View)</h3>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                    <input type="checkbox" checked={allChecked} onChange={() => selectAll(!allChecked)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600" />
                    Select All
                  </label>
                </div>
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {selectedPerms.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                      <span className="text-sm text-gray-700">{p.name}</span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={p.canRead}
                          onChange={() => toggleRead(p.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                        <span className="text-xs text-gray-500">View</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                <button onClick={handleSave} disabled={saving || !roleName.trim()}
                  className="btn-primary flex items-center gap-2">
                  <Save size={15} /> {saving ? "Saving..." : editingNew ? "Create Role" : "Save Changes"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}