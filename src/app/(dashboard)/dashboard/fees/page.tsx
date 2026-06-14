"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { usePermissions } from "@/lib/permissions"
import { Plus, X, Search, Edit, Trash2, DollarSign, CreditCard, AlertTriangle, Download, Send, Receipt } from "lucide-react"

type TabType = "structures" | "collections" | "dues" | "receipts"
interface Program { id: string; name: string; code: string }
interface FeeStructure { id: string; programId: string; program?: Program; name: string; semester: number; academicYear: string; tuitionFee: number; examFee: number; libraryFee: number; labFee: number; sportsFee: number; hostelFee?: number; transportFee?: number; otherFees: number; totalFee: number; dueDate?: string; lateFee: number; isActive: boolean }
interface FeeAccount { id: string; studentId: string; feeStructureId: string; totalFee: number; paidAmount: number; dueAmount: number; status: string; dueDate?: string; student?: { firstName: string; lastName: string; rollNo: string }; feeStructure?: FeeStructure; payments?: Payment[] }
interface Payment { id: string; feeAccountId: string; transactionId: string; amount: number; method: string; paymentDate: string; status: string; receiptNo: string; remarks?: string; feeAccount?: FeeAccount }

const tabs: { key: TabType; label: string }[] = [
  { key: "structures", label: "Fee Structure" },
  { key: "collections", label: "Collections" },
  { key: "dues", label: "Dues" },
  { key: "receipts", label: "Receipts" },
]

const statusColors: Record<string, string> = {
  UNPAID: "badge-danger", PARTIAL: "badge-warning", PAID: "badge-success", OVERDUE: "badge-danger",
  PENDING: "badge-warning", COMPLETED: "badge-success", FAILED: "badge-danger", REFUNDED: "badge-info",
  CASH: "badge-default", CARD: "badge-info", ONLINE: "badge-success", CHEQUE: "badge-warning", UPI: "badge-info",
}

export default function FeesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("structures")
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<"structure" | "account" | "payment">("structure")
  const [editingItem, setEditingItem] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const { data: session } = useSession()
  const { can } = usePermissions(session)

  useEffect(() => { fetchData(); fetchStats() }, [activeTab])

  async function fetchStats() {
    try {
      const res = await fetch("/api/fees?type=stats")
      setStats(await res.json())
    } catch { setStats(null) }
  }

  async function fetchData() {
    setLoading(true)
    try {
      let type: string = activeTab
      if (activeTab === "collections") type = "accounts"
      if (activeTab === "dues") type = "dues"
      if (activeTab === "receipts") type = "payments"
      const res = await fetch(`/api/fees?type=${type}`)
      const json = await res.json()
      setData(Array.isArray(json) ? json : [])
    } catch { setData([]) }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Fee Management</h1>
        {can('fee', 'create') && <button onClick={() => { setEditingItem(null); setModalType(activeTab === "structures" ? "structure" : activeTab === "collections" ? "account" : "payment"); setShowModal(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> {activeTab === "structures" ? "Add Structure" : activeTab === "collections" ? "Add Account" : activeTab === "receipts" ? "Record Payment" : ""}
        </button>}
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat-card"><p className="text-sm text-gray-500">Structures</p><p className="text-2xl font-bold">{stats.totalStructures}</p></div>
          <div className="stat-card border-l-4 border-green-500"><p className="text-sm text-gray-500">Total Collections</p><p className="text-2xl font-bold text-green-600">₹{stats.totalCollections?.toLocaleString()}</p></div>
          <div className="stat-card border-l-4 border-red-500"><p className="text-sm text-gray-500">Total Dues</p><p className="text-2xl font-bold text-red-600">₹{stats.totalDues?.toLocaleString()}</p></div>
          <div className="stat-card border-l-4 border-yellow-500"><p className="text-sm text-gray-500">Pending Accounts</p><p className="text-2xl font-bold text-yellow-600">{stats.pendingAccounts}</p></div>
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === tab.key ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "structures" && <StructuresView data={data} onRefresh={fetchData} setShowModal={setShowModal} setEditingItem={setEditingItem} setModalType={setModalType} can={can} moduleKey="fee" />}
      {activeTab === "collections" && <CollectionsView data={data} onRefresh={fetchData} />}
      {activeTab === "dues" && <DuesView data={data} onRefresh={fetchData} />}
      {activeTab === "receipts" && <ReceiptsView data={data} />}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-gray-800">
                {modalType === "structure" ? (editingItem ? "Edit Fee Structure" : "Add Fee Structure") : modalType === "account" ? "Create Fee Account" : "Record Payment"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            {modalType === "structure" && <StructureForm edit={editingItem} onClose={() => { setShowModal(false); fetchData(); fetchStats() }} />}
            {modalType === "account" && <AccountForm onClose={() => { setShowModal(false); fetchData(); fetchStats() }} />}
            {modalType === "payment" && <PaymentForm onClose={() => { setShowModal(false); fetchData(); fetchStats() }} />}
          </div>
        </div>
      )}
    </div>
  )
}

