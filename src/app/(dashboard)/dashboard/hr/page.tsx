"use client"
import { useEffect, useState } from "react"
import { Plus, X, Search, Edit, Trash2, Users, DollarSign, FileText, Download, Eye, Wallet } from "lucide-react"

type TabType = "staff" | "salary" | "payslip"
interface Staff { id: string; employeeId: string; firstName: string; lastName: string; email: string; phone: string; department: string; designation: string; type: string; dateOfJoining: string; salary?: number; bankAccount?: string; ifscCode?: string; panNo?: string; uanNo?: string; address: string; isActive: boolean }
interface SalaryStructure { id: string; staffId: string; basicPay: number; hra: number; da: number; ta: number; pfDeduction: number; taxDeduction: number; otherAllowance: number; otherDeduction: number; netSalary: number; effectiveFrom: string }
interface Payslip { id: string; staffId: string; month: number; year: number; basicPay: number; hra: number; da: number; ta: number; otherAllowance: number; grossPay: number; pfDeduction: number; taxDeduction: number; otherDeduction: number; netPay: number; status: string; generatedAt: string; paidAt?: string }

const tabs: { key: TabType; label: string; icon: any }[] = [
  { key: "staff", label: "Staff", icon: Users },
  { key: "salary", label: "Salary Structures", icon: DollarSign },
  { key: "payslip", label: "Payslips", icon: FileText },
]

