"use client"
import { useEffect, useState } from "react"
import { Plus, X, Search, Edit, Trash2, BookOpen, BookMarked, History, DollarSign, RotateCcw, UserCheck, AlertTriangle } from "lucide-react"

type TabType = "books" | "issues" | "history"
interface Book { id: string; isbn?: string; title: string; author: string; publisher?: string; edition?: string; year?: number; category: string; rackNo?: string; quantity: number; available: number; price?: number; description?: string }
interface BookIssue { id: string; bookId: string; studentId: string; issueDate: string; dueDate: string; returnDate?: string; status: string; fine: number; finePaid: boolean; book?: Book; student?: { id: string; rollNo: string; firstName: string; lastName: string } }

const tabs: { key: TabType; label: string; icon: any }[] = [
  { key: "books", label: "Books", icon: BookOpen },
  { key: "issues", label: "Issued Books", icon: BookMarked },
  { key: "history", label: "History", icon: History },
]

const statusColors: Record<string, string> = {
  ISSUED: "badge-info", RETURNED: "badge-success", OVERDUE: "badge-danger", LOST: "badge-danger",
}

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<TabType>("books")
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<"book" | "issue">("book")
  const [editingItem, setEditingItem] = useState<any>(null)

  useEffect(() => { fetchData() }, [activeTab])

  async function fetchData() {
    setLoading(true)
    try {
      const type = activeTab === "history" ? "history" : activeTab
      const res = await fetch(`/api/library?type=${type}`)
      const json = await res.json()
      setData(Array.isArray(json) ? json : [])
    } catch { setData([]) }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Library Management</h1>
        <div className="flex gap-2">
          {activeTab === "books" && <button onClick={() => { setEditingItem(null); setModalType("book"); setShowModal(true) }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Book</button>}
          {activeTab === "issues" && <button onClick={() => { setModalType("issue"); setShowModal(true) }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Issue Book</button>}
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

      {activeTab === "books" && <BooksView data={data} onRefresh={fetchData} setShowModal={setShowModal} setEditingItem={setEditingItem} setModalType={setModalType} />}
      {activeTab === "issues" && <IssuesView data={data} onRefresh={fetchData} />}
      {activeTab === "history" && <HistoryView data={data} />}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-gray-800">
                {modalType === "book" ? (editingItem ? "Edit Book" : "Add Book") : "Issue Book"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            {modalType === "book" && <BookForm edit={editingItem} onClose={() => { setShowModal(false); fetchData() }} />}
            {modalType === "issue" && <IssueForm onClose={() => { setShowModal(false); fetchData() }} />}
          </div>
        </div>
      )}
    </div>
  )
}

