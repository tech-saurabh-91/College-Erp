"use client"
import { useEffect, useState } from "react"
import { Plus, X, Search, Edit, Trash2, Bus, MapPin, Users, CreditCard, User, Phone, IdCard, Calendar, CheckCircle, XCircle } from "lucide-react"
import { useSession } from "next-auth/react"
import { usePermissions } from "@/lib/permissions"

type TabType = "routes" | "vehicles" | "drivers" | "passes"
interface TransportRoute { id: string; name: string; startPoint: string; endPoint: string; distance?: number; fee: number; capacity: number; isActive: boolean; vehicles?: TransportVehicle[] }
interface TransportVehicle { id: string; routeId: string; vehicleNo: string; type: string; capacity: number; driverId?: string; isActive: boolean; route?: TransportRoute; driver?: TransportDriver }
interface TransportDriver { id: string; name: string; phone: string; licenseNo: string; address: string; isActive: boolean; vehicles?: TransportVehicle[] }
interface TransportPass { id: string; studentId: string; routeId: string; amount: number; issueDate: string; expiryDate: string; status: string; student?: { id: string; rollNo: string; firstName: string; lastName: string }; route?: TransportRoute }

const tabs: { key: TabType; label: string; icon: any }[] = [
  { key: "routes", label: "Routes", icon: MapPin },
  { key: "vehicles", label: "Vehicles", icon: Bus },
  { key: "drivers", label: "Drivers", icon: Users },
  { key: "passes", label: "Passes", icon: CreditCard },
]

const statusColors: Record<string, string> = {
  ACTIVE: "badge-success", EXPIRED: "badge-warning", CANCELLED: "badge-danger",
}

