"use client"
import { useEffect, useState } from "react"
import { Plus, X, Search, Edit, Trash2, DollarSign, CreditCard, BookOpen, TrendingUp, TrendingDown, Wallet, Landmark, Scale, Pencil } from "lucide-react"

type TabType = "ledger" | "voucher" | "budget" | "balance"
interface LedgerAccount { id: string; code: string; name: string; type: string; balance: number; isActive: boolean }
interface VoucherEntry { id: string; accountId: string; debit: number; credit: number; narration?: string; account?: LedgerAccount }
interface Voucher { id: string; voucherNo: string; type: string; date: string; description?: string; amount: number; status: string; entries?: VoucherEntry[] }
interface BudgetPlan { id: string; fiscalYear: string; category: string; allocated: number; spent: number; description?: string }
interface BalanceSheet { totalAssets: number; totalLiabilities: number; totalIncome: number; totalExpenses: number; totalEquity: number }

const tabs: { key: TabType; label: string; icon: any }[] = [
  { key: "ledger", label: "Ledger Accounts", icon: BookOpen },
  { key: "voucher", label: "Vouchers", icon: CreditCard },
  { key: "budget", label: "Budget", icon: TrendingUp },
  { key: "balance", label: "Balance Sheet", icon: Scale },
]

const typeColors: Record<string, string> = {
  ASSET: "badge-success", LIABILITY: "badge-danger", INCOME: "badge-info", EXPENSE: "badge-warning", EQUITY: "badge-default",
  PAYMENT: "badge-danger", RECEIPT: "badge-success", CONTRA: "badge-info", JOURNAL: "badge-warning",
  POSTED: "badge-success", DRAFT: "badge-warning", CANCELLED: "badge-danger",
}

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("ledger")
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<"ledger" | "voucher" | "budget">("ledger")
  const [editingItem, setEditingItem] = useState<any>(null)

  useEffect(() => { fetchData() }, [activeTab])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/accounts?type=${activeTab === "balance" ? "balance" : activeTab}`)
      const json = await res.json()
      setData(Array.isArray(json) ? json : [])
    } catch { setData([]) }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Accounts</h1>
        <button onClick={() => { setEditingItem(null); setModalType(activeTab === "voucher" ? "voucher" : activeTab === "budget" ? "budget" : "ledger"); setShowModal(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> {activeTab === "ledger" ? "Add Account" : activeTab === "voucher" ? "New Voucher" : activeTab === "budget" ? "Add Budget" : ""}
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === tab.key ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "ledger" && <LedgerView data={data} onRefresh={fetchData} setShowModal={setShowModal} setEditingItem={setEditingItem} setModalType={setModalType} />}
      {activeTab === "voucher" && <VoucherView data={data} onRefresh={fetchData} setShowModal={setShowModal} setEditingItem={setEditingItem} setModalType={setModalType} />}
      {activeTab === "budget" && <BudgetView data={data} onRefresh={fetchData} setShowModal={setShowModal} setEditingItem={setEditingItem} setModalType={setModalType} />}
      {activeTab === "balance" && <BalanceSheetView data={data} />}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-gray-800">
                {modalType === "ledger" ? (editingItem ? "Edit Account" : "Add Ledger Account") : modalType === "voucher" ? (editingItem ? "Edit Voucher" : "Create Voucher") : "Add Budget Plan"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            {modalType === "ledger" && <LedgerForm edit={editingItem} onClose={() => { setShowModal(false); fetchData() }} />}
            {modalType === "voucher" && <VoucherForm onClose={() => { setShowModal(false); fetchData() }} />}
            {modalType === "budget" && <BudgetForm edit={editingItem} onClose={() => { setShowModal(false); fetchData() }} />}
          </div>
        </div>
      )}
    </div>
  )
}

function LedgerView({ data, onRefresh, setShowModal, setEditingItem, setModalType }: any) {
  const [search, setSearch] = useState("")
  const filtered = data.filter((a: LedgerAccount) =>
    !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.code?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: string) {
    if (!confirm("Delete this ledger account?")) return
    await fetch(`/api/accounts?type=ledger&id=${id}`, { method: "DELETE" })
    onRefresh()
  }

  const totalBalance = filtered.reduce((sum: number, a: LedgerAccount) => sum + a.balance, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search accounts..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
        </div>
        <div className="text-lg font-bold text-blue-600">Total: ₹{totalBalance.toLocaleString()}</div>
      </div>
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>
            <th className="table-header">Code</th>
            <th className="table-header">Account Name</th>
            <th className="table-header">Type</th>
            <th className="table-header">Balance</th>
            <th className="table-header">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map((a: LedgerAccount) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="table-cell font-mono text-xs font-medium">{a.code}</td>
                <td className="table-cell font-medium">{a.name}</td>
                <td className="table-cell"><span className={`badge ${typeColors[a.type] || "badge-default"}`}>{a.type}</span></td>
                <td className={`table-cell font-semibold ${(a.balance || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>₹{(a.balance || 0).toLocaleString()}</td>
                <td className="table-cell">
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingItem(a); setModalType("ledger"); setShowModal(true) }} className="p-1 hover:bg-blue-50 rounded text-blue-600"><Edit size={14} /></button>
                    <button onClick={() => handleDelete(a.id)} className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-500">No accounts found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LedgerForm({ edit, onClose }: { edit: any; onClose: () => void }) {
  const [form, setForm] = useState({ code: edit?.code || "", name: edit?.name || "", type: edit?.type || "ASSET", balance: edit?.balance?.toString() || "0" })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/accounts", {
        method: edit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edit ? { ...form, type: "ledger", id: edit.id } : { ...form, type: "ledger" }),
      })
      onClose()
    } catch { alert("Failed") }
    setSaving(false)
  }
  function upd(f: string, v: any) { setForm({ ...form, [f]: v }) }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Account Code</label><input required value={form.code} onChange={e => upd("code", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select value={form.type} onChange={e => upd("type", e.target.value)} className="input-field">
            <option value="ASSET">Asset</option>
            <option value="LIABILITY">Liability</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
            <option value="EQUITY">Equity</option>
          </select>
        </div>
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label><input required value={form.name} onChange={e => upd("name", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Opening Balance</label><input type="number" value={form.balance} onChange={e => upd("balance", e.target.value)} className="input-field" /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : edit ? "Update" : "Create Account"}</button>
      </div>
    </form>
  )
}

function VoucherView({ data, onRefresh, setShowModal, setEditingItem, setModalType }: any) {
  const [search, setSearch] = useState("")
  const filtered = data.filter((v: Voucher) =>
    !search || v.voucherNo?.toLowerCase().includes(search.toLowerCase()) || v.description?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: string) {
    if (!confirm("Delete this voucher? This will reverse ledger entries.")) return
    await fetch(`/api/accounts?type=voucher&id=${id}`, { method: "DELETE" })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search vouchers..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
      </div>
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>
            <th className="table-header">Voucher No</th>
            <th className="table-header">Type</th>
            <th className="table-header">Date</th>
            <th className="table-header">Description</th>
            <th className="table-header">Amount</th>
            <th className="table-header">Status</th>
            <th className="table-header">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map((v: Voucher) => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="table-cell font-mono text-xs font-medium">{v.voucherNo}</td>
                <td className="table-cell"><span className={`badge ${typeColors[v.type] || "badge-default"}`}>{v.type}</span></td>
                <td className="table-cell text-xs">{v.date ? new Date(v.date).toLocaleDateString() : "-"}</td>
                <td className="table-cell text-sm max-w-[200px] truncate">{v.description || "-"}</td>
                <td className="table-cell font-semibold">₹{(v.amount || 0).toLocaleString()}</td>
                <td className="table-cell"><span className={`badge ${typeColors[v.status] || "badge-default"}`}>{v.status}</span></td>
                <td className="table-cell">
                  <button onClick={() => handleDelete(v.id)} className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-500">No vouchers found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function VoucherForm({ onClose }: { onClose: () => void }) {
  const [accounts, setAccounts] = useState<LedgerAccount[]>([])
  const [form, setForm] = useState({ voucherType: "PAYMENT", date: new Date().toISOString().split("T")[0], description: "", amount: "", createdBy: "admin" })
  const [entries, setEntries] = useState([{ accountId: "", debit: "", credit: "", narration: "" }])
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetch("/api/accounts?type=accounts").then(r => r.json()).then(setAccounts) }, [])

  function addEntry() { setEntries([...entries, { accountId: "", debit: "", credit: "", narration: "" }]) }
  function updEntry(i: number, f: string, v: any) {
    const e = [...entries]; (e[i] as any)[f] = v; setEntries(e)
  }
  function removeEntry(i: number) { if (entries.length > 1) setEntries(entries.filter((_, idx) => idx !== i)) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "voucher", ...form, entries }),
      })
      onClose()
    } catch { alert("Failed") }
    setSaving(false)
  }
  function upd(f: string, v: any) { setForm({ ...form, [f]: v }) }

  const totalDebit = entries.reduce((s, e) => s + (parseFloat(e.debit) || 0), 0)
  const totalCredit = entries.reduce((s, e) => s + (parseFloat(e.credit) || 0), 0)

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Voucher Type</label>
          <select value={form.voucherType} onChange={e => upd("voucherType", e.target.value)} className="input-field">
            <option value="PAYMENT">Payment</option>
            <option value="RECEIPT">Receipt</option>
            <option value="CONTRA">Contra</option>
            <option value="JOURNAL">Journal</option>
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label><input type="date" required value={form.date} onChange={e => upd("date", e.target.value)} className="input-field" /></div>
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><input value={form.description} onChange={e => upd("description", e.target.value)} className="input-field" /></div>
      </div>
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Ledger Entries</h3>
          <button type="button" onClick={addEntry} className="btn-secondary text-xs flex items-center gap-1"><Plus size={12} /> Add Entry</button>
        </div>
        {entries.map((entry, i) => (
          <div key={i} className="grid grid-cols-5 gap-2 items-end p-2 bg-gray-50 rounded">
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Account</label>
              <select required value={entry.accountId} onChange={e => updEntry(i, "accountId", e.target.value)} className="input-field text-xs">
                <option value="">Select</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div><label className="block text-xs text-gray-500 mb-1">Debit</label><input type="number" value={entry.debit} onChange={e => updEntry(i, "debit", e.target.value)} className="input-field text-xs" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Credit</label><input type="number" value={entry.credit} onChange={e => updEntry(i, "credit", e.target.value)} className="input-field text-xs" /></div>
            <div className="flex items-end gap-1">
              <input placeholder="Narration" value={entry.narration} onChange={e => updEntry(i, "narration", e.target.value)} className="input-field text-xs" />
              {entries.length > 1 && <button type="button" onClick={() => removeEntry(i)} className="p-1 text-red-500 hover:bg-red-50 rounded"><X size={14} /></button>}
            </div>
          </div>
        ))}
        <div className="flex justify-between text-sm font-medium pt-2 border-t">
          <span>Total Debit: ₹{totalDebit}</span>
          <span>Total Credit: ₹{totalCredit}</span>
          {totalDebit !== totalCredit && <span className="text-red-500 text-xs">Not balanced</span>}
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving || totalDebit !== totalCredit} className="btn-primary">{saving ? "Saving..." : "Create Voucher"}</button>
      </div>
    </form>
  )
}

