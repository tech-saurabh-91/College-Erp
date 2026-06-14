"use client"
import { useEffect, useState } from "react"
import { Plus, X, Search, Edit, Trash2, Users, Briefcase, Calendar, DollarSign, MapPin, Phone, Mail, Globe, GraduationCap, Building2, Clock, CheckCircle } from "lucide-react"

type TabType = "alumni" | "jobs" | "events" | "donations"
interface Alumni { id: string; userId: string; studentId?: string; graduationYear: number; program: string; currentEmployer?: string; position?: string; linkedinUrl?: string; address?: string; phone: string; isVerified: boolean; createdAt: string; user?: { id: string; name: string; email: string } }
interface JobPost { id: string; company: string; title: string; description: string; location: string; salary?: string; contactEmail: string; postedBy?: string; postedAt: string; expiresAt?: string; isActive: boolean }
interface AlumniEvent { id: string; title: string; description?: string; date: string; venue?: string; type: string; maxAttendees?: number; createdAt: string }
interface Donation { id: string; alumniId: string; amount: number; purpose?: string; paymentMethod: string; date: string; alumni?: Alumni }

const tabs: { key: TabType; label: string; icon: any }[] = [
  { key: "alumni", label: "Alumni Directory", icon: GraduationCap },
  { key: "jobs", label: "Job Board", icon: Briefcase },
  { key: "events", label: "Events", icon: Calendar },
  { key: "donations", label: "Donations", icon: DollarSign },
]

const eventTypeColors: Record<string, string> = {
  MEETUP: "badge-info", WEBINAR: "badge-warning", REUNION: "badge-success", WORKSHOP: "badge-primary",
}