const statusColors: Record<string, string> = {
  GENERATED: "badge-info", PAID: "badge-success", CANCELLED: "badge-danger",
  TEACHING: "badge-info", NON_TEACHING: "badge-warning", ADMIN: "badge-danger",
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export default function HRPage() {
  const [activeTab, setActiveTab] = useState<TabType>("staff")
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<"staff" | "salary" | "payslip">("staff")
  const [editingItem, setEditingItem] = useState<any>(null)
  const [staffList, setStaffList] = useState<Staff[]>([])

  useEffect(() => { fetchData(); fetchStaffList() }, [activeTab])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/hr?type=${activeTab}`)
      const json = await res.json()
      setData(Array.isArray(json) ? json : [])
    } catch { setData([]) }
    setLoading(false)
  }

  async function fetchStaffList() {
    try {
      const res = await fetch("/api/hr?type=staff")
      setStaffList(await res.json())
    } catch { setStaffList([]) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">HR & Payroll</h1>
        <div className="flex gap-2">
          {activeTab === "staff" && <button onClick={() => { setEditingItem(null); setModalType("staff"); setShowModal(true) }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Staff</button>}
          {activeTab === "salary" && <button onClick={() => { setEditingItem(null); setModalType("salary"); setShowModal(true) }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Structure</button>}
          {activeTab === "payslip" && <button onClick={() => { setModalType("payslip"); setShowModal(true) }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Generate Payslip</button>}
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

      {activeTab === "staff" && <StaffView data={data} onRefresh={fetchData} setShowModal={setShowModal} setEditingItem={setEditingItem} setModalType={setModalType} />}
      {activeTab === "salary" && <SalaryView data={data} staffList={staffList} onRefresh={fetchData} setShowModal={setShowModal} setEditingItem={setEditingItem} setModalType={setModalType} />}
      {activeTab === "payslip" && <PayslipView data={data} staffList={staffList} onRefresh={fetchData} setShowModal={setShowModal} setModalType={setModalType} />}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-gray-800">
                {modalType === "staff" ? (editingItem ? "Edit Staff" : "Add Staff") : modalType === "salary" ? (editingItem ? "Edit Salary Structure" : "Add Salary Structure") : "Generate Payslip"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            {modalType === "staff" && <StaffForm edit={editingItem} onClose={() => { setShowModal(false); fetchData(); fetchStaffList() }} />}
            {modalType === "salary" && <SalaryForm edit={editingItem} staffList={staffList} onClose={() => { setShowModal(false); fetchData() }} />}
            {modalType === "payslip" && <PayslipForm staffList={staffList} onClose={() => { setShowModal(false); fetchData() }} />}
          </div>
        </div>
      )}
    </div>
  )
}

function StaffView({ data, onRefresh, setShowModal, setEditingItem, setModalType }: any) {
  const [search, setSearch] = useState("")
  const filtered = data.filter((s: Staff) =>
    !search || s.firstName?.toLowerCase().includes(search.toLowerCase()) || s.lastName?.toLowerCase().includes(search.toLowerCase()) || s.employeeId?.toLowerCase().includes(search.toLowerCase()) || s.department?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: string) {
    if (!confirm("Deactivate this staff member?")) return
    await fetch(`/api/hr?type=staff&id=${id}`, { method: "DELETE" })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
      </div>
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>
            <th className="table-header">Employee ID</th>
            <th className="table-header">Name</th>
            <th className="table-header">Department</th>
            <th className="table-header">Designation</th>
            <th className="table-header">Type</th>
            <th className="table-header">Email</th>
            <th className="table-header">Phone</th>
            <th className="table-header">Status</th>
            <th className="table-header">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map((s: Staff) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="table-cell font-mono text-xs font-medium">{s.employeeId}</td>
                <td className="table-cell font-medium">{s.firstName} {s.lastName}</td>
                <td className="table-cell">{s.department}</td>
                <td className="table-cell text-xs">{s.designation}</td>
                <td className="table-cell"><span className={`badge ${statusColors[s.type] || "badge-default"}`}>{s.type}</span></td>
                <td className="table-cell text-xs">{s.email}</td>
                <td className="table-cell font-mono text-xs">{s.phone}</td>
                <td className="table-cell"><span className={`badge ${s.isActive ? "badge-success" : "badge-danger"}`}>{s.isActive ? "Active" : "Inactive"}</span></td>
                <td className="table-cell">
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingItem(s); setModalType("staff"); setShowModal(true) }} className="p-1 hover:bg-blue-50 rounded text-blue-600"><Edit size={14} /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={9} className="text-center py-10 text-gray-500">No staff found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StaffForm({ edit, onClose }: { edit: any; onClose: () => void }) {
  const [form, setForm] = useState({
    employeeId: edit?.employeeId || "", firstName: edit?.firstName || "", lastName: edit?.lastName || "",
    email: edit?.email || "", phone: edit?.phone || "", department: edit?.department || "",
    designation: edit?.designation || "", type: edit?.type || "TEACHING", dateOfJoining: edit?.dateOfJoining ? edit.dateOfJoining.split("T")[0] : new Date().toISOString().split("T")[0],
    salary: edit?.salary?.toString() || "", bankAccount: edit?.bankAccount || "", ifscCode: edit?.ifscCode || "",
    panNo: edit?.panNo || "", uanNo: edit?.uanNo || "", address: edit?.address || "",
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/hr", {
        method: edit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edit ? { ...form, type: "staff", id: edit.id } : { ...form, type: "staff" }),
      })
      onClose()
    } catch { alert("Failed") }
    setSaving(false)
  }
  function upd(f: string, v: any) { setForm({ ...form, [f]: v }) }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label><input required value={form.employeeId} onChange={e => upd("employeeId", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select value={form.type} onChange={e => upd("type", e.target.value)} className="input-field">
            <option value="TEACHING">Teaching</option>
            <option value="NON_TEACHING">Non-Teaching</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">First Name</label><input required value={form.firstName} onChange={e => upd("firstName", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label><input required value={form.lastName} onChange={e => upd("lastName", e.target.value)} className="input-field" /></div>
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" required value={form.email} onChange={e => upd("email", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input required value={form.phone} onChange={e => upd("phone", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Department</label><input required value={form.department} onChange={e => upd("department", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Designation</label><input required value={form.designation} onChange={e => upd("designation", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label><input type="date" required value={form.dateOfJoining} onChange={e => upd("dateOfJoining", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Salary</label><input type="number" value={form.salary} onChange={e => upd("salary", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Bank Account</label><input value={form.bankAccount} onChange={e => upd("bankAccount", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label><input value={form.ifscCode} onChange={e => upd("ifscCode", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">PAN No</label><input value={form.panNo} onChange={e => upd("panNo", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">UAN No</label><input value={form.uanNo} onChange={e => upd("uanNo", e.target.value)} className="input-field" /></div>
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea rows={2} required value={form.address} onChange={e => upd("address", e.target.value)} className="input-field" /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : edit ? "Update" : "Add Staff"}</button>
      </div>
    </form>
  )
}

function SalaryView({ data, staffList, onRefresh, setShowModal, setEditingItem, setModalType }: any) {
  const [staffFilter, setStaffFilter] = useState("")
  const filtered = data.filter((s: SalaryStructure) => !staffFilter || s.staffId === staffFilter)
  const getStaffName = (id: string) => { const st = staffList.find((s: Staff) => s.id === id); return st ? `${st.firstName} ${st.lastName}` : id }

  async function handleDelete(id: string) {
    if (!confirm("Delete this salary structure?")) return
    await fetch(`/api/hr?type=salary&id=${id}`, { method: "DELETE" })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <select value={staffFilter} onChange={e => setStaffFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Staff</option>
          {staffList.map((s: Staff) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
        </select>
      </div>
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>
            <th className="table-header">Staff</th>
            <th className="table-header">Basic Pay</th>
            <th className="table-header">HRA</th>
            <th className="table-header">DA</th>
            <th className="table-header">TA</th>
            <th className="table-header">Other Allowance</th>
            <th className="table-header">Deductions</th>
            <th className="table-header">Net Salary</th>
            <th className="table-header">Effective From</th>
            <th className="table-header">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map((s: SalaryStructure) => {
              const deductions = s.pfDeduction + s.taxDeduction + s.otherDeduction
              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{getStaffName(s.staffId)}</td>
                  <td className="table-cell">₹{(s.basicPay || 0).toLocaleString()}</td>
                  <td className="table-cell">₹{(s.hra || 0).toLocaleString()}</td>
                  <td className="table-cell">₹{(s.da || 0).toLocaleString()}</td>
                  <td className="table-cell">₹{(s.ta || 0).toLocaleString()}</td>
                  <td className="table-cell">₹{(s.otherAllowance || 0).toLocaleString()}</td>
                  <td className="table-cell text-red-600">₹{(deductions || 0).toLocaleString()}</td>
                  <td className="table-cell font-bold text-green-600">₹{(s.netSalary || 0).toLocaleString()}</td>
                  <td className="table-cell text-xs">{s.effectiveFrom ? new Date(s.effectiveFrom).toLocaleDateString() : ""}</td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingItem(s); setModalType("salary"); setShowModal(true) }} className="p-1 hover:bg-blue-50 rounded text-blue-600"><Edit size={14} /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && <tr><td colSpan={10} className="text-center py-10 text-gray-500">No salary structures found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SalaryForm({ edit, staffList, onClose }: { edit: any; staffList: Staff[]; onClose: () => void }) {
  const [form, setForm] = useState({
    staffId: edit?.staffId || "", basicPay: edit?.basicPay?.toString() || "0", hra: edit?.hra?.toString() || "0",
    da: edit?.da?.toString() || "0", ta: edit?.ta?.toString() || "0", pfDeduction: edit?.pfDeduction?.toString() || "0",
    taxDeduction: edit?.taxDeduction?.toString() || "0", otherAllowance: edit?.otherAllowance?.toString() || "0",
    otherDeduction: edit?.otherDeduction?.toString() || "0", effectiveFrom: edit?.effectiveFrom ? edit.effectiveFrom.split("T")[0] : new Date().toISOString().split("T")[0],
  })
  const [saving, setSaving] = useState(false)

  const grossEarnings = (parseFloat(form.basicPay) || 0) + (parseFloat(form.hra) || 0) + (parseFloat(form.da) || 0) + (parseFloat(form.ta) || 0) + (parseFloat(form.otherAllowance) || 0)
  const totalDeductions = (parseFloat(form.pfDeduction) || 0) + (parseFloat(form.taxDeduction) || 0) + (parseFloat(form.otherDeduction) || 0)
  const netSalary = grossEarnings - totalDeductions

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/hr", {
        method: edit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edit ? { ...form, type: "salary", id: edit.id } : { ...form, type: "salary" }),
      })
      onClose()
    } catch { alert("Failed") }
    setSaving(false)
  }
  function upd(f: string, v: any) { setForm({ ...form, [f]: v }) }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Staff</label>
          <select required value={form.staffId} onChange={e => upd("staffId", e.target.value)} className="input-field">
            <option value="">Select staff</option>
            {staffList.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.employeeId})</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Basic Pay</label><input type="number" required value={form.basicPay} onChange={e => upd("basicPay", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">HRA</label><input type="number" value={form.hra} onChange={e => upd("hra", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">DA</label><input type="number" value={form.da} onChange={e => upd("da", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">TA</label><input type="number" value={form.ta} onChange={e => upd("ta", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Other Allowance</label><input type="number" value={form.otherAllowance} onChange={e => upd("otherAllowance", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">PF Deduction</label><input type="number" value={form.pfDeduction} onChange={e => upd("pfDeduction", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Tax Deduction</label><input type="number" value={form.taxDeduction} onChange={e => upd("taxDeduction", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Other Deduction</label><input type="number" value={form.otherDeduction} onChange={e => upd("otherDeduction", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Effective From</label><input type="date" required value={form.effectiveFrom} onChange={e => upd("effectiveFrom", e.target.value)} className="input-field" /></div>
        <div className="col-span-2 bg-gray-50 rounded-lg p-3">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><span className="text-gray-500">Gross:</span> <span className="font-semibold text-green-600">?{grossEarnings.toLocaleString()}</span></div>
            <div><span className="text-gray-500">Deductions:</span> <span className="font-semibold text-red-600">?{totalDeductions.toLocaleString()}</span></div>
            <div><span className="text-gray-500">Net:</span> <span className="font-bold text-blue-600">?{netSalary.toLocaleString()}</span></div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : edit ? "Update" : "Create Structure"}</button>
      </div>
    </form>
  )
}

function PayslipView({ data, staffList, onRefresh }: any) {
  const [staffFilter, setStaffFilter] = useState("")
  const [monthFilter, setMonthFilter] = useState("")
  const [yearFilter, setYearFilter] = useState("")
  const getStaffName = (id: string) => { const st = staffList.find((s: Staff) => s.id === id); return st ? `${st.firstName} ${st.lastName}` : id }

  const filtered = data.filter((p: Payslip) => {
    if (staffFilter && p.staffId !== staffFilter) return false
    if (monthFilter && p.month !== parseInt(monthFilter)) return false
    if (yearFilter && p.year !== parseInt(yearFilter)) return false
    return true
  })

  async function handleMarkPaid(id: string) {
    await fetch("/api/hr", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "payslip", id, status: "PAID" }),
    })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <select value={staffFilter} onChange={e => setStaffFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Staff</option>
          {staffList.map((s: Staff) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
        </select>
        <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Months</option>
          {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Years</option>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p: Payslip) => {
          const staff = staffList.find((s: Staff) => s.id === p.staffId)
          const monthName = p.month ? months[p.month - 1] : ""
          return (
            <div key={p.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{staff?.firstName} {staff?.lastName}</h3>
                  <p className="text-xs text-gray-500">{staff?.employeeId} | {monthName} {p.year || ""}</p>
                </div>
                <span className={`badge ${statusColors[p.status] || "badge-default"}`}>{p.status || "N/A"}</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Basic Pay</span><span>₹{(p.basicPay || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>HRA</span><span>₹{(p.hra || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>DA</span><span>₹{(p.da || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>TA</span><span>₹{(p.ta || 0).toLocaleString()}</span></div>
                {(p.otherAllowance || 0) > 0 && <div className="flex justify-between"><span>Other Allowance</span><span>₹{(p.otherAllowance || 0).toLocaleString()}</span></div>}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-sm">
                <div className="flex justify-between font-medium"><span>Gross Pay</span><span className="text-green-600">₹{(p.grossPay || 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-red-600"><span>PF</span><span>₹{(p.pfDeduction || 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-red-600"><span>Tax</span><span>₹{(p.taxDeduction || 0).toLocaleString()}</span></div>
                {(p.otherDeduction || 0) > 0 && <div className="flex justify-between text-red-600"><span>Other Deductions</span><span>₹{(p.otherDeduction || 0).toLocaleString()}</span></div>}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-lg font-bold text-blue-600">₹{(p.netPay || 0).toLocaleString()}</span>
                {p.status === "GENERATED" && (
                  <button onClick={() => handleMarkPaid(p.id)} className="btn-primary text-xs flex items-center gap-1"><Wallet size={12} /> Mark Paid</button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">Generated: {p.generatedAt ? new Date(p.generatedAt).toLocaleDateString() : ""}</p>
            </div>
          )
        })}
        {filtered.length === 0 && <p className="col-span-full text-center py-10 text-gray-500">No payslips found</p>}
      </div>
    </div>
  )
}

function PayslipForm({ staffList, onClose }: { staffList: Staff[]; onClose: () => void }) {
  const [form, setForm] = useState({ staffId: "", month: (new Date().getMonth() + 1).toString(), year: new Date().getFullYear().toString() })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/hr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payslip", ...form }),
      })
      const json = await res.json()
      if (!res.ok) { alert(json.error || "Failed") } else { onClose() }
    } catch { alert("Failed") }
    setSaving(false)
  }
  function upd(f: string, v: any) { setForm({ ...form, [f]: v }) }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Staff</label>
          <select required value={form.staffId} onChange={e => upd("staffId", e.target.value)} className="input-field">
            <option value="">Select staff</option>
            {staffList.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.employeeId})</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
          <select required value={form.month} onChange={e => upd("month", e.target.value)} className="input-field">
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <select required value={form.year} onChange={e => upd("year", e.target.value)} className="input-field">
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Generating..." : "Generate Payslip"}</button>
      </div>
    </form>
  )
}