function BooksView({ data, onRefresh, setShowModal, setEditingItem, setModalType }: any) {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const filtered = data.filter((b: Book) => {
    const matchSearch = !search || b.title?.toLowerCase().includes(search.toLowerCase()) || b.author?.toLowerCase().includes(search.toLowerCase()) || b.isbn?.includes(search)
    const matchCat = !categoryFilter || b.category === categoryFilter
    return matchSearch && matchCat
  })

  async function handleDelete(id: string) {
    if (!confirm("Delete this book?")) return
    await fetch(`/api/library?type=book&id=${id}`, { method: "DELETE" })
    onRefresh()
  }

  const categories = [...new Set(data.map((b: Book) => b.category).filter(Boolean))] as string[]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by title, author, ISBN..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>
            <th className="table-header">ISBN</th>
            <th className="table-header">Title</th>
            <th className="table-header">Author</th>
            <th className="table-header">Category</th>
            <th className="table-header">Rack</th>
            <th className="table-header">Qty</th>
            <th className="table-header">Available</th>
            <th className="table-header">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map((b: Book) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="table-cell font-mono text-xs">{b.isbn || "-"}</td>
                <td className="table-cell font-medium max-w-[200px] truncate">{b.title}</td>
                <td className="table-cell">{b.author}</td>
                <td className="table-cell"><span className="badge badge-info">{b.category}</span></td>
                <td className="table-cell text-xs">{b.rackNo || "-"}</td>
                <td className="table-cell text-center">{b.quantity}</td>
                <td className="table-cell text-center"><span className={`font-semibold ${b.available > 0 ? "text-green-600" : "text-red-600"}`}>{b.available}</span></td>
                <td className="table-cell">
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingItem(b); setModalType("book"); setShowModal(true) }} className="p-1 hover:bg-blue-50 rounded text-blue-600"><Edit size={14} /></button>
                    <button onClick={() => handleDelete(b.id)} className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-gray-500">No books found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BookForm({ edit, onClose }: { edit: any; onClose: () => void }) {
  const [form, setForm] = useState({
    isbn: edit?.isbn || "", title: edit?.title || "", author: edit?.author || "",
    publisher: edit?.publisher || "", edition: edit?.edition || "", year: edit?.year?.toString() || "",
    category: edit?.category || "FICTION", rackNo: edit?.rackNo || "",
    quantity: edit?.quantity?.toString() || "1", price: edit?.price?.toString() || "",
    description: edit?.description || "",
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/library", {
        method: edit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edit ? { ...form, type: "book", id: edit.id } : { ...form, type: "book" }),
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
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Author</label><input required value={form.author} onChange={e => upd("author", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label><input value={form.isbn} onChange={e => upd("isbn", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Publisher</label><input value={form.publisher} onChange={e => upd("publisher", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Edition</label><input value={form.edition} onChange={e => upd("edition", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Year</label><input type="number" value={form.year} onChange={e => upd("year", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select value={form.category} onChange={e => upd("category", e.target.value)} className="input-field">
            <option value="FICTION">Fiction</option>
            <option value="NON_FICTION">Non-Fiction</option>
            <option value="TEXTBOOK">Textbook</option>
            <option value="REFERENCE">Reference</option>
            <option value="JOURNAL">Journal</option>
            <option value="MAGAZINE">Magazine</option>
            <option value="TECHNICAL">Technical</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Rack No</label><input value={form.rackNo} onChange={e => upd("rackNo", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label><input type="number" required min={1} value={form.quantity} onChange={e => upd("quantity", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Price</label><input type="number" value={form.price} onChange={e => upd("price", e.target.value)} className="input-field" /></div>
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea rows={2} value={form.description} onChange={e => upd("description", e.target.value)} className="input-field" /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : edit ? "Update" : "Add Book"}</button>
      </div>
    </form>
  )
}

function IssuesView({ data, onRefresh }: { data: BookIssue[]; onRefresh: () => void }) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const today = new Date()

  const filtered = data.filter(i => {
    const matchSearch = !search || i.student?.firstName?.toLowerCase().includes(search.toLowerCase()) || i.student?.rollNo?.includes(search) || i.book?.title?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || i.status === statusFilter
    return matchSearch && matchStatus
  })

  async function handleReturn(issueId: string) {
    if (!confirm("Return this book?")) return
    await fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "return", issueId, finePerDay: 5 }),
    })
    onRefresh()
  }

  async function handlePayFine(issueId: string) {
    await fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "payfine", issueId }),
    })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search student or book..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Status</option>
          <option value="ISSUED">Issued</option>
          <option value="OVERDUE">Overdue</option>
          <option value="RETURNED">Returned</option>
          <option value="LOST">Lost</option>
        </select>
      </div>
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>
            <th className="table-header">Student</th>
            <th className="table-header">Roll No</th>
            <th className="table-header">Book</th>
            <th className="table-header">Issue Date</th>
            <th className="table-header">Due Date</th>
            <th className="table-header">Status</th>
            <th className="table-header">Fine</th>
            <th className="table-header">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map(i => {
              const isOverdue = i.status === "ISSUED" && new Date(i.dueDate) < today
              return (
                <tr key={i.id} className={`hover:bg-gray-50 ${isOverdue ? "bg-red-50" : ""}`}>
                  <td className="table-cell font-medium">{i.student?.firstName} {i.student?.lastName}</td>
                  <td className="table-cell font-mono text-xs">{i.student?.rollNo}</td>
                  <td className="table-cell max-w-[180px] truncate">{i.book?.title}</td>
                  <td className="table-cell text-xs">{new Date(i.issueDate).toLocaleDateString()}</td>
                  <td className={`table-cell text-xs ${isOverdue ? "text-red-600 font-semibold" : ""}`}>{new Date(i.dueDate).toLocaleDateString()}</td>
                  <td className="table-cell"><span className={`badge ${isOverdue ? "badge-danger" : statusColors[i.status] || "badge-default"}`}>{isOverdue ? "OVERDUE" : i.status}</span></td>
                  <td className="table-cell">
                    {i.fine > 0 ? (
                      <span className="text-red-600 font-semibold">₹{i.fine}</span>
                    ) : "-"}
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      {i.status === "ISSUED" && (
                        <button onClick={() => handleReturn(i.id)} className="btn-secondary text-xs flex items-center gap-1"><RotateCcw size={12} /> Return</button>
                      )}
                      {i.status === "OVERDUE" && !i.finePaid && (
                        <div className="flex gap-1">
                          <button onClick={() => handlePayFine(i.id)} className="btn-primary text-xs flex items-center gap-1"><DollarSign size={12} /> Pay Fine</button>
                          <button onClick={() => handleReturn(i.id)} className="btn-secondary text-xs flex items-center gap-1"><RotateCcw size={12} /> Return</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-gray-500">No issued books found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function IssueForm({ onClose }: { onClose: () => void }) {
  const [students, setStudents] = useState<any[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [form, setForm] = useState({ studentId: "", bookId: "", maxDays: "14" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/library?type=students").then(r => r.json()).then(setStudents)
    fetch("/api/library?type=books").then(r => r.json()).then(d => setBooks(d.filter((b: Book) => b.available > 0)))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "issue", ...form }),
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
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Book</label>
          <select required value={form.bookId} onChange={e => upd("bookId", e.target.value)} className="input-field">
            <option value="">Select book</option>
            {books.map(b => <option key={b.id} value={b.id}>{b.title} by {b.author} (Available: {b.available})</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Max Days</label><input type="number" min={1} max={90} value={form.maxDays} onChange={e => upd("maxDays", e.target.value)} className="input-field" /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Issuing..." : "Issue Book"}</button>
      </div>
    </form>
  )
}

function HistoryView({ data }: { data: BookIssue[] }) {
  return (
    <div className="card p-0 overflow-hidden">
      <table className="w-full">
        <thead><tr>
          <th className="table-header">Student</th>
          <th className="table-header">Roll No</th>
          <th className="table-header">Book</th>
          <th className="table-header">Issue Date</th>
          <th className="table-header">Return Date</th>
          <th className="table-header">Fine</th>
          <th className="table-header">Paid</th>
        </tr></thead>
        <tbody>
          {data.map(i => (
            <tr key={i.id} className="hover:bg-gray-50">
              <td className="table-cell font-medium">{i.student?.firstName} {i.student?.lastName}</td>
              <td className="table-cell font-mono text-xs">{i.student?.rollNo}</td>
              <td className="table-cell max-w-[180px] truncate">{i.book?.title}</td>
              <td className="table-cell text-xs">{new Date(i.issueDate).toLocaleDateString()}</td>
              <td className="table-cell text-xs">{i.returnDate ? new Date(i.returnDate).toLocaleDateString() : "-"}</td>
              <td className="table-cell">{i.fine > 0 ? <span className="text-red-600 font-semibold">₹{i.fine}</span> : "-"}</td>
              <td className="table-cell">{i.finePaid ? <span className="badge badge-success">Paid</span> : i.fine > 0 ? <span className="badge badge-danger">Unpaid</span> : "-"}</td>
            </tr>
          ))}
          {data.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-500">No history found</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