function StructuresView({ data, onRefresh, setShowModal, setEditingItem, setModalType, can, moduleKey }: any) {
  const [search, setSearch] = useState("")
  const filtered = data.filter((s: FeeStructure) =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.program?.name?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: string) {
    if (!confirm("Delete this fee structure? Associated accounts will also be removed.")) return
    await fetch(`/api/fees?type=structure&id=${id}`, { method: "DELETE" })
    onRefresh()
  }

  return (
    <>
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search structures..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s: FeeStructure) => (
          <div key={s.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">{s.name}</h3>
                <p className="text-xs text-gray-500">{s.program?.name} | Sem {s.semester} | {s.academicYear}</p>
              </div>
              <div className="flex gap-1">
                {can(moduleKey, 'update') && <button onClick={() => { setEditingItem(s); setModalType("structure"); setShowModal(true) }} className="p-1 hover:bg-blue-50 rounded text-blue-600"><Edit size={14} /></button>}
                {can(moduleKey, 'delete') && <button onClick={() => handleDelete(s.id)} className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14} /></button>}
              </div>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between"><span>Tuition</span><span>₹{s.tuitionFee}</span></div>
              <div className="flex justify-between"><span>Exam Fee</span><span>₹{s.examFee}</span></div>
              <div className="flex justify-between"><span>Library</span><span>₹{s.libraryFee}</span></div>
              <div className="flex justify-between"><span>Lab Fee</span><span>₹{s.labFee}</span></div>
              <div className="flex justify-between"><span>Sports</span><span>₹{s.sportsFee}</span></div>
              {s.hostelFee && <div className="flex justify-between"><span>Hostel</span><span>₹{s.hostelFee}</span></div>}
              {s.transportFee && <div className="flex justify-between"><span>Transport</span><span>₹{s.transportFee}</span></div>}
              {s.otherFees > 0 && <div className="flex justify-between"><span>Other</span><span>₹{s.otherFees}</span></div>}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-lg font-bold text-blue-600">₹{s.totalFee}</span>
              <span className={`badge ${s.isActive ? "badge-success" : "badge-danger"}`}>{s.isActive ? "Active" : "Inactive"}</span>
            </div>
            {s.dueDate && <p className="text-xs text-gray-400 mt-1">Due: {new Date(s.dueDate).toLocaleDateString()}</p>}
          </div>
        ))}
        {filtered.length === 0 && <p className="col-span-full text-center py-10 text-gray-500">No fee structures found</p>}
      </div>
    </>
  )
}

