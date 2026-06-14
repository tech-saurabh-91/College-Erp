"use client"
import { useEffect, useState } from "react"
import { Plus, X, Trash2, Edit } from "lucide-react"
import { useSession } from "next-auth/react"
import { usePermissions } from "@/lib/permissions"

interface TimetableEntry {
  id: string; dayOfWeek: number; startTime: string; endTime: string; roomNo: string;
  classSectionId: string; subjectId: string; courseId: string; facultyId: string;
  academicYear: string; semester: number;
  classSection?: { id: string; name: string; program?: { name: string } };
  subject?: { id: string; name: string; code: string };
  course?: { id: string; name: string };
  faculty?: { id: string; firstName: string; lastName: string };
}

interface ClassSection { id: string; name: string; program?: { name: string } }
interface Subject { id: string; name: string; code: string; courseId: string }
interface Course { id: string; name: string }
interface Faculty { id: string; firstName: string; lastName: string }

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const HOURS = Array.from({ length: 10 }, (_, i) => {
  const h = i + 7
  return `${h.toString().padStart(2, "0")}:00`
})

export default function TimetablePage() {
  const { data: session } = useSession()
  const { can } = usePermissions(session)
  const [entries, setEntries] = useState<TimetableEntry[]>([])
  const [classSections, setClassSections] = useState<ClassSection[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null)
  const [selectedSection, setSelectedSection] = useState("")

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [tRes, csRes, sRes, cRes, fRes] = await Promise.all([
        fetch("/api/timetable"),
        fetch("/api/timetable/class-sections"),
        fetch("/api/curriculum?type=subject"),
        fetch("/api/curriculum?type=course"),
        fetch("/api/timetable/faculties"),
      ])
      setEntries(await tRes.json())
      const csData = await csRes.json(); setClassSections(Array.isArray(csData) ? csData : [])
      setSubjects(await sRes.json())
      setCourses(await cRes.json())
      const fData = await fRes.json(); setFaculties(Array.isArray(fData) ? fData : [])
    } catch { setEntries([]); setClassSections([]); setSubjects([]); setCourses([]); setFaculties([]) }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this timetable entry?")) return
    try {
      await fetch(`/api/timetable?id=${id}`, { method: "DELETE" })
      fetchAll()
    } catch { alert("Failed to delete") }
  }

  function getEntry(day: number, time: string): TimetableEntry | undefined {
    return entries.find(e => e.dayOfWeek === day && e.startTime <= time && e.endTime > time)
  }

  const filteredEntries = selectedSection
    ? entries.filter(e => e.classSectionId === selectedSection)
    : entries

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Timetable</h1>
        {can("timetable", "create") && <button onClick={() => { setEditingEntry(null); setShowModal(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Entry
        </button>}
      </div>

      <div className="flex items-center gap-4">
        <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)}
          className="input-field w-auto max-w-xs">
          <option value="">All Sections</option>
          {classSections.map(cs => (
            <option key={cs.id} value={cs.id}>{cs.name} {cs.program?.name ? `(${cs.program.name})` : ""}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">{filteredEntries.length} entries</span>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr>
              <th className="table-header w-20">Time</th>
              {DAYS.map((day, i) => (
                <th key={day} className="table-header text-center">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((time, ti) => (
              <tr key={time} className={ti % 2 === 0 ? "bg-gray-50/50" : ""}>
                <td className="table-cell font-medium text-xs text-gray-500 w-20 border-r border-gray-100">
                  {time} - {String(parseInt(time) + 1).padStart(2, "0")}:00
                </td>
                {DAYS.map((_, day) => {
                  const entry = getEntry(day, time)
                  return (
                    <td key={day} className="table-cell text-center p-1 border-r border-gray-50">
                      {entry ? (
                        <div className="group relative bg-blue-50 rounded-lg p-2 text-xs border border-blue-100">
                          <p className="font-medium text-blue-800 truncate">{entry.subject?.name || "-"}</p>
                          <p className="text-blue-600 truncate">{entry.faculty?.firstName} {entry.faculty?.lastName}</p>
                          <p className="text-blue-400">Room {entry.roomNo}</p>
                          <div className="absolute -top-1.5 -right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {can("timetable", "update") && <button onClick={() => { setEditingEntry(entry); setShowModal(true) }}
                              className="bg-green-500 text-white rounded-full p-0.5"><Edit size={12} /></button>}
                            {can("timetable", "delete") && <button onClick={() => handleDelete(entry.id)}
                              className="bg-red-500 text-white rounded-full p-0.5"><Trash2 size={12} /></button>}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">--</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-gray-800">{editingEntry ? "Edit" : "Add"} Timetable Entry</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <TimetableForm entry={editingEntry} classSections={classSections} subjects={subjects} courses={courses} faculties={faculties}
              onClose={() => { setShowModal(false); fetchAll() }} />
          </div>
        </div>
      )}
    </div>
  )
}

function TimetableForm({ entry, classSections, subjects, courses, faculties, onClose }: {
  entry: TimetableEntry | null; classSections: ClassSection[]; subjects: Subject[]; courses: Course[]; faculties: Faculty[]; onClose: () => void
}) {
  const [form, setForm] = useState({
    classSectionId: entry?.classSectionId || "",
    subjectId: entry?.subjectId || "",
    courseId: entry?.courseId || "",
    facultyId: entry?.facultyId || "",
    dayOfWeek: entry?.dayOfWeek?.toString() || "0",
    startTime: entry?.startTime || "08:00",
    endTime: entry?.endTime || "09:00",
    roomNo: entry?.roomNo || "",
    academicYear: entry?.academicYear || new Date().getFullYear().toString(),
    semester: entry?.semester?.toString() || "1",
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const isEdit = !!entry?.id
      const body = isEdit ? { id: entry.id, ...form } : form
      const method = isEdit ? "PUT" : "POST"
      await fetch("/api/timetable", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      onClose()
    } catch { alert("Failed to save") }
    setSaving(false)
  }

  function update(field: string, value: any) { setForm({ ...form, [field]: value }) }

  const timeSlots = Array.from({ length: 13 }, (_, i) => {
    const h = i + 7
    return `${h.toString().padStart(2, "0")}:00`
  })

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Class Section</label>
          <select required value={form.classSectionId} onChange={e => update("classSectionId", e.target.value)} className="input-field">
            <option value="">Select Section</option>
            {classSections.map(cs => (
              <option key={cs.id} value={cs.id}>{cs.name} {cs.program?.name ? `(${cs.program.name})` : ""}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
          <select required value={form.courseId} onChange={e => update("courseId", e.target.value)} className="input-field">
            <option value="">Select Course</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <select required value={form.subjectId} onChange={e => update("subjectId", e.target.value)} className="input-field">
            <option value="">Select Subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Faculty</label>
          <select required value={form.facultyId} onChange={e => update("facultyId", e.target.value)} className="input-field">
            <option value="">Select Faculty</option>
            {faculties.map(f => <option key={f.id} value={f.id}>{f.firstName} {f.lastName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
          <select required value={form.dayOfWeek} onChange={e => update("dayOfWeek", e.target.value)} className="input-field">
            {DAYS.map((day, i) => <option key={i} value={i}>{day}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
          <select required value={form.startTime} onChange={e => update("startTime", e.target.value)} className="input-field">
            {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
          <select required value={form.endTime} onChange={e => update("endTime", e.target.value)} className="input-field">
            {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Room No</label>
          <input required value={form.roomNo} onChange={e => update("roomNo", e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
          <input required value={form.academicYear} onChange={e => update("academicYear", e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
          <input type="number" required min={1} value={form.semester} onChange={e => update("semester", e.target.value)} className="input-field" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : entry ? "Update Entry" : "Add Entry"}</button>
      </div>
    </form>
  )
}
