"use client"
import { useEffect, useState } from "react"
import { Plus, Search, X, Eye, Edit, Trash2, Download } from "lucide-react"
import { useSession } from "next-auth/react"
import { usePermissions } from "@/lib/permissions"

type TabType = "enquiry" | "application" | "merit" | "enrolled"

interface Enquiry { id: string; name: string; email: string; phone: string; courseInterest: string; message?: string; status: string; source: string; createdAt: string }
interface Program { id: string; code: string; name: string }
interface Application { id: string; applicationNo: string; firstName: string; lastName: string; dateOfBirth: string; email: string; phone: string; address: string; city: string; state: string; pincode: string; gender: string; nationality: string; category: string; fatherName: string; motherName: string; guardianPhone: string; program?: Program; programId: string; academicYear: string; percentage10?: number; percentage12?: number; graduationPct?: number; status: string; createdAt: string }
interface MeritList { id: string; name: string; program?: Program; academicYear: string; isPublished: boolean; entries: MeritEntry[] }
interface MeritEntry { id: string; rank: number; score: number; status: string; application: Application }
interface SeatAllotment { id: string; application?: Application; program?: Program; status: string; feePaid: boolean; allotmentDate: string }

const tabs: { key: TabType; label: string }[] = [
  { key: "enquiry", label: "Enquiries" },
  { key: "application", label: "Applications" },
  { key: "merit", label: "Merit List" },
  { key: "enrolled", label: "Enrolled" },
]

const statusColors: Record<string, string> = {
  NEW: "badge-info", CONTACTED: "badge-warning", CONVERTED: "badge-success", CLOSED: "badge-default",
  PENDING: "badge-warning", SHORTLISTED: "badge-info", ACCEPTED: "badge-success", REJECTED: "badge-danger", ENROLLED: "badge-success",
  ALLOTTED: "badge-info", CONFIRMED: "badge-success", CANCELLED: "badge-danger",
}

const enquiryStatuses = ["NEW", "CONTACTED", "CONVERTED", "CLOSED"]
const applicationStatuses = ["PENDING", "SHORTLISTED", "ACCEPTED", "REJECTED", "ENROLLED"]