export default function AlumniPage() {
  const [activeTab, setActiveTab] = useState<TabType>("alumni")
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<"alumni" | "job" | "event" | "donation">("job")
  const [editingItem, setEditingItem] = useState<any>(null)

  useEffect(() => { fetchData() }, [activeTab])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/alumni?type=${activeTab}`)
      const json = await res.json()
      setData(Array.isArray(json) ? json : [])
    } catch { setData([]) }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Alumni Portal</h1>
        <div className="flex gap-2">
          {activeTab === "jobs" && <button onClick={() => { setEditingItem(null); setModalType("job"); setShowModal(true) }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Post Job</button>}
          {activeTab === "events" && <button onClick={() => { setEditingItem(null); setModalType("event"); setShowModal(true) }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Create Event</button>}
          {activeTab === "donations" && <button onClick={() => { setModalType("donation"); setShowModal(true) }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Record Donation</button>}
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

      {activeTab === "alumni" && <AlumniView data={data} />}
      {activeTab === "jobs" && <JobsView data={data} onRefresh={fetchData} setShowModal={setShowModal} setEditingItem={setEditingItem} setModalType={setModalType} />}
      {activeTab === "events" && <EventsView data={data} onRefresh={fetchData} setShowModal={setShowModal} setEditingItem={setEditingItem} setModalType={setModalType} />}
      {activeTab === "donations" && <DonationsView data={data} onRefresh={fetchData} />}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-gray-800">
                {modalType === "job" ? (editingItem ? "Edit Job" : "Post Job") : modalType === "event" ? (editingItem ? "Edit Event" : "Create Event") : "Record Donation"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            {modalType === "job" && <JobForm edit={editingItem} onClose={() => { setShowModal(false); fetchData() }} />}
            {modalType === "event" && <EventForm edit={editingItem} onClose={() => { setShowModal(false); fetchData() }} />}
            {modalType === "donation" && <DonationForm onClose={() => { setShowModal(false); fetchData() }} />}
          </div>
        </div>
      )}
    </div>
  )
}

function AlumniView({ data }: { data: Alumni[] }) {
  const [search, setSearch] = useState("")
  const [yearFilter, setYearFilter] = useState("")
  const filtered = data.filter((a: Alumni) => {
    const matchSearch = !search || a.user?.name?.toLowerCase().includes(search.toLowerCase()) || a.program?.toLowerCase().includes(search.toLowerCase()) || a.currentEmployer?.toLowerCase().includes(search.toLowerCase())
    const matchYear = !yearFilter || a.graduationYear.toString() === yearFilter
    return matchSearch && matchYear
  })

  const years = [...new Set(data.map((a: Alumni) => a.graduationYear).filter(Boolean))] as number[]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search alumni..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
        </div>
        <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Years</option>
          {years.sort((a, b) => b - a).map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((a: Alumni) => (
          <div key={a.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Users size={20} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 flex items-center gap-1">
                    {a.user?.name}
                    {a.isVerified && <span className="text-green-500"><CheckCircle size={14} /></span>}
                  </h3>
                  <p className="text-xs text-gray-500">{a.program} • {a.graduationYear}</p>
                </div>
              </div>
              <span className={`badge ${a.isVerified ? "badge-success" : "badge-warning"}`}>{a.isVerified ? "Verified" : "Pending"}</span>
            </div>
            <div className="space-y-1.5 text-sm">
              {a.currentEmployer && (
                <div className="flex items-center gap-2"><Building2 size={14} className="text-gray-400" /><span>{a.currentEmployer}{a.position ? ` - ${a.position}` : ""}</span></div>
              )}
              <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /><span>{a.phone}</span></div>
              {a.user?.email && <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /><span className="truncate">{a.user.email}</span></div>}
              {a.linkedinUrl && (
                <div className="flex items-center gap-2"><Globe size={14} className="text-gray-400" /><a href={a.linkedinUrl} target="_blank" className="text-blue-600 hover:underline truncate">LinkedIn</a></div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="col-span-full text-center py-10 text-gray-500">No alumni found</p>}
      </div>
    </div>
  )
}

function JobsView({ data, onRefresh, setShowModal, setEditingItem, setModalType }: any) {
  const [search, setSearch] = useState("")
  const filtered = data.filter((j: JobPost) =>
    !search || j.title?.toLowerCase().includes(search.toLowerCase()) || j.company?.toLowerCase().includes(search.toLowerCase()) || j.location?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: string) {
    if (!confirm("Delete this job post?")) return
    await fetch(`/api/alumni?type=job&id=${id}`, { method: "DELETE" })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((j: JobPost) => (
          <div key={j.id} className="card">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-gray-800">{j.title}</h3>
                <p className="text-sm text-gray-600 flex items-center gap-1"><Building2 size={14} /> {j.company}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingItem(j); setModalType("job"); setShowModal(true) }} className="p-1 hover:bg-blue-50 rounded text-blue-600"><Edit size={14} /></button>
                <button onClick={() => handleDelete(j.id)} className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14} /></button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{j.description}</p>
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-1"><MapPin size={12} /> {j.location}</span>
              {j.salary && <span className="flex items-center gap-1"><DollarSign size={12} /> {j.salary}</span>}
              <span className="flex items-center gap-1"><Mail size={12} /> {j.contactEmail}</span>
            </div>
            <div className="mt-2 text-xs text-gray-400">Posted {new Date(j.postedAt).toLocaleDateString()}{j.expiresAt ? ` • Expires ${new Date(j.expiresAt).toLocaleDateString()}` : ""}</div>
          </div>
        ))}
        {filtered.length === 0 && <p className="col-span-full text-center py-10 text-gray-500">No jobs posted</p>}
      </div>
    </div>
  )
}

function JobForm({ edit, onClose }: { edit: any; onClose: () => void }) {
  const [form, setForm] = useState({
    company: edit?.company || "", title: edit?.title || "", description: edit?.description || "",
    location: edit?.location || "", salary: edit?.salary || "", contactEmail: edit?.contactEmail || "",
    expiresAt: edit?.expiresAt?.split("T")[0] || "",
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/alumni", {
        method: edit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edit ? { ...form, type: "job", id: edit.id } : { ...form, type: "job" }),
      })
      onClose()
    } catch { alert("Failed") }
    setSaving(false)
  }
  function upd(f: string, v: any) { setForm({ ...form, [f]: v }) }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Company</label><input required value={form.company} onChange={e => upd("company", e.target.value)} className="input-field" /></div>
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label><input required value={form.title} onChange={e => upd("title", e.target.value)} className="input-field" /></div>
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea required rows={3} value={form.description} onChange={e => upd("description", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Location</label><input required value={form.location} onChange={e => upd("location", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Salary</label><input value={form.salary} onChange={e => upd("salary", e.target.value)} className="input-field" placeholder="e.g. ₹10-15 LPA" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label><input type="email" required value={form.contactEmail} onChange={e => upd("contactEmail", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label><input type="date" value={form.expiresAt} onChange={e => upd("expiresAt", e.target.value)} className="input-field" /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : edit ? "Update" : "Post Job"}</button>
      </div>
    </form>
  )
}

function EventsView({ data, onRefresh, setShowModal, setEditingItem, setModalType }: any) {
  const [search, setSearch] = useState("")
  const filtered = data.filter((e: AlumniEvent) =>
    !search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.type?.toLowerCase().includes(search.toLowerCase()) || e.venue?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return
    await fetch(`/api/alumni?type=event&id=${id}`, { method: "DELETE" })
    onRefresh()
  }

  const isUpcoming = (date: string) => new Date(date) > new Date()

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((e: AlumniEvent) => (
          <div key={e.id} className={`card hover:shadow-md transition-shadow ${isUpcoming(e.date) ? "border-l-4 border-l-green-500" : "border-l-4 border-l-gray-300"}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-gray-800">{e.title}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Calendar size={12} /> {new Date(e.date).toLocaleDateString()} {new Date(e.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingItem(e); setModalType("event"); setShowModal(true) }} className="p-1 hover:bg-blue-50 rounded text-blue-600"><Edit size={14} /></button>
                <button onClick={() => handleDelete(e.id)} className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14} /></button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">{e.description}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`badge ${eventTypeColors[e.type] || "badge-default"}`}>{e.type}</span>
              {e.venue && <span className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={12} /> {e.venue}</span>}
              {e.maxAttendees && <span className="text-xs text-gray-500"><Users size={12} className="inline" /> Max {e.maxAttendees}</span>}
              <span className={`badge ${isUpcoming(e.date) ? "badge-success" : "badge-default"}`}>{isUpcoming(e.date) ? "Upcoming" : "Past"}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="col-span-full text-center py-10 text-gray-500">No events found</p>}
      </div>
    </div>
  )
}

