"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { usePermissions } from "@/lib/permissions"
import { Plus, X, Search, Calendar, Download, Edit, Trash2, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

type TabType = "schedule" | "hallticket" | "marks" | "results"
interface Program { id: string; code: string; name: string }
interface Course { id: string; code: string; name: string }
interface Subject { id: string; code: string; name: string; courseId: string }
interface ExamSchedule { id: string; name: string; programId: string; semester: number; academicYear: string; startDate: string; endDate: string; type: string; isPublished: boolean; description?: string; program?: Program; exams?: Exam[] }
interface Exam { id: string; scheduleId: string; courseId: string; subjectId: string; date: string; startTime: string; endTime: string; maxMarks: number; roomNo?: string; subject?: Subject; course?: Course }
interface Student { id: string; rollNo: string; firstName: string; lastName: string; marks: Mark[] }
interface Mark { id?: string; studentId: string; examId: string; courseId: string; subjectId: string; internalMarks?: number; externalMarks?: number; totalMarks?: number; grade?: string; result: string; student?: Student }

const tabs: { key: TabType; label: string }[] = [
  { key: "schedule", label: "Exam Schedules" },
  { key: "hallticket", label: "Hall Tickets" },
  { key: "marks", label: "Marks Entry" },
  { key: "results", label: "Results" },
]

const statusColors: Record<string, string> = {
  PENDING: "badge-warning", PASS: "badge-success", FAIL: "badge-danger", ABSENT: "badge-default",
  MIDTERM: "badge-info", FINAL: "badge-success", PRACTICAL: "badge-warning", SUPPLEMENTARY: "badge-danger",
}

export default function ExamsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("schedule")
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingItem, setEditingItem] = useState<any>(null)

  const { data: session } = useSession()
  const { can } = usePermissions(session)
  useEffect(() => { fetchData() }, [activeTab])

  async function fetchData() {
    setLoading(true)
    try {
      let type = activeTab === "marks" ? "schedule" : activeTab
      if (activeTab === "hallticket") type = "hallticket"
      if (activeTab === "results") type = "results"
      const res = await fetch(`/api/exams?type=${type}`)
      const json = await res.json()
      setData(Array.isArray(json) ? json : [])
    } catch { setData([]) }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Examinations</h1>
        {activeTab !== "hallticket" && activeTab !== "results" && can('examination', 'create') && (
          <button onClick={() => { setEditingItem(null); setShowModal(true) }} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> {activeTab === "schedule" ? "New Schedule" : activeTab === "marks" ? "Enter Marks" : ""}
          </button>
        )}
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === tab.key ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "schedule" && <ScheduleView data={data} onRefresh={fetchData} setShowModal={setShowModal} setEditingItem={setEditingItem} can={can} moduleKey="examination" />}
      {activeTab === "hallticket" && <HallTicketView />}
      {activeTab === "marks" && <MarksEntryView />}
      {activeTab === "results" && <ResultsView />}

      {showModal && activeTab === "schedule" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-gray-800">{editingItem ? "Edit Schedule" : "New Exam Schedule"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <ScheduleForm edit={editingItem} onClose={() => { setShowModal(false); fetchData() }} />
          </div>
        </div>
      )}
    </div>
  )
}