export default function TransportPage() {
  const [activeTab, setActiveTab] = useState<TabType>("routes")
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<"route" | "vehicle" | "driver" | "pass">("route")
  const [editingItem, setEditingItem] = useState<any>(null)
  const { data: session } = useSession()
  const { can } = usePermissions(session)

  useEffect(() => { fetchData() }, [activeTab])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/transport?type=${activeTab}`)
      const json = await res.json()
      setData(Array.isArray(json) ? json : [])
    } catch { setData([]) }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Transport Management</h1>
        <div className="flex gap-2">
          {activeTab === "routes" && can('transport', 'create') && <button onClick={() => { setEditingItem(null); setModalType("route"); setShowModal(true) }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Route</button>}
          {activeTab === "vehicles" && can('transport', 'create') && <button onClick={() => { setEditingItem(null); setModalType("vehicle"); setShowModal(true) }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Vehicle</button>}
          {activeTab === "drivers" && can('transport', 'create') && <button onClick={() => { setEditingItem(null); setModalType("driver"); setShowModal(true) }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Driver</button>}
          {activeTab === "passes" && can('transport', 'create') && <button onClick={() => { setModalType("pass"); setShowModal(true) }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Issue Pass</button>}
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === tab.key ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "routes" && <RoutesView data={data} onRefresh={fetchData} setShowModal={setShowModal} setEditingItem={setEditingItem} setModalType={setModalType} can={can} />}
      {activeTab === "vehicles" && <VehiclesView data={data} onRefresh={fetchData} setShowModal={setShowModal} setEditingItem={setEditingItem} setModalType={setModalType} can={can} />}
      {activeTab === "drivers" && <DriversView data={data} onRefresh={fetchData} setShowModal={setShowModal} setEditingItem={setEditingItem} setModalType={setModalType} can={can} />}
      {activeTab === "passes" && <PassesView data={data} onRefresh={fetchData} />}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-gray-800">
                {modalType === "route" ? (editingItem ? "Edit Route" : "Add Route") : modalType === "vehicle" ? (editingItem ? "Edit Vehicle" : "Add Vehicle") : modalType === "driver" ? (editingItem ? "Edit Driver" : "Add Driver") : "Issue Pass"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            {modalType === "route" && <RouteForm edit={editingItem} onClose={() => { setShowModal(false); fetchData() }} />}
            {modalType === "vehicle" && <VehicleForm edit={editingItem} onClose={() => { setShowModal(false); fetchData() }} />}
            {modalType === "driver" && <DriverForm edit={editingItem} onClose={() => { setShowModal(false); fetchData() }} />}
            {modalType === "pass" && <PassForm onClose={() => { setShowModal(false); fetchData() }} />}
          </div>
        </div>
      )}
    </div>
  )
}

function RoutesView({ data, onRefresh, setShowModal, setEditingItem, setModalType, can }: any) {
  const [search, setSearch] = useState("")
  const filtered = data.filter((r: TransportRoute) =>
    !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.startPoint?.toLowerCase().includes(search.toLowerCase()) || r.endPoint?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: string) {
    if (!confirm("Delete this route?")) return
    await fetch(`/api/transport?type=route&id=${id}`, { method: "DELETE" })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search routes..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r: TransportRoute) => (
          <div key={r.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800 flex items-center gap-2"><MapPin size={16} className="text-blue-500" /> {r.name}</h3>
                <p className="text-xs text-gray-500">{r.startPoint} → {r.endPoint}</p>
              </div>
              <div className="flex gap-1">
                {can('transport', 'update') && <button onClick={() => { setEditingItem(r); setModalType("route"); setShowModal(true) }} className="p-1 hover:bg-blue-50 rounded text-blue-600"><Edit size={14} /></button>}
                {can('transport', 'delete') && <button onClick={() => handleDelete(r.id)} className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14} /></button>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Distance:</span> <span className="font-medium">{r.distance ? `${r.distance} km` : "N/A"}</span></div>
              <div><span className="text-gray-500">Fee:</span> <span className="font-medium text-blue-600">₹{r.fee}</span></div>
              <div><span className="text-gray-500">Capacity:</span> <span className="font-medium">{r.capacity}</span></div>
              <div><span className="text-gray-500">Vehicles:</span> <span className="font-medium">{r.vehicles?.length || 0}</span></div>
            </div>
            <div className="mt-3">
              <span className={`badge ${r.isActive ? "badge-success" : "badge-danger"}`}>{r.isActive ? "Active" : "Inactive"}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="col-span-full text-center py-10 text-gray-500">No routes found</p>}
      </div>
    </div>
  )
}

function RouteForm({ edit, onClose }: { edit: any; onClose: () => void }) {
  const [form, setForm] = useState({
    name: edit?.name || "", startPoint: edit?.startPoint || "", endPoint: edit?.endPoint || "",
    distance: edit?.distance?.toString() || "", fee: edit?.fee?.toString() || "0", capacity: edit?.capacity?.toString() || "40",
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/transport", {
        method: edit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edit ? { ...form, type: "route", id: edit.id } : { ...form, type: "route" }),
      })
      onClose()
    } catch { alert("Failed") }
    setSaving(false)
  }
  function upd(f: string, v: any) { setForm({ ...form, [f]: v }) }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Route Name</label><input required value={form.name} onChange={e => upd("name", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Point</label><input required value={form.startPoint} onChange={e => upd("startPoint", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">End Point</label><input required value={form.endPoint} onChange={e => upd("endPoint", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label><input type="number" value={form.distance} onChange={e => upd("distance", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Fee (₹)</label><input type="number" required value={form.fee} onChange={e => upd("fee", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label><input type="number" required min={1} value={form.capacity} onChange={e => upd("capacity", e.target.value)} className="input-field" /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : edit ? "Update" : "Add Route"}</button>
      </div>
    </form>
  )
}

function VehiclesView({ data, onRefresh, setShowModal, setEditingItem, setModalType, can }: any) {
  const [search, setSearch] = useState("")
  const filtered = data.filter((v: TransportVehicle) =>
    !search || v.vehicleNo?.toLowerCase().includes(search.toLowerCase()) || v.route?.name?.toLowerCase().includes(search.toLowerCase()) || v.driver?.name?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: string) {
    if (!confirm("Delete this vehicle?")) return
    await fetch(`/api/transport?type=vehicle&id=${id}`, { method: "DELETE" })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search vehicles..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
      </div>
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>
            <th className="table-header">Vehicle No</th>
            <th className="table-header">Type</th>
            <th className="table-header">Capacity</th>
            <th className="table-header">Route</th>
            <th className="table-header">Driver</th>
            <th className="table-header">Status</th>
            <th className="table-header">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map((v: TransportVehicle) => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium font-mono">{v.vehicleNo}</td>
                <td className="table-cell"><span className="badge badge-info">{v.type}</span></td>
                <td className="table-cell">{v.capacity}</td>
                <td className="table-cell max-w-[150px] truncate">{v.route?.name || "-"}</td>
                <td className="table-cell">{v.driver?.name || "-"}</td>
                <td className="table-cell"><span className={`badge ${v.isActive ? "badge-success" : "badge-danger"}`}>{v.isActive ? "Active" : "Inactive"}</span></td>
                <td className="table-cell">
                  <div className="flex gap-1">
                    {can('transport', 'update') && <button onClick={() => { setEditingItem(v); setModalType("vehicle"); setShowModal(true) }} className="p-1 hover:bg-blue-50 rounded text-blue-600"><Edit size={14} /></button>}
                    {can('transport', 'delete') && <button onClick={() => handleDelete(v.id)} className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14} /></button>}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-500">No vehicles found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function VehicleForm({ edit, onClose }: { edit: any; onClose: () => void }) {
  const [routes, setRoutes] = useState<TransportRoute[]>([])
  const [drivers, setDrivers] = useState<TransportDriver[]>([])
  const [form, setForm] = useState({
    routeId: edit?.routeId || "", vehicleNo: edit?.vehicleNo || "", type: edit?.type || "BUS",
    capacity: edit?.capacity?.toString() || "40", driverId: edit?.driverId || "",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/transport?type=routes").then(r => r.json()).then(setRoutes)
    fetch("/api/transport?type=drivers").then(r => r.json()).then(d => setDrivers(d.filter((dr: TransportDriver) => dr.isActive)))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/transport", {
        method: edit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edit ? { ...form, type: "vehicle", id: edit.id } : { ...form, type: "vehicle" }),
      })
      onClose()
    } catch { alert("Failed") }
    setSaving(false)
  }
  function upd(f: string, v: any) { setForm({ ...form, [f]: v }) }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
          <select required value={form.routeId} onChange={e => upd("routeId", e.target.value)} className="input-field">
            <option value="">Select route</option>
            {routes.map(r => <option key={r.id} value={r.id}>{r.name} ({r.startPoint}→{r.endPoint})</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Vehicle No</label><input required value={form.vehicleNo} onChange={e => upd("vehicleNo", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select value={form.type} onChange={e => upd("type", e.target.value)} className="input-field">
            <option value="BUS">Bus</option>
            <option value="VAN">Van</option>
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label><input type="number" required min={1} value={form.capacity} onChange={e => upd("capacity", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
          <select value={form.driverId} onChange={e => upd("driverId", e.target.value)} className="input-field">
            <option value="">No driver</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : edit ? "Update" : "Add Vehicle"}</button>
      </div>
    </form>
  )
}

function DriversView({ data, onRefresh, setShowModal, setEditingItem, setModalType, can }: any) {
  const [search, setSearch] = useState("")
  const filtered = data.filter((d: TransportDriver) =>
    !search || d.name?.toLowerCase().includes(search.toLowerCase()) || d.phone?.includes(search) || d.licenseNo?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: string) {
    if (!confirm("Delete this driver?")) return
    await fetch(`/api/transport?type=driver&id=${id}`, { method: "DELETE" })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search drivers..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((d: TransportDriver) => (
          <div key={d.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{d.name}</h3>
                  <p className="text-xs text-gray-500"><Phone size={12} className="inline" /> {d.phone}</p>
                </div>
              </div>
              <div className="flex gap-1">
                {can('transport', 'update') && <button onClick={() => { setEditingItem(d); setModalType("driver"); setShowModal(true) }} className="p-1 hover:bg-blue-50 rounded text-blue-600"><Edit size={14} /></button>}
                {can('transport', 'delete') && <button onClick={() => handleDelete(d.id)} className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14} /></button>}
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><IdCard size={14} className="text-gray-400" /><span className="text-gray-500">License:</span><span className="font-medium">{d.licenseNo}</span></div>
              <div className="flex items-center gap-2"><MapPin size={14} className="text-gray-400" /><span className="text-gray-500">Address:</span><span className="text-gray-700">{d.address}</span></div>
              <div><span className={`badge ${d.isActive ? "badge-success" : "badge-danger"}`}>{d.isActive ? "Active" : "Inactive"}</span></div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="col-span-full text-center py-10 text-gray-500">No drivers found</p>}
      </div>
    </div>
  )
}

function DriverForm({ edit, onClose }: { edit: any; onClose: () => void }) {
  const [form, setForm] = useState({
    name: edit?.name || "", phone: edit?.phone || "", licenseNo: edit?.licenseNo || "", address: edit?.address || "",
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/transport", {
        method: edit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edit ? { ...form, type: "driver", id: edit.id } : { ...form, type: "driver" }),
      })
      onClose()
    } catch { alert("Failed") }
    setSaving(false)
  }
  function upd(f: string, v: any) { setForm({ ...form, [f]: v }) }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input required value={form.name} onChange={e => upd("name", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input required value={form.phone} onChange={e => upd("phone", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">License No</label><input required value={form.licenseNo} onChange={e => upd("licenseNo", e.target.value)} className="input-field" /></div>
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea required rows={2} value={form.address} onChange={e => upd("address", e.target.value)} className="input-field" /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : edit ? "Update" : "Add Driver"}</button>
      </div>
    </form>
  )
}

function PassesView({ data, onRefresh }: { data: TransportPass[]; onRefresh: () => void }) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const filtered = data.filter((p: TransportPass) => {
    const matchSearch = !search || p.student?.firstName?.toLowerCase().includes(search.toLowerCase()) || p.student?.rollNo?.includes(search) || p.route?.name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || p.status === statusFilter
    return matchSearch && matchStatus
  })

  async function handleCancel(id: string) {
    if (!confirm("Cancel this pass?")) return
    await fetch("/api/transport", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "cancelPass", id }),
    })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search student or route..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>
            <th className="table-header">Student</th>
            <th className="table-header">Roll No</th>
            <th className="table-header">Route</th>
            <th className="table-header">Amount</th>
            <th className="table-header">Issue Date</th>
            <th className="table-header">Expiry Date</th>
            <th className="table-header">Status</th>
            <th className="table-header">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map((p: TransportPass) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{p.student?.firstName} {p.student?.lastName}</td>
                <td className="table-cell font-mono text-xs">{p.student?.rollNo}</td>
                <td className="table-cell max-w-[150px] truncate">{p.route?.name}</td>
                <td className="table-cell font-medium text-blue-600">₹{p.amount}</td>
                <td className="table-cell text-xs">{new Date(p.issueDate).toLocaleDateString()}</td>
                <td className="table-cell text-xs">{new Date(p.expiryDate).toLocaleDateString()}</td>
                <td className="table-cell"><span className={`badge ${statusColors[p.status] || "badge-default"}`}>{p.status}</span></td>
                <td className="table-cell">
                  {p.status === "ACTIVE" && (
                    <button onClick={() => handleCancel(p.id)} className="btn-secondary text-xs flex items-center gap-1"><XCircle size={12} /> Cancel</button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-gray-500">No passes found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PassForm({ onClose }: { onClose: () => void }) {
  const [students, setStudents] = useState<any[]>([])
  const [routes, setRoutes] = useState<TransportRoute[]>([])
  const [form, setForm] = useState({ studentId: "", routeId: "", amount: "", expiryDate: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/transport?type=students").then(r => r.json()).then(setStudents)
    fetch("/api/transport?type=routes").then(r => r.json()).then(setRoutes)
  }, [])

  useEffect(() => {
    const route = routes.find(r => r.id === form.routeId)
    if (route) setForm(prev => ({ ...prev, amount: route.fee.toString() }))
  }, [form.routeId, routes])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/transport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "pass", ...form, amount: parseFloat(form.amount) }),
      })
      onClose()
    } catch { alert("Failed") }
    setSaving(false)
  }
  function upd(f: string, v: any) { setForm({ ...form, [f]: v }) }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
          <select required value={form.studentId} onChange={e => upd("studentId", e.target.value)} className="input-field">
            <option value="">Select student</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.rollNo})</option>)}
          </select>
        </div>
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
          <select required value={form.routeId} onChange={e => upd("routeId", e.target.value)} className="input-field">
            <option value="">Select route</option>
            {routes.map(r => <option key={r.id} value={r.id}>{r.name} (₹{r.fee})</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label><input type="number" required value={form.amount} onChange={e => upd("amount", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label><input type="date" required value={form.expiryDate} onChange={e => upd("expiryDate", e.target.value)} className="input-field" /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Issuing..." : "Issue Pass"}</button>
      </div>
    </form>
  )
}