export default function AdmissionsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("enquiry")
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [detailItem, setDetailItem] = useState<any>(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [programs, setPrograms] = useState<Program[]>([])
  const { data: session } = useSession()
  const { can } = usePermissions(session)

  useEffect(() => { fetchData(); if (activeTab === "application") fetchPrograms() }, [activeTab])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admissions?type=${activeTab}`)
      const json = await res.json()
      setData(Array.isArray(json) ? json : [])
    } catch { setData([]) }
    setLoading(false)
  }

  async function fetchPrograms() {
    try {
      const res = await fetch("/api/curriculum?type=program")
      setPrograms(Array.isArray(await res.json()) ? await res.json() : [])
    } catch { setPrograms([]) }
  }

  async function handleDelete(item: any) {
    if (!confirm("Delete this record?")) return
    try {
      await fetch(`/api/admissions/${item.id}?type=${activeTab}`, { method: "DELETE" })
      fetchData()
    } catch { alert("Failed to delete") }
  }

  function getTableHeaders(): string[] {
    switch (activeTab) {
      case "enquiry": return ["Name", "Email", "Phone", "Course Interest", "Source", "Status", "Date"]
      case "application": return ["App No", "Name", "Email", "Phone", "Program", "Status", "Date"]
      case "merit": return ["Merit Name", "Program", "Academic Year", "Entries", "Published"]
      case "enrolled": return ["App No", "Name", "Program", "Status", "Fee Paid", "Date"]
    }
  }

  function renderRow(item: any) {
    switch (activeTab) {
      case "enquiry":
        return (
          <>
            <td className="table-cell font-medium">{item.name}</td>
            <td className="table-cell">{item.email}</td>
            <td className="table-cell">{item.phone}</td>
            <td className="table-cell">{item.courseInterest}</td>
            <td className="table-cell"><span className="badge badge-default">{item.source}</span></td>
            <td className="table-cell"><span className={`badge ${statusColors[item.status] || "badge-default"}`}>{item.status}</span></td>
            <td className="table-cell">{new Date(item.createdAt).toLocaleDateString()}</td>
          </>
        )
      case "application":
        return (
          <>
            <td className="table-cell font-mono text-xs">{item.applicationNo}</td>
            <td className="table-cell font-medium">{item.firstName} {item.lastName}</td>
            <td className="table-cell">{item.email}</td>
            <td className="table-cell">{item.phone}</td>
            <td className="table-cell">{item.program?.name || "-"}</td>
            <td className="table-cell"><span className={`badge ${statusColors[item.status] || "badge-default"}`}>{item.status}</span></td>
            <td className="table-cell">{new Date(item.createdAt).toLocaleDateString()}</td>
          </>
        )
      case "merit":
        return (
          <>
            <td className="table-cell font-medium">{item.name}</td>
            <td className="table-cell">{item.program?.name || "-"}</td>
            <td className="table-cell">{item.academicYear}</td>
            <td className="table-cell">{item.entries?.length || 0}</td>
            <td className="table-cell">
              <span className={`badge ${item.isPublished ? "badge-success" : "badge-warning"}`}>
                {item.isPublished ? "Published" : "Draft"}
              </span>
            </td>
          </>
        )
      case "enrolled":
        return (
          <>
            <td className="table-cell font-mono text-xs">{item.application?.applicationNo || "-"}</td>
            <td className="table-cell font-medium">{item.application?.firstName} {item.application?.lastName}</td>
            <td className="table-cell">{item.program?.name || "-"}</td>
            <td className="table-cell"><span className={`badge ${statusColors[item.status] || "badge-default"}`}>{item.status}</span></td>
            <td className="table-cell">
              <span className={`badge ${item.feePaid ? "badge-success" : "badge-danger"}`}>{item.feePaid ? "Paid" : "Unpaid"}</span>
            </td>
            <td className="table-cell">{new Date(item.allotmentDate).toLocaleDateString()}</td>
          </>
        )
    }
  }

  const filtered = data.filter((item: any) => {
    if (!searchTerm) return true
    const s = searchTerm.toLowerCase()
    if (activeTab === "enquiry") return item.name?.toLowerCase().includes(s) || item.email?.toLowerCase().includes(s) || item.phone?.includes(s)
    if (activeTab === "application") return item.firstName?.toLowerCase().includes(s) || item.lastName?.toLowerCase().includes(s) || item.applicationNo?.toLowerCase().includes(s)
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Admissions</h1>
        {can('admission', 'create') && <button onClick={() => { setEditingItem(null); setShowModal(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New {activeTab === "enquiry" ? "Enquiry" : activeTab === "application" ? "Application" : activeTab === "merit" ? "Merit List" : "Allotment"}
        </button>}
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === tab.key ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="input-field pl-9" />
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {getTableHeaders().map(h => <th key={h} className="table-header">{h}</th>)}
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={getTableHeaders().length + 1} className="text-center py-10 text-gray-500">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={getTableHeaders().length + 1} className="text-center py-10 text-gray-500">No records found</td></tr>
              ) : (
                filtered.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    {renderRow(item)}
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setDetailItem(item)}
                          className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><Eye size={15} /></button>
                        {(activeTab === "enquiry" || activeTab === "application") && (
                          <>
                            {can('admission', 'update') && <button onClick={() => { setEditingItem(item); setShowModal(true) }}
                              className="p-1.5 hover:bg-green-50 rounded text-green-600"><Edit size={15} /></button>}
                            {can('admission', 'delete') && <button onClick={() => handleDelete(item)}
                              className="p-1.5 hover:bg-red-50 rounded text-red-600"><Trash2 size={15} /></button>}
                          </>
                        )}
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingItem ? "Edit" : "New"} {activeTab === "enquiry" ? "Enquiry" : "Application"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            {activeTab === "enquiry" ? (
              <EnquiryForm item={editingItem} onClose={() => { setShowModal(false); fetchData() }} />
            ) : activeTab === "application" ? (
              <ApplicationForm item={editingItem} programs={programs} onClose={() => { setShowModal(false); fetchData() }} />
            ) : null}
          </div>
        </div>
      )}

      {detailItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetailItem(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-gray-800">Details</h2>
              <button onClick={() => setDetailItem(null)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              {Object.entries(detailItem).filter(([k]) => !["id", "programId", "userId", "updatedAt"].includes(k)).map(([key, val]) => (
                <div key={key} className="flex border-b border-gray-50 pb-2">
                  <span className="text-sm font-medium text-gray-600 w-1/3 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                  <span className="text-sm text-gray-900 w-2/3">
                    {key === "createdAt" || key === "dateOfBirth" || key === "allotmentDate"
                      ? new Date(val as string).toLocaleDateString()
                      : key === "feePaid" ? val ? "Yes" : "No"
                      : key === "isPublished" ? val ? "Published" : "Draft"
                      : key === "program" ? (val as any)?.name || "-"
                      : key === "application" ? `${(val as any)?.firstName || ""} ${(val as any)?.lastName || ""}`
                      : key === "entries" ? `${(val as any[])?.length || 0} entries`
                      : String(val ?? "-")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EnquiryForm({ item, onClose }: { item: any; onClose: () => void }) {
  const [form, setForm] = useState({
    name: item?.name || "",
    email: item?.email || "",
    phone: item?.phone || "",
    courseInterest: item?.courseInterest || "",
    message: item?.message || "",
    source: item?.source || "WEBSITE",
    status: item?.status || "NEW",
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const isEdit = !!item?.id
      const body = { type: "enquiry", ...form }
      await fetch(isEdit ? `/api/admissions/${item.id}` : "/api/admissions", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      onClose()
    } catch { alert("Failed to save") }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Course Interest</label>
          <input required value={form.courseInterest} onChange={e => setForm({ ...form, courseInterest: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
          <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="input-field">
            <option value="WEBSITE">Website</option>
            <option value="WALKIN">Walk-in</option>
            <option value="REFERRAL">Referral</option>
            <option value="WHATSAPP">WhatsApp</option>
          </select>
        </div>
        {item?.id && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field">
              {enquiryStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="input-field" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : item ? "Update Enquiry" : "Save Enquiry"}</button>
      </div>
    </form>
  )
}

function ApplicationForm({ item, programs, onClose }: { item: any; programs: Program[]; onClose: () => void }) {
  const [form, setForm] = useState({
    firstName: item?.firstName || "",
    lastName: item?.lastName || "",
    dateOfBirth: item?.dateOfBirth ? item.dateOfBirth.toString().split("T")[0] : "",
    email: item?.email || "",
    phone: item?.phone || "",
    address: item?.address || "",
    city: item?.city || "",
    state: item?.state || "",
    pincode: item?.pincode || "",
    gender: item?.gender || "MALE",
    nationality: item?.nationality || "Indian",
    category: item?.category || "GENERAL",
    fatherName: item?.fatherName || "",
    motherName: item?.motherName || "",
    guardianPhone: item?.guardianPhone || "",
    programId: item?.programId || "",
    academicYear: item?.academicYear || "",
    percentage10: item?.percentage10 ?? "",
    percentage12: item?.percentage12 ?? "",
    graduationPct: item?.graduationPct ?? "",
    status: item?.status || "PENDING",
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const isEdit = !!item?.id
      const body = { type: "application", ...form }
      await fetch(isEdit ? `/api/admissions/${item.id}` : "/api/admissions", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      onClose()
    } catch { alert("Failed to save") }
    setSaving(false)
  }

  function update(field: string, value: any) { setForm({ ...form, [field]: value }) }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">First Name</label><input required value={form.firstName} onChange={e => update("firstName", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label><input required value={form.lastName} onChange={e => update("lastName", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label><input type="date" required value={form.dateOfBirth} onChange={e => update("dateOfBirth", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Gender</label><select value={form.gender} onChange={e => update("gender", e.target.value)} className="input-field"><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" required value={form.email} onChange={e => update("email", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input required value={form.phone} onChange={e => update("phone", e.target.value)} className="input-field" /></div>
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea rows={2} value={form.address} onChange={e => update("address", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input value={form.city} onChange={e => update("city", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">State</label><input value={form.state} onChange={e => update("state", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label><input value={form.pincode} onChange={e => update("pincode", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label><input value={form.nationality} onChange={e => update("nationality", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><select value={form.category} onChange={e => update("category", e.target.value)} className="input-field"><option value="GENERAL">General</option><option value="OBC">OBC</option><option value="SC">SC</option><option value="ST">ST</option><option value="EWS">EWS</option></select></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Father Name</label><input value={form.fatherName} onChange={e => update("fatherName", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Mother Name</label><input value={form.motherName} onChange={e => update("motherName", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Guardian Phone</label><input value={form.guardianPhone} onChange={e => update("guardianPhone", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Program</label><select required value={form.programId} onChange={e => update("programId", e.target.value)} className="input-field"><option value="">Select</option>{programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label><input value={form.academicYear} onChange={e => update("academicYear", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">10th %</label><input type="number" step="0.01" value={form.percentage10} onChange={e => update("percentage10", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">12th %</label><input type="number" step="0.01" value={form.percentage12} onChange={e => update("percentage12", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Graduation %</label><input type="number" step="0.01" value={form.graduationPct} onChange={e => update("graduationPct", e.target.value)} className="input-field" /></div>
        {item?.id && (
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={form.status} onChange={e => update("status", e.target.value)} className="input-field">{applicationStatuses.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
        )}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : item ? "Update Application" : "Submit Application"}</button>
      </div>
    </form>
  )
}
