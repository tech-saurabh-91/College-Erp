"use client"
import { useEffect, useState } from "react"
import { Plus, Search, X, Edit, Trash2, Eye } from "lucide-react"
import { useSession } from "next-auth/react"
import { usePermissions } from "@/lib/permissions"

interface Program { id: string; code: string; name: string }
interface ClassSection { id: string; name: string; program?: Program; semester: number; section: string }
interface Student {
  id: string; rollNo: string; firstName: string; lastName: string; email: string; phone: string;
  gender: string; dateOfBirth: string; program?: Program; programId: string; currentSemester: number; batchYear: string;
  status: string; address: string; city: string; state: string; pincode: string;
  nationality: string; category: string; religion: string; aadharNo: string;
  fatherName: string; fatherPhone: string; motherName: string; motherPhone: string;
  classSectionId?: string;
}

const statusColors: Record<string, string> = {
  ACTIVE: "badge-success", ALUMNI: "badge-info", TRANSFERRED: "badge-warning", WITHDRAWN: "badge-danger",
}

export default function StudentsPage() {
  const { data: session } = useSession()
  const { can } = usePermissions(session)
  const role = (session?.user as any)?.role
  const isStudent = role === "STUDENT"
  const isParent = role === "PARENT"

  const [students, setStudents] = useState<Student[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [classSections, setClassSections] = useState<ClassSection[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [programFilter, setProgramFilter] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)

  useEffect(() => { fetchStudents(); fetchPrograms(); fetchClassSections() }, [])

  async function fetchClassSections() {
    try { const res = await fetch("/api/timetable/class-sections"); setClassSections(await res.json()) }
    catch { setClassSections([]) }
  }

  async function fetchStudents() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (programFilter) params.set("program", programFilter)
    try {
      const res = await fetch(`/api/students?${params}`)
      setStudents(await res.json())
    } catch { setStudents([]) }
    setLoading(false)
  }

  async function fetchPrograms() {
    try {
      const res = await fetch("/api/curriculum?type=program")
      setPrograms(await res.json())
    } catch { setPrograms([]) }
  }

  useEffect(() => { fetchStudents() }, [programFilter])

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this student?")) return
    try {
      await fetch(`/api/students/${id}`, { method: "DELETE" })
      fetchStudents()
    } catch { alert("Failed to delete") }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Student Information</h1>
        {can('student', 'create') && (
          <button onClick={() => { setEditingStudent(null); setShowModal(true) }} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Student
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by name, roll no, email..." value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchStudents()}
            className="input-field pl-9" />
        </div>
        <select value={programFilter} onChange={e => setProgramFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Programs</option>
          {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={fetchStudents} className="btn-secondary text-sm">Search</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Roll No</th>
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Program</th>
                <th className="table-header">Semester</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500">Loading...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500">No students found</td></tr>
              ) : (
                students.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="table-cell font-mono text-xs font-medium">{s.rollNo}</td>
                    <td className="table-cell font-medium">{s.firstName} {s.lastName}</td>
                    <td className="table-cell">{s.email}</td>
                    <td className="table-cell">{s.program?.name || "-"}</td>
                    <td className="table-cell">Sem {s.currentSemester}</td>
                    <td className="table-cell"><span className={`badge ${statusColors[s.status] || "badge-default"}`}>{s.status}</span></td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        {can('student', 'update') && (
                          <button onClick={() => { setEditingStudent(s); setShowModal(true) }}
                            className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><Edit size={15} /></button>
                        )}
                        {can('student', 'delete') && (
                          <button onClick={() => handleDelete(s.id)}
                            className="p-1.5 hover:bg-red-50 rounded text-red-600"><Trash2 size={15} /></button>
                        )}
                        {!can('student', 'update') && !can('student', 'delete') && (
                          <span className="text-xs text-gray-400">View only</span>
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
              <h2 className="text-lg font-semibold text-gray-800">{editingStudent ? "Edit Student" : "Add Student"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <StudentForm student={editingStudent} programs={programs} classSections={classSections}
              onClose={() => { setShowModal(false); fetchStudents() }} />
          </div>
        </div>
      )}
    </div>
  )
}

function StudentForm({ student, programs, classSections, onClose }: { student: Student | null; programs: Program[]; classSections: ClassSection[]; onClose: () => void }) {
  const [form, setForm] = useState<any>({
    firstName: student?.firstName || "",
    lastName: student?.lastName || "",
    dateOfBirth: student?.dateOfBirth ? student.dateOfBirth.toString().split("T")[0] : "",
    gender: student?.gender || "MALE",
    email: student?.email || "",
    phone: student?.phone || "",
    address: student?.address || "",
    city: student?.city || "",
    state: student?.state || "",
    pincode: student?.pincode || "",
    nationality: student?.nationality || "Indian",
    category: student?.category || "GENERAL",
    religion: student?.religion || "",
    aadharNo: student?.aadharNo || "",
    fatherName: student?.fatherName || "",
    fatherPhone: student?.fatherPhone || "",
    motherName: student?.motherName || "",
    motherPhone: student?.motherPhone || "",
    programId: student?.programId || "",
    classSectionId: student?.classSectionId || "",
    currentSemester: student?.currentSemester || 1,
    batchYear: student?.batchYear || "",
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (student) {
        await fetch(`/api/students/${student.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      } else {
        await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      }
      onClose()
    } catch { alert("Failed to save") }
    setSaving(false)
  }

  function update(field: string, value: any) { setForm({ ...form, [field]: value }) }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input required value={form.firstName} onChange={e => update("firstName", e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input required value={form.lastName} onChange={e => update("lastName", e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
          <input type="date" required value={form.dateOfBirth} onChange={e => update("dateOfBirth", e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select value={form.gender} onChange={e => update("gender", e.target.value)} className="input-field">
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" required value={form.email} onChange={e => update("email", e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input required value={form.phone} onChange={e => update("phone", e.target.value)} className="input-field" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea rows={2} value={form.address} onChange={e => update("address", e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input value={form.city} onChange={e => update("city", e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <input value={form.state} onChange={e => update("state", e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
          <input value={form.nationality} onChange={e => update("nationality", e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select value={form.category} onChange={e => update("category", e.target.value)} className="input-field">
            <option value="GENERAL">General</option>
            <option value="OBC">OBC</option>
            <option value="SC">SC</option>
            <option value="ST">ST</option>
            <option value="EWS">EWS</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
          <select required value={form.programId} onChange={e => update("programId", e.target.value)} className="input-field">
            <option value="">Select Program</option>
            {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Semester</label>
          <input type="number" min={1} value={form.currentSemester} onChange={e => update("currentSemester", parseInt(e.target.value))} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Batch Year</label>
          <input value={form.batchYear} onChange={e => update("batchYear", e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class Section</label>
          <select value={form.classSectionId} onChange={e => update("classSectionId", e.target.value)} className="input-field">
            <option value="">Select Class Section</option>
            {classSections.filter(cs => !form.programId || cs.program?.id === form.programId).map(cs => (
              <option key={cs.id} value={cs.id}>{cs.name} (Sem {cs.semester} - {cs.section})</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">Required for attendance tracking</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Father Name</label>
          <input value={form.fatherName} onChange={e => update("fatherName", e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mother Name</label>
          <input value={form.motherName} onChange={e => update("motherName", e.target.value)} className="input-field" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : student ? "Update Student" : "Add Student"}</button>
      </div>
    </form>
  )
}