function BudgetView({ data, onRefresh, setShowModal, setEditingItem, setModalType }: any) {
  const [search, setSearch] = useState("")
  const filtered = data.filter((b: BudgetPlan) =>
    !search || b.category?.toLowerCase().includes(search.toLowerCase()) || b.fiscalYear?.includes(search)
  )

  async function handleDelete(id: string) {
    if (!confirm("Delete this budget plan?")) return
    await fetch(`/api/accounts?type=budget&id=${id}`, { method: "DELETE" })
    onRefresh()
  }

  const totalAllocated = filtered.reduce((s: number, b: BudgetPlan) => s + (b.allocated || 0), 0)
  const totalSpent = filtered.reduce((s: number, b: BudgetPlan) => s + (b.spent || 0), 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card border-l-4 border-blue-500"><p className="text-sm text-gray-500">Total Allocated</p><p className="text-2xl font-bold text-blue-600">₹{totalAllocated.toLocaleString()}</p></div>
        <div className="stat-card border-l-4 border-green-500"><p className="text-sm text-gray-500">Total Spent</p><p className="text-2xl font-bold text-green-600">₹{totalSpent.toLocaleString()}</p></div>
        <div className="stat-card border-l-4 border-purple-500"><p className="text-sm text-gray-500">Remaining</p><p className="text-2xl font-bold text-purple-600">₹{(totalAllocated - totalSpent).toLocaleString()}</p></div>
      </div>
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search budget..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
      </div>
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>
            <th className="table-header">Fiscal Year</th>
            <th className="table-header">Category</th>
            <th className="table-header">Allocated</th>
            <th className="table-header">Spent</th>
            <th className="table-header">Remaining</th>
            <th className="table-header">% Used</th>
            <th className="table-header">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map((b: BudgetPlan) => {
              const pct = (b.allocated || 0) > 0 ? Math.round(((b.spent || 0) / (b.allocated || 1)) * 100) : 0
              return (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{b.fiscalYear}</td>
                  <td className="table-cell">{b.category}</td>
                  <td className="table-cell font-medium">₹{(b.allocated || 0).toLocaleString()}</td>
                  <td className="table-cell text-red-600">₹{(b.spent || 0).toLocaleString()}</td>
                  <td className={`table-cell font-semibold ${(b.allocated || 0) - (b.spent || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>₹{((b.allocated || 0) - (b.spent || 0)).toLocaleString()}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${pct > 90 ? "bg-red-500" : pct > 70 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${pct}%` }} /></div>
                      <span className="text-xs">{pct}%</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingItem(b); setModalType("budget"); setShowModal(true) }} className="p-1 hover:bg-blue-50 rounded text-blue-600"><Edit size={14} /></button>
                      <button onClick={() => handleDelete(b.id)} className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-500">No budget plans found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BudgetForm({ edit, onClose }: { edit: any; onClose: () => void }) {
  const [form, setForm] = useState({
    fiscalYear: edit?.fiscalYear || new Date().getFullYear().toString(),
    category: edit?.category || "", allocated: edit?.allocated?.toString() || "0",
    spent: edit?.spent?.toString() || "0", description: edit?.description || "",
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/accounts", {
        method: edit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edit ? { ...form, type: "budget", id: edit.id } : { ...form, type: "budget" }),
      })
      onClose()
    } catch { alert("Failed") }
    setSaving(false)
  }
  function upd(f: string, v: any) { setForm({ ...form, [f]: v }) }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year</label><input required value={form.fiscalYear} onChange={e => upd("fiscalYear", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select required value={form.category} onChange={e => upd("category", e.target.value)} className="input-field">
            <option value="">Select</option>
            <option value="SALARY">Salary</option>
            <option value="INFRASTRUCTURE">Infrastructure</option>
            <option value="EQUIPMENT">Equipment</option>
            <option value="OPERATIONS">Operations</option>
            <option value="RESEARCH">Research</option>
            <option value="SCHOLARSHIP">Scholarship</option>
            <option value="EVENTS">Events</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Allocated Amount</label><input type="number" required value={form.allocated} onChange={e => upd("allocated", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Spent Amount</label><input type="number" value={form.spent} onChange={e => upd("spent", e.target.value)} className="input-field" /></div>
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea rows={2} value={form.description} onChange={e => upd("description", e.target.value)} className="input-field" /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : edit ? "Update" : "Create Budget"}</button>
      </div>
    </form>
  )
}

function BalanceSheetView({ data }: any) {
  const bs: BalanceSheet = data?.totalAssets !== undefined ? data : { totalAssets: 0, totalLiabilities: 0, totalIncome: 0, totalExpenses: 0, totalEquity: 0 }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card border-l-4 border-green-500">
          <div className="flex items-center gap-3"><TrendingUp size={24} className="text-green-500" /><div><p className="text-sm text-gray-500">Total Assets</p><p className="text-2xl font-bold text-green-600">₹{bs.totalAssets.toLocaleString()}</p></div></div>
        </div>
        <div className="stat-card border-l-4 border-red-500">
          <div className="flex items-center gap-3"><TrendingDown size={24} className="text-red-500" /><div><p className="text-sm text-gray-500">Total Liabilities</p><p className="text-2xl font-bold text-red-600">₹{bs.totalLiabilities.toLocaleString()}</p></div></div>
        </div>
        <div className="stat-card border-l-4 border-blue-500">
          <div className="flex items-center gap-3"><Wallet size={24} className="text-blue-500" /><div><p className="text-sm text-gray-500">Total Equity</p><p className="text-2xl font-bold text-blue-600">₹{bs.totalEquity.toLocaleString()}</p></div></div>
        </div>
        <div className="stat-card border-l-4 border-yellow-500">
          <div className="flex items-center gap-3"><TrendingUp size={24} className="text-yellow-500" /><div><p className="text-sm text-gray-500">Total Income</p><p className="text-2xl font-bold text-yellow-600">₹{bs.totalIncome.toLocaleString()}</p></div></div>
        </div>
        <div className="stat-card border-l-4 border-purple-500">
          <div className="flex items-center gap-3"><TrendingDown size={24} className="text-purple-500" /><div><p className="text-sm text-gray-500">Total Expenses</p><p className="text-2xl font-bold text-purple-600">₹{bs.totalExpenses.toLocaleString()}</p></div></div>
        </div>
        <div className="stat-card border-l-4 border-gray-500">
          <div className="flex items-center gap-3"><Scale size={24} className="text-gray-500" /><div><p className="text-sm text-gray-500">Net Worth</p><p className="text-2xl font-bold">₹{(bs.totalAssets - bs.totalLiabilities).toLocaleString()}</p></div></div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Balance Sheet Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-green-700 mb-2">Assets</h4>
            <div className="bg-green-50 rounded-lg p-4"><p className="text-3xl font-bold text-green-600">₹{bs.totalAssets.toLocaleString()}</p></div>
          </div>
          <div>
            <h4 className="font-medium text-red-700 mb-2">Liabilities</h4>
            <div className="bg-red-50 rounded-lg p-4"><p className="text-3xl font-bold text-red-600">₹{bs.totalLiabilities.toLocaleString()}</p></div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t flex justify-between items-center">
          <span className="font-medium text-gray-700">Net Position (Assets - Liabilities)</span>
          <span className={`text-2xl font-bold ${bs.totalAssets - bs.totalLiabilities >= 0 ? "text-green-600" : "text-red-600"}`}>
            ₹{(bs.totalAssets - bs.totalLiabilities).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
