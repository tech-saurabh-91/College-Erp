"use client"
import { useEffect, useState } from "react"
import { Plus, X, Search, Edit, Trash2, Building2, BedDouble, Users, UtensilsCrossed, LogIn, LogOut, Home, UserCheck, DoorOpen, ClipboardList } from "lucide-react"

type TabType = "rooms" | "allocations" | "mess" | "visitors"
interface Hostel { id: string; name: string; type: string; address: string; phone?: string; totalRooms: number }
interface HostelRoom { id: string; hostelId: string; roomNo: string; type: string; capacity: number; occupied: number; rent: number; floor?: number; isActive: boolean; hostel?: Hostel; allocations?: HostelAllocation[] }
interface HostelAllocation { id: string; studentId: string; roomId: string; startDate: string; endDate?: string; status: string; student?: { id: string; rollNo: string; firstName: string; lastName: string }; room?: HostelRoom }
interface MessMenu { id: string; day: string; meal: string; items: string; hostelId: string }
interface Visitor { id: string; studentId: string; visitorName: string; relation: string; phone: string; entryTime: string; exitTime?: string; purpose: string; student?: { id: string; rollNo: string; firstName: string; lastName: string } }

const tabs: { key: TabType; label: string; icon: any }[] = [
  { key: "rooms", label: "Rooms", icon: BedDouble },
  { key: "allocations", label: "Allocations", icon: Users },
  { key: "mess", label: "Mess Menu", icon: UtensilsCrossed },
  { key: "visitors", label: "Visitors", icon: LogIn },
]

const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]
const meals = ["BREAKFAST", "LUNCH", "SNACKS", "DINNER"]

const statusColors: Record<string, string> = {
  ACTIVE: "badge-success", INACTIVE: "badge-danger", COMPLETED: "badge-info",
}