function ScheduleView({ data, onRefresh, setShowModal, setEditingItem, can, moduleKey }: any) {
  const [schedules, setSchedules] = useState<ExamSchedule[]>(data)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  useEffect(() => setSchedules(data), [data])

  async function handleDelete(id: string) {
    if (!confirm("Delete this schedule and all associated exams?")) return
    await fetch(`/api/exams?type=schedule&id=${id}`, { method: "DELETE" })
    onRefresh()
  }

  async function togglePublish(schedule: ExamSchedule) {
    await fetch("/api/exams", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "schedule", id: schedule.id, isPublished: !schedule.isPublished }),
    })
    onRefresh()
  }

  async function deleteExam(id: string) {
    if (!confirm("Delete this exam?")) return
    await fetch(`/api/exams?type=exam&id=${id}`, { method: "DELETE" })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      {schedules.map(s => (
        <div key={s.id} className="card p-0 overflow-hidden">
          <div className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
            <div className="flex items-center gap-4">
              <Calendar size={20} className="text-blue-500" />
              <div>
                <h3 className="font-semibold text-gray-800">{s.name}</h3>
                <p className="text-xs text-gray-500">{s.program?.name} | Sem {s.semester} | {s.academicYear}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`badge ${statusColors[s.type] || "badge-default"}`}>{s.type}</span>
              <span className={`badge ${s.isPublished ? "badge-success" : "badge-warning"}`}>{s.isPublished ? "Published" : "Draft"}</span>
              <span className="text-xs text-gray-400">{s.exams?.length || 0} exams</span>
            </div>
          </div>
          {expandedId === s.id && (
            <div className="border-t border-gray-100">
              <div className="p-4 bg-gray-50 flex items-center gap-4 text-sm text-gray-600">
                <span>{new Date(s.startDate).toLocaleDateString()} - {new Date(s.endDate).toLocaleDateString()}</span>
                <span>{s.description}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr>
                    <th className="table-header">Date</th>
                    <th className="table-header">Subject</th>
                    <th className="table-header">Course</th>
                    <th className="table-header">Time</th>
                    <th className="table-header">Room</th>
                    <th className="table-header">Max Marks</th>
                    <th className="table-header">Actions</th>
                  </tr></thead>
                  <tbody>
                    {(s.exams || []).map((e: Exam) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="table-cell">{new Date(e.date).toLocaleDateString()}</td>
                        <td className="table-cell font-medium">{e.subject?.name}</td>
                        <td className="table-cell">{e.course?.name}</td>
                        <td className="table-cell">{e.startTime} - {e.endTime}</td>
                        <td className="table-cell">{e.roomNo || "-"}</td>
                        <td className="table-cell">{e.maxMarks}</td>
                        <td className="table-cell">{can(moduleKey, 'delete') && <button onClick={() => deleteExam(e.id)} className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14} /></button>}</td>
                      </tr>
                    ))}
                    {(!s.exams || s.exams.length === 0) && <tr><td colSpan={7} className="text-center py-4 text-gray-400 text-sm">No exams added yet</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="p-3 border-t border-gray-100 flex gap-2">
                {can(moduleKey, 'update') && <button onClick={() => { setEditingItem(s); setShowModal(true) }} className="btn-secondary text-xs flex items-center gap-1"><Edit size={14} /> Edit</button>}
                <button onClick={() => togglePublish(s)} className="btn-secondary text-xs flex items-center gap-1">
                  {s.isPublished ? <XCircle size={14} /> : <CheckCircle size={14} />} {s.isPublished ? "Unpublish" : "Publish"}
                </button>
                {can(moduleKey, 'delete') && <button onClick={() => handleDelete(s.id)} className="btn-secondary text-xs text-red-600 flex items-center gap-1"><Trash2 size={14} /> Delete</button>}
              </div>
            </div>
          )}
        </div>
      ))}
      {schedules.length === 0 && <p className="text-center py-10 text-gray-500">No exam schedules found</p>}
    </div>
  )
}