function EventForm({ edit, onClose }: { edit: any; onClose: () => void }) {
  const [form, setForm] = useState({
    title: edit?.title || "", description: edit?.description || "",
    date: edit?.date ? new Date(edit.date).toISOString().slice(0, 16) : "",
    venue: edit?.venue || "", type: edit?.type || "MEETUP", maxAttendees: edit?.maxAttendees?.toString() || "",
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/alumni", {
        method: edit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edit ? { ...form, type: "event", id: edit.id } : { ...form, type: "event" }),
      })
      onClose()
    } catch { alert("Failed") }
    setSaving(false)
  }
  function upd(f: string, v: any) { setForm({ ...form, [f]: v }) }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Title</label><input required value={form.title} onChange={e => upd("title", e.target.value)} className="input-field" /></div>
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea rows={3} value={form.description} onChange={e => upd("description", e.target.value)} className="input-field" /></div>
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label><input type="datetime-local" required value={form.date} onChange={e => upd("date", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Venue</label><input value={form.venue} onChange={e => upd("venue", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select value={form.type} onChange={e => upd("type", e.target.value)} className="input-field">
            <option value="MEETUP">Meetup</option>
            <option value="WEBINAR">Webinar</option>
            <option value="REUNION">Reunion</option>
            <option value="WORKSHOP">Workshop</option>
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Max Attendees</label><input type="number" value={form.maxAttendees} onChange={e => upd("maxAttendees", e.target.value)} className="input-field" /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : edit ? "Update" : "Create Event"}</button>
      </div>
    </form>
  )
}

function DonationsView({ data, onRefresh }: { data: Donation[]; onRefresh: () => void }) {
  const [search, setSearch] = useState("")
  const filtered = data.filter((d: Donation) =>
    !search || d.alumni?.user?.name?.toLowerCase().includes(search.toLowerCase()) || d.purpose?.toLowerCase().includes(search.toLowerCase())
  )

  const total = filtered.reduce((sum: number, d: Donation) => sum + d.amount, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card"><p className="text-2xl font-bold text-gray-800">₹{total.toLocaleString()}</p><p className="text-xs text-gray-500">Total Donations</p></div>
        <div className="stat-card"><p className="text-2xl font-bold text-gray-800">{filtered.length}</p><p className="text-xs text-gray-500">Total Transactions</p></div>
        <div className="stat-card"><p className="text-2xl font-bold text-gray-800">{filtered.length > 0 ? `₹${Math.round(total / filtered.length).toLocaleString()}` : "₹0"}</p><p className="text-xs text-gray-500">Avg Donation</p></div>
        <div className="stat-card"><p className="text-2xl font-bold text-gray-800">{filtered.filter((d: Donation) => d.purpose).length}</p><p className="text-xs text-gray-500">With Purpose</p></div>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search donations..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>
            <th className="table-header">Alumni</th>
            <th className="table-header">Amount</th>
            <th className="table-header">Purpose</th>
            <th className="table-header">Method</th>
            <th className="table-header">Date</th>
          </tr></thead>
          <tbody>
            {filtered.map((d: Donation) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{d.alumni?.user?.name || "Anonymous"}</td>
                <td className="table-cell font-semibold text-green-600">₹{d.amount.toLocaleString()}</td>
                <td className="table-cell max-w-[200px] truncate">{d.purpose || "-"}</td>
                <td className="table-cell"><span className="badge badge-info">{d.paymentMethod}</span></td>
                <td className="table-cell text-xs">{new Date(d.date).toLocaleDateString()}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-500">No donations recorded</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DonationForm({ onClose }: { onClose: () => void }) {
  const [alumniList, setAlumniList] = useState<any[]>([])
  const [form, setForm] = useState({ alumniId: "", amount: "", purpose: "", paymentMethod: "ONLINE" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/alumni?type=alumni").then(r => r.json()).then(setAlumniList)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/alumni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "donation", ...form, amount: parseFloat(form.amount) }),
      })
      onClose()
    } catch { alert("Failed") }
    setSaving(false)
  }
  function upd(f: string, v: any) { setForm({ ...form, [f]: v }) }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Alumni</label>
          <select required value={form.alumniId} onChange={e => upd("alumniId", e.target.value)} className="input-field">
            <option value="">Select alumni</option>
            {alumniList.map((a: any) => <option key={a.id} value={a.id}>{a.user?.name} ({a.graduationYear})</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label><input type="number" required min={1} value={form.amount} onChange={e => upd("amount", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
          <select value={form.paymentMethod} onChange={e => upd("paymentMethod", e.target.value)} className="input-field">
            <option value="ONLINE">Online</option>
            <option value="CASH">Cash</option>
            <option value="CHEQUE">Cheque</option>
            <option value="UPI">UPI</option>
          </select>
        </div>
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label><input value={form.purpose} onChange={e => upd("purpose", e.target.value)} className="input-field" placeholder="e.g. Scholarship Fund" /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Record Donation"}</button>
      </div>
    </form>
  )
}