export default function HostelPage() {
  const [activeTab, setActiveTab] = useState<TabType>("rooms")
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<"room" | "allocate" | "mess" | "visitor">("room")
  const [editingItem, setEditingItem] = useState<any>(null)

  useEffect(() => { fetchData() }, [activeTab])

  async function fetchData() {
    setLoading(true)
    try {
      let type = activeTab
      if (activeTab === "rooms") type = "rooms"
      const res = await fetch(`/api/hostel?type=${type}`)
      const json = await res.json()
      setData(Array.isArray(json) ? json : [])
    } catch { setData([]) }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Hostel Management</h1>
        <div className="flex gap-2">
          {activeTab === "rooms" && <button onClick={() => { setEditingItem(null); setModalType("room"); setShowModal(true) }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Room</button>}
          {activeTab === "allocations" && <button onClick={() => { setModalType("allocate"); setShowModal(true) }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Allocate Room</button>}
          {activeTab === "mess" && <button onClick={() => { setEditingItem(null); setModalType("mess"); setShowModal(true) }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Menu Item</button>}
          {activeTab === "visitors" && <button onClick={() => { setModalType("visitor"); setShowModal(true) }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Log Visitor</button>}
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

      {activeTab === "rooms" && <RoomsView data={data} onRefresh={fetchData} setShowModal={setShowModal} setEditingItem={setEditingItem} setModalType={setModalType} />}
      {activeTab === "allocations" && <AllocationsView data={data} onRefresh={fetchData} setShowModal={setShowModal} setModalType={setModalType} />}
      {activeTab === "mess" && <MessView data={data} onRefresh={fetchData} setShowModal={setShowModal} setEditingItem={setEditingItem} setModalType={setModalType} />}
      {activeTab === "visitors" && <VisitorsView data={data} onRefresh={fetchData} setShowModal={setShowModal} setModalType={setModalType} />}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-gray-800">
                {modalType === "room" ? (editingItem ? "Edit Room" : "Add Room") : modalType === "allocate" ? "Allocate Room" : modalType === "mess" ? (editingItem ? "Edit Menu Item" : "Add Menu Item") : "Log Visitor Entry"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            {modalType === "room" && <RoomForm edit={editingItem} onClose={() => { setShowModal(false); fetchData() }} />}
            {modalType === "allocate" && <AllocateForm onClose={() => { setShowModal(false); fetchData() }} />}
            {modalType === "mess" && <MessForm edit={editingItem} onClose={() => { setShowModal(false); fetchData() }} />}
            {modalType === "visitor" && <VisitorForm onClose={() => { setShowModal(false); fetchData() }} />}
          </div>
        </div>
      )}
    </div>
  )
}

function RoomsView({ data, onRefresh, setShowModal, setEditingItem, setModalType }: any) {
  const [search, setSearch] = useState("")
  const [hostelFilter, setHostelFilter] = useState("")
  const hostelMap = new Map<string, Hostel>()
  data.forEach((r: HostelRoom) => { if (r.hostel) hostelMap.set(r.hostel.id, r.hostel) })
  const hostels = Array.from(hostelMap.values())

  const filtered = data.filter((r: HostelRoom) => {
    const matchSearch = !search || r.roomNo?.includes(search) || r.hostel?.name?.toLowerCase().includes(search.toLowerCase())
    const matchHostel = !hostelFilter || r.hostelId === hostelFilter
    return matchSearch && matchHostel
  })

  async function handleDelete(id: string) {
    if (!confirm("Delete this room?")) return
    await fetch(`/api/hostel?type=room&id=${id}`, { method: "DELETE" })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search rooms..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
        </div>
        <select value={hostelFilter} onChange={e => setHostelFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Hostels</option>
          {hostels.map((h: Hostel) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r: HostelRoom) => {
          const pct = r.capacity > 0 ? Math.round((r.occupied / r.capacity) * 100) : 0
          return (
            <div key={r.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2"><DoorOpen size={16} className="text-blue-500" /> Room {r.roomNo}</h3>
                  <p className="text-xs text-gray-500">{r.hostel?.name}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingItem(r); setModalType("room"); setShowModal(true) }} className="p-1 hover:bg-blue-50 rounded text-blue-600"><Edit size={14} /></button>
                  <button onClick={() => handleDelete(r.id)} className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Type:</span> <span className="font-medium">{r.type}</span></div>
                <div><span className="text-gray-500">Floor:</span> <span className="font-medium">{r.floor || "G"}</span></div>
                <div><span className="text-gray-500">Capacity:</span> <span className="font-medium">{r.occupied}/{r.capacity}</span></div>
                <div><span className="text-gray-500">Rent:</span> <span className="font-medium text-blue-600">₹{r.rent}/mo</span></div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${pct >= 100 ? "bg-red-500" : pct >= 75 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">{pct}% occupied</p>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && <p className="col-span-full text-center py-10 text-gray-500">No rooms found</p>}
      </div>
    </div>
  )
}

function RoomForm({ edit, onClose }: { edit: any; onClose: () => void }) {
  const [hostels, setHostels] = useState<Hostel[]>([])
  const [form, setForm] = useState({
    hostelId: edit?.hostelId || "", roomNo: edit?.roomNo || "", type: edit?.type || "SINGLE",
    capacity: edit?.capacity?.toString() || "1", rent: edit?.rent?.toString() || "0", floor: edit?.floor?.toString() || "",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetch("/api/hostel?type=hostels").then(r => r.json()).then(setHostels) }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/hostel", {
        method: edit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edit ? { ...form, type: "room", id: edit.id } : { ...form, type: "room" }),
      })
      onClose()
    } catch { alert("Failed") }
    setSaving(false)
  }
  function upd(f: string, v: any) { setForm({ ...form, [f]: v }) }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Hostel</label>
          <select required value={form.hostelId} onChange={e => upd("hostelId", e.target.value)} className="input-field">
            <option value="">Select hostel</option>
            {hostels.map(h => <option key={h.id} value={h.id}>{h.name} ({h.type})</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Room No</label><input required value={form.roomNo} onChange={e => upd("roomNo", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Floor</label><input type="number" value={form.floor} onChange={e => upd("floor", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select value={form.type} onChange={e => upd("type", e.target.value)} className="input-field">
            <option value="SINGLE">Single</option>
            <option value="DOUBLE">Double</option>
            <option value="TRIPLE">Triple</option>
            <option value="DORMITORY">Dormitory</option>
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label><input type="number" required min={1} value={form.capacity} onChange={e => upd("capacity", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Rent (₹/mo)</label><input type="number" required value={form.rent} onChange={e => upd("rent", e.target.value)} className="input-field" /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : edit ? "Update" : "Add Room"}</button>
      </div>
    </form>
  )
}

function AllocationsView({ data, onRefresh, setShowModal, setModalType }: any) {
  const [search, setSearch] = useState("")
  const filtered = data.filter((a: HostelAllocation) =>
    !search || a.student?.firstName?.toLowerCase().includes(search.toLowerCase()) || a.student?.rollNo?.includes(search) || a.room?.roomNo?.includes(search)
  )

  async function handleDeallocate(id: string) {
    if (!confirm("Deallocate this student?")) return
    await fetch("/api/hostel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "deallocate", allocationId: id }),
    })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search student or room..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
      </div>
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>
            <th className="table-header">Student</th>
            <th className="table-header">Roll No</th>
            <th className="table-header">Hostel</th>
            <th className="table-header">Room</th>
            <th className="table-header">Start Date</th>
            <th className="table-header">Status</th>
            <th className="table-header">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map((a: HostelAllocation) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{a.student?.firstName} {a.student?.lastName}</td>
                <td className="table-cell font-mono text-xs">{a.student?.rollNo}</td>
                <td className="table-cell">{a.room?.hostel?.name}</td>
                <td className="table-cell font-medium">{a.room?.roomNo}</td>
                <td className="table-cell text-xs">{new Date(a.startDate).toLocaleDateString()}</td>
                <td className="table-cell"><span className={`badge ${statusColors[a.status] || "badge-default"}`}>{a.status}</span></td>
                <td className="table-cell">
                  {a.status === "ACTIVE" && (
                    <button onClick={() => handleDeallocate(a.id)} className="btn-secondary text-xs flex items-center gap-1"><LogOut size={12} /> Deallocate</button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-500">No allocations found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AllocateForm({ onClose }: { onClose: () => void }) {
  const [students, setStudents] = useState<any[]>([])
  const [rooms, setRooms] = useState<HostelRoom[]>([])
  const [form, setForm] = useState({ studentId: "", roomId: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/hostel?type=students").then(r => r.json()).then(setStudents)
    fetch("/api/hostel?type=rooms").then(r => r.json()).then(d => setRooms(d.filter((r: HostelRoom) => r.occupied < r.capacity)))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "allocate", ...form }),
      })
      onClose()
    } catch (err: any) { alert("Failed") }
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
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
          <select required value={form.roomId} onChange={e => upd("roomId", e.target.value)} className="input-field">
            <option value="">Select room</option>
            {rooms.map(r => <option key={r.id} value={r.id}>{r.hostel?.name} - Room {r.roomNo} ({r.type}, {r.occupied}/{r.capacity})</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Allocating..." : "Allocate Room"}</button>
      </div>
    </form>
  )
}

function MessView({ data, onRefresh, setShowModal, setEditingItem, setModalType }: any) {
  const [hostelFilter, setHostelFilter] = useState("")
  const hostelIds = [...new Set(data.map((m: MessMenu) => m.hostelId).filter(Boolean))] as string[]

  const filtered = data.filter((m: MessMenu) => !hostelFilter || m.hostelId === hostelFilter)

  async function handleDelete(id: string) {
    if (!confirm("Delete this menu item?")) return
    await fetch(`/api/hostel?type=mess&id=${id}`, { method: "DELETE" })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <select value={hostelFilter} onChange={e => setHostelFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Hostels</option>
          {hostelIds.map(id => <option key={id} value={id}>{id}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {days.map(day => (
          <div key={day} className="card">
            <h3 className="font-semibold text-gray-800 mb-3 capitalize">{day.toLowerCase()}</h3>
            <div className="space-y-3">
              {meals.map(meal => {
                const item = filtered.find((m: MessMenu) => m.day === day && m.meal === meal)
                return (
                  <div key={meal} className="border-b border-gray-100 pb-2 last:border-0">
                    <p className="text-xs font-medium text-gray-500">{meal}</p>
                    {item ? (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-700">{item.items}</p>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingItem(item); setModalType("mess"); setShowModal(true) }} className="p-1 hover:bg-blue-50 rounded text-blue-600"><Edit size={12} /></button>
                          <button onClick={() => handleDelete(item.id)} className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    ) : <p className="text-xs text-gray-400 italic">Not set</p>}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MessForm({ edit, onClose }: { edit: any; onClose: () => void }) {
  const [form, setForm] = useState({
    hostelId: edit?.hostelId || "", day: edit?.day || "MONDAY", meal: edit?.meal || "BREAKFAST", items: edit?.items || "",
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/hostel", {
        method: edit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edit ? { ...form, type: "mess", id: edit.id } : { ...form, type: "mess" }),
      })
      onClose()
    } catch { alert("Failed") }
    setSaving(false)
  }
  function upd(f: string, v: any) { setForm({ ...form, [f]: v }) }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Hostel</label>
          <select required value={form.hostelId} onChange={e => upd("hostelId", e.target.value)} className="input-field">
            <option value="">Select</option>
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
          <select value={form.day} onChange={e => upd("day", e.target.value)} className="input-field">
            {days.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Meal</label>
          <select value={form.meal} onChange={e => upd("meal", e.target.value)} className="input-field">
            {meals.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Menu Items</label>
          <textarea required rows={3} value={form.items} onChange={e => upd("items", e.target.value)} className="input-field" placeholder="e.g. Rice, Dal, Roti, Salad" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : edit ? "Update" : "Add Menu Item"}</button>
      </div>
    </form>
  )
}

function VisitorsView({ data, onRefresh, setShowModal, setModalType }: any) {
  const [search, setSearch] = useState("")
  const filtered = data.filter((v: Visitor) =>
    !search || v.visitorName?.toLowerCase().includes(search.toLowerCase()) || v.student?.firstName?.toLowerCase().includes(search.toLowerCase()) || v.student?.rollNo?.includes(search)
  )

  async function handleExit(id: string) {
    await fetch("/api/hostel", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "visitor", id }),
    })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search visitors..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
      </div>
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>
            <th className="table-header">Visitor Name</th>
            <th className="table-header">Relation</th>
            <th className="table-header">Phone</th>
            <th className="table-header">Student</th>
            <th className="table-header">Purpose</th>
            <th className="table-header">Entry Time</th>
            <th className="table-header">Exit Time</th>
            <th className="table-header">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map((v: Visitor) => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{v.visitorName}</td>
                <td className="table-cell text-xs">{v.relation}</td>
                <td className="table-cell font-mono text-xs">{v.phone}</td>
                <td className="table-cell">{v.student?.firstName} {v.student?.lastName} ({v.student?.rollNo})</td>
                <td className="table-cell text-xs max-w-[120px] truncate">{v.purpose}</td>
                <td className="table-cell text-xs">{new Date(v.entryTime).toLocaleString()}</td>
                <td className="table-cell text-xs">{v.exitTime ? new Date(v.exitTime).toLocaleString() : <span className="badge badge-success">In Campus</span>}</td>
                <td className="table-cell">
                  {!v.exitTime && (
                    <button onClick={() => handleExit(v.id)} className="btn-secondary text-xs flex items-center gap-1"><LogOut size={12} /> Mark Exit</button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-gray-500">No visitors found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function VisitorForm({ onClose }: { onClose: () => void }) {
  const [students, setStudents] = useState<any[]>([])
  const [form, setForm] = useState({ studentId: "", visitorName: "", relation: "", phone: "", purpose: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetch("/api/hostel?type=students").then(r => r.json()).then(setStudents) }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "visitor", ...form }),
      })
      onClose()
    } catch { alert("Failed") }
    setSaving(false)
  }
  function upd(f: string, v: any) { setForm({ ...form, [f]: v }) }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Student to Visit</label>
          <select required value={form.studentId} onChange={e => upd("studentId", e.target.value)} className="input-field">
            <option value="">Select student</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.rollNo})</option>)}
          </select>
        </div>
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Visitor Name</label><input required value={form.visitorName} onChange={e => upd("visitorName", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Relation</label><input required value={form.relation} onChange={e => upd("relation", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input required value={form.phone} onChange={e => upd("phone", e.target.value)} className="input-field" /></div>
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label><textarea required rows={2} value={form.purpose} onChange={e => upd("purpose", e.target.value)} className="input-field" /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Log Entry"}</button>
      </div>
    </form>
  )
}
