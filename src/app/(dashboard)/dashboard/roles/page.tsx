"use client"
import { useEffect, useState } from "react"
import { Plus, X, Save, Shield, Trash2, Users, Check } from "lucide-react"
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
  const [showModal, setShowModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [permMap, setPermMap] = useState<Record<string, RolePermission>>({})

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

  function openPermissions(role: Role) {
    setSelectedRole(role)
    const map: Record<string, RolePermission> = {}
    role.permissions.forEach((rp) => {
      map[rp.permissionId] = rp
    })
    setPermMap(map)
    setShowModal(true)
  }

  function togglePerm(permId: string, field: "canCreate" | "canRead" | "canUpdate" | "canDelete") {
    setPermMap((prev) => {
      const existing = prev[permId]
      const updated = { ...prev }
      if (existing?.permissionId === permId) {
        updated[permId] = { ...existing, [field]: !existing[field] }
      } else {
        updated[permId] = {
          id: "", roleId: selectedRole?.id || "", permissionId: permId,
          canCreate: field === "canCreate" ? true : false,
          canRead: field === "canRead" ? true : false,
          canUpdate: field === "canUpdate" ? true : false,
          canDelete: field === "canDelete" ? true : false,
          permission: permissions.find(p => p.id === permId)!,
        }
      }
      return updated
    })
  }

  async function savePermissions() {
    if (!selectedRole) return
    try {
      await fetch(`/api/roles/${selectedRole.id}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permissions: Object.entries(permMap).map(([permissionId, rp]) => ({
            permissionId,
            canCreate: rp.canCreate,
            canRead: rp.canRead,
            canUpdate: rp.canUpdate,
            canDelete: rp.canDelete,
          })),
        }),
      })
      setShowModal(false)
      fetchAll()
    } catch { alert("Failed to save permissions") }
  }

  async function handleDelete(role: Role) {
    if (role.isSystem) { alert("Cannot delete system role"); return }
    if (!confirm(`Delete role "${role.name}"?`)) return
    try {
      await fetch(`/api/roles/${role.id}`, { method: "DELETE" })
      fetchAll()
    } catch { alert("Failed to delete") }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Roles & Permissions</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roles List */}
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Shield size={18} /> Roles</h2>
          </div>
          {loading ? (
            <p className="p-4 text-gray-500">Loading...</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {roles.map((role) => (
                <div key={role.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-800">{role.name}</p>
                    <p className="text-xs text-gray-500">{role.description} &middot; {role._count.assignments} users</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openPermissions(role)}
                      className="btn-secondary text-xs flex items-center gap-1"><Check size={14} /> Permissions</button>
                    {!role.isSystem && (
                      <button onClick={() => handleDelete(role)}
                        className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 size={14} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Permissions Preview for selected role */}
        <div className="card p-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4"><Shield size={18} /> Quick Overview</h2>
          {!selectedRole ? (
            <p className="text-gray-500 text-sm">Click "Permissions" on a role to manage its access</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {MODULES.map((mod) => {
                const perm = permissions.find(p => p.module === mod.key)
                if (!perm) return null
                const rp = permMap[perm.id]
                return (
                  <div key={mod.key} className="flex items-center justify-between pb-2 border-b border-gray-50">
                    <span className="text-sm font-medium text-gray-700">{mod.label}</span>
                    <div className="flex gap-3 text-xs">
                      <span className={rp?.canRead ? "text-green-600 font-medium" : "text-gray-300"}>View</span>
                      <span className={rp?.canCreate ? "text-green-600 font-medium" : "text-gray-300"}>Create</span>
                      <span className={rp?.canUpdate ? "text-green-600 font-medium" : "text-gray-300"}>Edit</span>
                      <span className={rp?.canDelete ? "text-green-600 font-medium" : "text-gray-300"}>Delete</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Permissions Modal */}
      {showModal && selectedRole && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Shield size={18} /> {selectedRole.name} - Permissions
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-2">
              {MODULES.map((mod) => {
                const perm = permissions.find(p => p.module === mod.key)
                if (!perm) return null
                const rp = permMap[perm.id]
                return (
                  <div key={mod.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
                    <span className="text-sm font-medium text-gray-700 w-1/3">{mod.label}</span>
                    <div className="flex gap-4">
                      {(["canRead", "canCreate", "canUpdate", "canDelete"] as const).map((field) => (
                        <label key={field} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={rp?.[field] || false}
                            onChange={() => togglePerm(perm.id, field)}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span className="text-xs text-gray-600 capitalize">{field.replace("can", "")}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={savePermissions} className="btn-primary flex items-center gap-2"><Save size={15} /> Save Permissions</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