function StructureForm({ edit, onClose }: { edit: any; onClose: () => void }) {
  const [programs, setPrograms] = useState<Program[]>([])
  const [form, setForm] = useState({
    name: edit?.name || "", programId: edit?.programId || "", semester: edit?.semester?.toString() || "1",
    academicYear: edit?.academicYear || new Date().getFullYear().toString(),
    tuitionFee: edit?.tuitionFee?.toString() || "0", examFee: edit?.examFee?.toString() || "0",
    libraryFee: edit?.libraryFee?.toString() || "0", labFee: edit?.labFee?.toString() || "0",
    sportsFee: edit?.sportsFee?.toString() || "0", hostelFee: edit?.hostelFee?.toString() || "",
    transportFee: edit?.transportFee?.toString() || "", otherFees: edit?.otherFees?.toString() || "0",
    dueDate: edit?.dueDate ? edit.dueDate.split("T")[0] : "", lateFee: edit?.lateFee?.toString() || "0",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetch("/api/fees?type=programs").then(r => r.json()).then(setPrograms) }, [])

  const total = [form.tuitionFee, form.examFee, form.libraryFee, form.labFee, form.sportsFee, form.otherFees]
    .reduce((sum, v) => sum + (parseFloat(v) || 0), 0) + (parseFloat(form.hostelFee) || 0) + (parseFloat(form.transportFee) || 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/fees", {
        method: edit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edit ? { type: "structure", id: edit.id, ...form } : { type: "structure", ...form }),
      })
      onClose()
    } catch { alert("Failed") }
    setSaving(false)
  }
  function upd(f: string, v: any) { setForm({ ...form, [f]: v }) }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Structure Name</label><input required value={form.name} onChange={e => upd("name", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
          <select required value={form.programId} onChange={e => upd("programId", e.target.value)} className="input-field">
            <option value="">Select</option>
            {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Semester</label><input type="number" required min={1} value={form.semester} onChange={e => upd("semester", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label><input required value={form.academicYear} onChange={e => upd("academicYear", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label><input type="date" value={form.dueDate} onChange={e => upd("dueDate", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Tuition Fee</label><input type="number" value={form.tuitionFee} onChange={e => upd("tuitionFee", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Exam Fee</label><input type="number" value={form.examFee} onChange={e => upd("examFee", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Library Fee</label><input type="number" value={form.libraryFee} onChange={e => upd("libraryFee", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Lab Fee</label><input type="number" value={form.labFee} onChange={e => upd("labFee", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Sports Fee</label><input type="number" value={form.sportsFee} onChange={e => upd("sportsFee", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Hostel Fee</label><input type="number" value={form.hostelFee} onChange={e => upd("hostelFee", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Transport Fee</label><input type="number" value={form.transportFee} onChange={e => upd("transportFee", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Other Fees</label><input type="number" value={form.otherFees} onChange={e => upd("otherFees", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Late Fee</label><input type="number" value={form.lateFee} onChange={e => upd("lateFee", e.target.value)} className="input-field" /></div>
        <div className="flex items-end pb-2">
          <div className="text-lg font-bold text-blue-600">Total: ₹{total}</div>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : edit ? "Update" : "Create Structure"}</button>
      </div>
    </form>
  )
}

function CollectionsView({ data, onRefresh }: { data: FeeAccount[]; onRefresh: () => void }) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  useEffect(() => {
    if (statusFilter) {
      fetch(`/api/fees?type=accounts&status=${statusFilter}`).then(r => r.json()).then(d => { /* data is refreshed via parent but we can filter client side */ })
    }
  }, [statusFilter])

  const filtered = data.filter(a =>
    (!search || a.student?.firstName?.toLowerCase().includes(search.toLowerCase()) || a.student?.rollNo?.includes(search)) &&
    (!statusFilter || a.status === statusFilter)
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Status</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PARTIAL">Partial</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
        </select>
      </div>
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>
            <th className="table-header">Student</th>
            <th className="table-header">Roll No</th>
            <th className="table-header">Structure</th>
            <th className="table-header">Total</th>
            <th className="table-header">Paid</th>
            <th className="table-header">Due</th>
            <th className="table-header">Status</th>
            <th className="table-header">Due Date</th>
          </tr></thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{a.student?.firstName} {a.student?.lastName}</td>
                <td className="table-cell font-mono text-xs">{a.student?.rollNo}</td>
                <td className="table-cell text-xs">{a.feeStructure?.name}</td>
                <td className="table-cell font-medium">₹{a.totalFee}</td>
                <td className="table-cell text-green-600 font-medium">₹{a.paidAmount}</td>
                <td className="table-cell text-red-600 font-medium">₹{a.dueAmount}</td>
                <td className="table-cell"><span className={`badge ${statusColors[a.status] || "badge-default"}`}>{a.status}</span></td>
                <td className="table-cell text-xs">{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "-"}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-gray-500">No accounts found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AccountForm({ onClose }: { onClose: () => void }) {
  const [students, setStudents] = useState<any[]>([])
  const [structures, setStructures] = useState<FeeStructure[]>([])
  const [form, setForm] = useState({ studentId: "", feeStructureId: "", totalFee: "0", paidAmount: "0", dueDate: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/fees?type=students").then(r => r.json()).then(setStudents)
    fetch("/api/fees?type=structures").then(r => r.json()).then(setStructures)
  }, [])

  useEffect(() => {
    const sel = structures.find(s => s.id === form.feeStructureId)
    if (sel) {
      setForm(f => ({ ...f, totalFee: sel.totalFee.toString(), dueDate: sel.dueDate ? sel.dueDate.split("T")[0] : "" }))
    }
  }, [form.feeStructureId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "account", ...form }),
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
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Fee Structure</label>
          <select required value={form.feeStructureId} onChange={e => upd("feeStructureId", e.target.value)} className="input-field">
            <option value="">Select structure</option>
            {structures.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name} - ₹{s.totalFee} (Sem {s.semester})</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Total Fee</label><input type="number" required value={form.totalFee} onChange={e => upd("totalFee", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount</label><input type="number" value={form.paidAmount} onChange={e => upd("paidAmount", e.target.value)} className="input-field" /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Create Account"}</button>
      </div>
    </form>
  )
}

function DuesView({ data, onRefresh }: { data: FeeAccount[]; onRefresh: () => void }) {
  const [search, setSearch] = useState("")

  const filtered = data.filter(a =>
    !search || a.student?.firstName?.toLowerCase().includes(search.toLowerCase()) || a.student?.rollNo?.includes(search)
  )

  async function sendReminder(account: FeeAccount) {
    alert(`Reminder sent to ${account.student?.firstName} ${account.student?.lastName} for ₹${account.dueAmount}`)
  }

  const totalDue = filtered.reduce((sum, a) => sum + a.dueAmount, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
        </div>
        <div className="text-lg font-bold text-red-600">Total Due: ₹{totalDue.toLocaleString()}</div>
      </div>
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>
            <th className="table-header">Student</th>
            <th className="table-header">Roll No</th>
            <th className="table-header">Total Fee</th>
            <th className="table-header">Paid</th>
            <th className="table-header">Due</th>
            <th className="table-header">Status</th>
            <th className="table-header">Due Date</th>
            <th className="table-header">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{a.student?.firstName} {a.student?.lastName}</td>
                <td className="table-cell font-mono text-xs">{a.student?.rollNo}</td>
                <td className="table-cell">₹{a.totalFee}</td>
                <td className="table-cell text-green-600">₹{a.paidAmount}</td>
                <td className="table-cell text-red-600 font-semibold">₹{a.dueAmount}</td>
                <td className="table-cell"><span className={`badge ${statusColors[a.status] || "badge-default"}`}>{a.status}</span></td>
                <td className="table-cell text-xs">{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "-"}</td>
                <td className="table-cell">
                  <button onClick={() => sendReminder(a)} className="btn-secondary text-xs flex items-center gap-1"><Send size={12} /> Remind</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-gray-500">No dues pending</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ReceiptsView({ data }: { data: Payment[] }) {
  return (
    <div className="card p-0 overflow-hidden">
      <table className="w-full">
        <thead><tr>
          <th className="table-header">Receipt No</th>
          <th className="table-header">Student</th>
          <th className="table-header">Amount</th>
          <th className="table-header">Method</th>
          <th className="table-header">Date</th>
          <th className="table-header">Transaction ID</th>
          <th className="table-header">Status</th>
        </tr></thead>
        <tbody>
          {data.map(p => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="table-cell font-mono text-xs font-medium">{p.receiptNo}</td>
              <td className="table-cell font-medium">{p.feeAccount?.student?.firstName} {p.feeAccount?.student?.lastName}</td>
              <td className="table-cell font-bold">₹{p.amount}</td>
              <td className="table-cell"><span className={`badge ${statusColors[p.method] || "badge-default"}`}>{p.method}</span></td>
              <td className="table-cell text-xs">{new Date(p.paymentDate).toLocaleDateString()}</td>
              <td className="table-cell font-mono text-xs">{p.transactionId}</td>
              <td className="table-cell"><span className={`badge ${statusColors[p.status] || "badge-default"}`}>{p.status}</span></td>
            </tr>
          ))}
          {data.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-500">No payments recorded</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function PaymentForm({ onClose }: { onClose: () => void }) {
  const [accounts, setAccounts] = useState<FeeAccount[]>([])
  const [form, setForm] = useState({ feeAccountId: "", amount: "", method: "CASH", remarks: "", status: "COMPLETED" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/fees?type=accounts").then(r => r.json()).then(d => setAccounts(d.filter((a: FeeAccount) => a.dueAmount > 0)))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payment", ...form }),
      })
      onClose()
    } catch { alert("Failed") }
    setSaving(false)
  }
  function upd(f: string, v: any) { setForm({ ...form, [f]: v }) }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Fee Account</label>
          <select required value={form.feeAccountId} onChange={e => upd("feeAccountId", e.target.value)} className="input-field">
            <option value="">Select account with dues</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.student?.firstName} {a.student?.lastName} - Due: ₹{a.dueAmount}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount</label><input type="number" required min={1} value={form.amount} onChange={e => upd("amount", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
          <select value={form.method} onChange={e => upd("method", e.target.value)} className="input-field">
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="ONLINE">Online</option>
            <option value="CHEQUE">Cheque</option>
            <option value="UPI">UPI</option>
          </select>
        </div>
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <textarea rows={2} value={form.remarks} onChange={e => upd("remarks", e.target.value)} className="input-field" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Record Payment"}</button>
      </div>
    </form>
  )
}
