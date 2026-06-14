"use client"
import { useEffect, useState } from "react"
import { Plus, X, Search, Send, Bell, MessageSquare, Megaphone, Mail, Trash2, CheckCircle, Clock, AlertTriangle } from "lucide-react"

type TabType = "broadcast" | "notifications" | "messages"
interface Broadcast { id: string; title: string; message: string; type: string; audience: string; status: string; sentAt?: string; createdAt: string }
interface Notification { id: string; userId: string; title: string; message: string; type: string; isRead: boolean; createdAt: string; user?: { id: string; email: string; name: string } }
interface Message { id: string; fromUserId: string; toUserId: string; subject?: string; body: string; isRead: boolean; sentAt: string; readAt?: string; fromUser?: { id: string; name: string; email: string }; toUser?: { id: string; name: string; email: string } }

const tabs: { key: TabType; label: string; icon: any }[] = [
  { key: "broadcast", label: "Broadcast", icon: Megaphone },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "messages", label: "Messages", icon: MessageSquare },
]

const audienceOptions = ["ALL", "STUDENTS", "FACULTY", "PARENTS"]
const channelOptions = ["NOTICE", "EMAIL", "SMS", "WHATSAPP"]

const statusColors: Record<string, string> = {
  SENT: "badge-success", DRAFT: "badge-warning", SCHEDULED: "badge-info",
}