function ScheduleForm({ edit, onClose }: { edit: any; onClose: () => void }) {
  const [programs, setPrograms] = useState<Program[]>([])
  const [form, setForm] = useState({
    name: edit?.name || "", programId: edit?.programId || "", semester: edit?.semester || "1",
    academicYear: edit?.academicYear || new Date().getFullYear().toString(),
    startDate: edit?.startDate ? edit.startDate.split("T")[0] : "", endDate: edit?.endDate ? edit.endDate.split("T")[0] : "",
    examType: edit?.type || "MIDTERM", description: edit?.description || "",
  })
  const [saving, setSaving] = useState(false)
  useEffect(() => { fetch("/api/exams?type=programs").then(r => r.json()).then(setPrograms) }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/exams", {
        method: edit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edit ? { type: "schedule", id: edit.id, ...form } : { type: "schedule", ...form }),
      })
      onClose()
    } catch { alert("Failed to save") }
    setSaving(false)
  }
  function upd(f: string, v: any) { setForm({ ...form, [f]: v }) }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Name</label>
          <input required value={form.name} onChange={e => upd("name", e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
          <select required value={form.programId} onChange={e => upd("programId", e.target.value)} className="input-field">
            <option value="">Select</option>
            {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
          <input type="number" required min={1} value={form.semester} onChange={e => upd("semester", e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
          <input required value={form.academicYear} onChange={e => upd("academicYear", e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
          <select value={form.examType} onChange={e => upd("examType", e.target.value)} className="input-field">
            <option value="MIDTERM">Midterm</option>
            <option value="FINAL">Final</option>
            <option value="PRACTICAL">Practical</option>
            <option value="SUPPLEMENTARY">Supplementary</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input type="date" required value={form.startDate} onChange={e => upd("startDate", e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input type="date" required value={form.endDate} onChange={e => upd("endDate", e.target.value)} className="input-field" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea rows={2} value={form.description} onChange={e => upd("description", e.target.value)} className="input-field" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : edit ? "Update" : "Create Schedule"}</button>
      </div>
    </form>
  )
}

function HallTicketView() {
  const [schedules, setSchedules] = useState<any[]>([])
  const [hallTickets, setHallTickets] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [selSchedule, setSelSchedule] = useState("")
  const [selStudent, setSelStudent] = useState("")
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()
  const { can } = usePermissions(session)

  useEffect(() => {
    fetch("/api/exams?type=schedule").then(r => r.json()).then(d => {
      setSchedules(d.filter((s: any) => s.isPublished))
    })
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch("/api/exams?type=hallticket")
      setHallTickets(await res.json())
    } catch { setHallTickets([]) }
    setLoading(false)
  }

  async function issueHallTicket() {
    if (!selSchedule || !selStudent) return alert("Select schedule and student")
    try {
      await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "hallticket", examScheduleId: selSchedule, studentId: selStudent }),
      })
      fetchData()
    } catch { alert("Failed") }
  }

  useEffect(() => {
    if (selSchedule) {
      fetch(`/api/exams?type=students&examId=${selSchedule}`).then(r => r.json()).then(setStudents)
    }
  }, [selSchedule])

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Schedule</label>
            <select value={selSchedule} onChange={e => setSelSchedule(e.target.value)} className="input-field">
              <option value="">Select published schedule</option>
              {schedules.map(s => <option key={s.id} value={s.id}>{s.name} - {s.program?.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select value={selStudent} onChange={e => setSelStudent(e.target.value)} className="input-field">
              <option value="">Select student</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.rollNo})</option>)}
            </select>
          </div>
          {can('examination', 'create') && <button onClick={issueHallTicket} className="btn-primary flex items-center gap-2"><Download size={16} /> Issue Hall Ticket</button>}
        </div>
      </div>
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>
            <th className="table-header">Student</th>
            <th className="table-header">Schedule</th>
            <th className="table-header">Issued At</th>
            <th className="table-header">Downloaded</th>
          </tr></thead>
          <tbody>
            {hallTickets.map((ht: any) => (
              <tr key={ht.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{ht.student?.firstName} {ht.student?.lastName}</td>
                <td className="table-cell">{ht.examSchedule?.name}</td>
                <td className="table-cell">{new Date(ht.issuedAt).toLocaleDateString()}</td>
                <td className="table-cell"><span className={`badge ${ht.isDownloaded ? "badge-success" : "badge-warning"}`}>{ht.isDownloaded ? "Yes" : "No"}</span></td>
              </tr>
            ))}
            {hallTickets.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-gray-500">No hall tickets issued</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MarksEntryView() {
  const [schedules, setSchedules] = useState<any[]>([])
  const [exams, setExams] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [selSchedule, setSelSchedule] = useState("")
  const [selExam, setSelExam] = useState("")
  const [marks, setMarks] = useState<Record<string, { internal: string; external: string; result: string }>>({})
  const [saving, setSaving] = useState(false)
  const { data: session } = useSession()
  const { can } = usePermissions(session)

  useEffect(() => {
    fetch("/api/exams?type=schedule").then(r => r.json()).then(setSchedules)
  }, [])

  useEffect(() => {
    if (selSchedule) {
      fetch(`/api/exams?type=exam&scheduleId=${selSchedule}`).then(r => r.json()).then(setExams)
    }
  }, [selSchedule])

  useEffect(() => {
    if (selExam) {
      fetch(`/api/exams?type=students&examId=${selExam}`).then(r => r.json()).then(students => {
        setStudents(students)
        const m: any = {}
        students.forEach((s: any) => {
          const existing = s.marks?.[0]
          m[s.id] = {
            internal: existing?.internalMarks?.toString() || "",
            external: existing?.externalMarks?.toString() || "",
            result: existing?.result || "PENDING",
          }
        })
        setMarks(m)
      })
    }
  }, [selExam])

  function updateMark(studentId: string, field: string, value: string) {
    setMarks({ ...marks, [studentId]: { ...marks[studentId], [field]: value } })
  }

  async function saveMarks() {
    setSaving(true)
    try {
      const exam = exams.find((e: any) => e.id === selExam)
      const entries = students.map(s => ({
        studentId: s.id,
        examId: selExam,
        courseId: exam?.courseId || "",
        subjectId: exam?.subjectId || "",
        internalMarks: marks[s.id]?.internal || null,
        externalMarks: marks[s.id]?.external || null,
        totalMarks: marks[s.id]?.internal && marks[s.id]?.external ? parseFloat(marks[s.id].internal) + parseFloat(marks[s.id].external) : null,
        result: marks[s.id]?.result || "PENDING",
      }))
      await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "marks_bulk", marks: entries, enteredBy: "system" }),
      })
      alert("Marks saved successfully")
    } catch { alert("Failed to save marks") }
    setSaving(false)
  }

  const exam = exams.find((e: any) => e.id === selExam)

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Schedule</label>
            <select value={selSchedule} onChange={e => setSelSchedule(e.target.value)} className="input-field">
              <option value="">Select schedule</option>
              {schedules.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam</label>
            <select value={selExam} onChange={e => setSelExam(e.target.value)} className="input-field">
              <option value="">Select exam</option>
              {exams.map((e: any) => <option key={e.id} value={e.id}>{e.subject?.name} - {new Date(e.date).toLocaleDateString()}</option>)}
            </select>
          </div>
        </div>
      </div>
      {selExam && (
        <div className="card p-0 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-600">{exam?.subject?.name} | Max Marks: {exam?.maxMarks} | Date: {exam?.date ? new Date(exam.date).toLocaleDateString() : ""}</p>
            {can('examination', 'update') && <button onClick={saveMarks} disabled={saving} className="btn-primary text-sm">{saving ? "Saving..." : "Save All Marks"}</button>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="table-header">Roll No</th>
                <th className="table-header">Student Name</th>
                <th className="table-header">Internal Marks</th>
                <th className="table-header">External Marks</th>
                <th className="table-header">Total</th>
                <th className="table-header">Result</th>
              </tr></thead>
              <tbody>
                {students.map(s => {
                  const m = marks[s.id] || { internal: "", external: "", result: "PENDING" }
                  const total = (parseFloat(m.internal) || 0) + (parseFloat(m.external) || 0)
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="table-cell font-mono text-xs">{s.rollNo}</td>
                      <td className="table-cell font-medium">{s.firstName} {s.lastName}</td>
                      <td className="table-cell">
                        <input type="number" className="input-field w-20 text-sm" value={m.internal}
                          onChange={e => updateMark(s.id, "internal", e.target.value)} />
                      </td>
                      <td className="table-cell">
                        <input type="number" className="input-field w-20 text-sm" value={m.external}
                          onChange={e => updateMark(s.id, "external", e.target.value)} />
                      </td>
                      <td className="table-cell font-medium">{total || "-"}</td>
                      <td className="table-cell">
                        <select value={m.result} onChange={e => updateMark(s.id, "result", e.target.value)} className="input-field text-sm w-28">
                          <option value="PENDING">Pending</option>
                          <option value="PASS">Pass</option>
                          <option value="FAIL">Fail</option>
                          <option value="ABSENT">Absent</option>
                        </select>
                      </td>
                    </tr>
                  )
                })}
                {students.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-500">No students found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function ResultsView() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch("/api/exams?type=result").then(r => r.json()).then(d => { setResults(d); setLoading(false) }) }, [])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card"><p className="text-sm text-gray-500">Total Results</p><p className="text-2xl font-bold">{results.length}</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500">Pass</p><p className="text-2xl font-bold text-green-600">{results.filter((r: any) => r.status === "PASS").length}</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500">Fail</p><p className="text-2xl font-bold text-red-600">{results.filter((r: any) => r.status === "FAIL").length}</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500">Pending</p><p className="text-2xl font-bold text-yellow-600">{results.filter((r: any) => r.status === "PENDING").length}</p></div>
      </div>
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>
            <th className="table-header">Student</th>
            <th className="table-header">Schedule</th>
            <th className="table-header">Total</th>
            <th className="table-header">Percentage</th>
            <th className="table-header">Grade</th>
            <th className="table-header">Status</th>
            <th className="table-header">Published</th>
          </tr></thead>
          <tbody>
            {results.map((r: any) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{r.student?.firstName} {r.student?.lastName}</td>
                <td className="table-cell">{r.examSchedule?.name}</td>
                <td className="table-cell">{r.totalMarks || "-"}</td>
                <td className="table-cell">{r.percentage ? `${r.percentage}%` : "-"}</td>
                <td className="table-cell font-semibold">{r.grade || "-"}</td>
                <td className="table-cell"><span className={`badge ${statusColors[r.status] || "badge-default"}`}>{r.status}</span></td>
                <td className="table-cell"><span className={`badge ${r.isPublished ? "badge-success" : "badge-warning"}`}>{r.isPublished ? "Yes" : "No"}</span></td>
              </tr>
            ))}
            {results.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-500">No results published</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