export default function CommunicationPage() {
  const [activeTab, setActiveTab] = useState<TabType>("broadcast")
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [composeType, setComposeType] = useState<"broadcast" | "notification" | "message">("broadcast")
  const [editingItem, setEditingItem] = useState<any>(null)

  useEffect(() => { fetchData() }, [activeTab])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/communication?type=${activeTab}`)
      const json = await res.json()
      setData(Array.isArray(json) ? json : [])
    } catch { setData([]) }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Communication</h1>
        <div className="flex gap-2">
          {activeTab === "broadcast" && <button onClick={() => { setEditingItem(null); setComposeType("broadcast"); setShowModal(true) }} className="btn-primary flex items-center gap-2"><Plus size={16} /> New Broadcast</button>}
          {activeTab === "messages" && <button onClick={() => { setComposeType("message"); setShowModal(true) }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Compose Message</button>}
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

      {activeTab === "broadcast" && <BroadcastView data={data} onRefresh={fetchData} setShowModal={setShowModal} setEditingItem={setEditingItem} setComposeType={setComposeType} />}
      {activeTab === "notifications" && <NotificationsView data={data} onRefresh={fetchData} />}
      {activeTab === "messages" && <MessagesView data={data} onRefresh={fetchData} setShowModal={setShowModal} />}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-gray-800">
                {composeType === "broadcast" ? (editingItem ? "Edit Broadcast" : "New Broadcast") : composeType === "notification" ? "Send Notification" : "Compose Message"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            {composeType === "broadcast" && <BroadcastForm edit={editingItem} onClose={() => { setShowModal(false); fetchData() }} />}
            {composeType === "message" && <MessageForm onClose={() => { setShowModal(false); fetchData() }} />}
          </div>
        </div>
      )}
    </div>
  )
}

function BroadcastView({ data, onRefresh, setShowModal, setEditingItem, setComposeType }: any) {
  const [search, setSearch] = useState("")
  const filtered = data.filter((b: Broadcast) =>
    !search || b.title?.toLowerCase().includes(search.toLowerCase()) || b.audience?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: string) {
    if (!confirm("Delete this broadcast?")) return
    await fetch(`/api/communication?type=broadcast&id=${id}`, { method: "DELETE" })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search broadcasts..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
      </div>
      <div className="grid grid-cols-1 gap-4">
        {filtered.map((b: Broadcast) => (
          <div key={b.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-800">{b.title}</h3>
                  <span className={`badge ${statusColors[b.status] || "badge-default"}`}>{b.status}</span>
                  <span className="badge badge-info">{b.audience}</span>
                  <span className="badge badge-info">{b.type}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{b.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {b.sentAt ? `Sent: ${new Date(b.sentAt).toLocaleString()}` : `Created: ${new Date(b.createdAt).toLocaleString()}`}
                </p>
              </div>
              <div className="flex gap-1 ml-4">
                {b.status === "DRAFT" && (
                  <>
                    <button onClick={() => { setEditingItem(b); setComposeType("broadcast"); setShowModal(true) }} className="p-1 hover:bg-blue-50 rounded text-blue-600"><Mail size={14} /></button>
                    <button onClick={() => handleDelete(b.id)} className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14} /></button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center py-10 text-gray-500">No broadcasts found</p>}
      </div>
    </div>
  )
}

function BroadcastForm({ edit, onClose }: { edit: any; onClose: () => void }) {
  const [form, setForm] = useState({
    title: edit?.title || "", message: edit?.message || "", audience: edit?.audience || "ALL",
    type: edit?.type || "NOTICE", status: edit?.status || "DRAFT",
  })
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/communication", {
        method: edit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edit ? { ...form, type: "broadcast", id: edit.id } : { ...form, type: "broadcast" }),
      })
      onClose()
    } catch { alert("Failed") }
    setSaving(false)
  }

  async function handleSend() {
    setSending(true)
    try {
      await fetch("/api/communication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type: "broadcast", status: "SENT", sentAt: new Date().toISOString() }),
      })
      onClose()
    } catch { alert("Failed") }
    setSending(false)
  }

  function upd(f: string, v: any) { setForm({ ...form, [f]: v }) }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Title</label><input required value={form.title} onChange={e => upd("title", e.target.value)} className="input-field" /></div>
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Message</label><textarea required rows={4} value={form.message} onChange={e => upd("message", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
          <select value={form.audience} onChange={e => upd("audience", e.target.value)} className="input-field">
            {audienceOptions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
          <select value={form.type} onChange={e => upd("type", e.target.value)} className="input-field">
            {channelOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        {!edit && (
          <button type="button" onClick={handleSend} disabled={sending} className="btn-primary flex items-center gap-2"><Send size={14} /> {sending ? "Sending..." : "Send Now"}</button>
        )}
        <button type="submit" disabled={saving} className="btn-secondary">{saving ? "Saving..." : edit ? "Update" : "Save Draft"}</button>
      </div>
    </form>
  )
}

function NotificationsView({ data, onRefresh }: { data: Notification[]; onRefresh: () => void }) {
  const [search, setSearch] = useState("")
  const filtered = data.filter((n: Notification) =>
    !search || n.title?.toLowerCase().includes(search.toLowerCase()) || n.user?.name?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleMarkRead(id: string) {
    await fetch("/api/communication", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "notification", id }),
    })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search notifications..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
      </div>
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>
            <th className="table-header">Title</th>
            <th className="table-header">Message</th>
            <th className="table-header">Type</th>
            <th className="table-header">User</th>
            <th className="table-header">Date</th>
            <th className="table-header">Status</th>
          </tr></thead>
          <tbody>
            {filtered.map((n: Notification) => (
              <tr key={n.id} className={`hover:bg-gray-50 ${!n.isRead ? "bg-blue-50" : ""}`} onClick={() => !n.isRead && handleMarkRead(n.id)}>
                <td className="table-cell font-medium">{n.title}</td>
                <td className="table-cell max-w-[250px] truncate">{n.message}</td>
                <td className="table-cell"><span className="badge badge-info">{n.type}</span></td>
                <td className="table-cell text-xs">{n.user?.name || "System"}</td>
                <td className="table-cell text-xs">{new Date(n.createdAt).toLocaleString()}</td>
                <td className="table-cell">{n.isRead ? <span className="badge badge-success">Read</span> : <span className="badge badge-warning flex items-center gap-1 w-fit"><Clock size={12} /> Unread</span>}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-500">No notifications found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MessagesView({ data, onRefresh, setShowModal }: { data: Message[]; onRefresh: () => void; setShowModal: any }) {
  const [search, setSearch] = useState("")
  const filtered = data.filter((m: Message) =>
    !search || m.subject?.toLowerCase().includes(search.toLowerCase()) || m.fromUser?.name?.toLowerCase().includes(search.toLowerCase()) || m.toUser?.name?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleMarkRead(id: string) {
    await fetch("/api/communication", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "message", id }),
    })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search messages..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
        </div>
      </div>
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>
            <th className="table-header">From</th>
            <th className="table-header">To</th>
            <th className="table-header">Subject</th>
            <th className="table-header">Body</th>
            <th className="table-header">Date</th>
            <th className="table-header">Status</th>
          </tr></thead>
          <tbody>
            {filtered.map((m: Message) => (
              <tr key={m.id} className={`hover:bg-gray-50 ${!m.isRead ? "bg-blue-50" : ""}`} onClick={() => !m.isRead && handleMarkRead(m.id)}>
                <td className="table-cell font-medium">{m.fromUser?.name || m.fromUserId}</td>
                <td className="table-cell">{m.toUser?.name || m.toUserId}</td>
                <td className="table-cell max-w-[150px] truncate font-medium">{m.subject || "(No subject)"}</td>
                <td className="table-cell max-w-[200px] truncate text-gray-600">{m.body}</td>
                <td className="table-cell text-xs">{new Date(m.sentAt).toLocaleString()}</td>
                <td className="table-cell">{m.isRead ? <span className="badge badge-success"><CheckCircle size={12} className="inline mr-1" /> Read</span> : <span className="badge badge-warning"><Clock size={12} className="inline mr-1" /> Unread</span>}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-500">No messages found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MessageForm({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<any[]>([])
  const [form, setForm] = useState({ toUserId: "", subject: "", body: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/communication?type=users").then(r => r.json()).then(setUsers)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/communication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "message", ...form }),
      })
      onClose()
    } catch { alert("Failed") }
    setSaving(false)
  }
  function upd(f: string, v: any) { setForm({ ...form, [f]: v }) }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">To</label>
          <select required value={form.toUserId} onChange={e => upd("toUserId", e.target.value)} className="input-field">
            <option value="">Select recipient</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email}) - {u.role}</option>)}
          </select>
        </div>
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Subject</label><input value={form.subject} onChange={e => upd("subject", e.target.value)} className="input-field" /></div>
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Message</label><textarea required rows={4} value={form.body} onChange={e => upd("body", e.target.value)} className="input-field" /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2"><Send size={14} /> {saving ? "Sending..." : "Send Message"}</button>
      </div>
    </form>
  )
}
