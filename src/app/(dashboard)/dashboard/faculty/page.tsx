"use client"
import { useEffect, useState } from "react"
import { Plus, X, Search, Edit, Trash2, BookOpen, CalendarDays, CheckCircle, XCircle } from "lucide-react"
import { useSession } from "next-auth/react"
import { usePermissions } from "@/lib/permissions"

interface Faculty {
  id: string; employeeId: string; firstName: string; lastName: string; email: string; phone: string;
  department: string; designation: string; qualification: string; specialization?: string;
  dateOfJoining: string; salary?: number; address: string; isActive: boolean;
  _count?: { facultySubjects: number; leaveRequests: number }
}
interface FacultySubject { id: string; facultyId: string; courseId: string; subjectId: string; semester: number; academicYear: string; course?: { name: string }; subject?: { name: string }; faculty?: Faculty }
interface LeaveRequest { id: string; facultyId: string; type: string; startDate: string; endDate: string; reason: string; status: string; approvedBy?: string; faculty?: Faculty }
interface Course { id: string; name: string; code: string }
interface Subject { id: string; name: string; code: string; courseId: string }

type TabType = "list" | "subjects" | "leaves"

const tabs: { key: TabType; label: string }[] = [
  { key: "list", label: "Faculty List" },
  { key: "subjects", label: "Subject Assignments" },
  { key: "leaves", label: "Leave Management" },
]

const statusColors: Record<string, string> = {
  PENDING: "badge-warning", APPROVED: "badge-success", REJECTED: "badge-danger",
}

export default function FacultyPage() {
  const { data: session } = useSession()
  const { can } = usePermissions(session)
  const [activeTab, setActiveTab] = useState<TabType>("list")
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [subjects, setSubjects] = useState<FacultySubject[]>([])
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [departments, setDepartments] = useState<string[]>([])
  const [deptFilter, setDeptFilter] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null)
  const [modalType, setModalType] = useState<"faculty" | "subject" | "leave">("faculty")
  const [facultyList, setFacultyList] = useState<Faculty[]>([])

  useEffect(() => { fetchData() }, [activeTab])

  async function fetchData() {
    setLoading(true)
    try {
      if (activeTab === "list") {
        const params = new URLSearchParams()
        if (search) params.set("search", search)
        if (deptFilter) params.set("department", deptFilter)
        const res = await fetch(`/api/faculty?type=list&${params}`)
        setFaculty(await res.json())
        const dRes = await fetch("/api/faculty?type=departments")
        setDepartments(await dRes.json())
      }
      if (activeTab === "subjects") {
        const sRes = await fetch("/api/faculty?type=subjects")
        setSubjects(await sRes.json())
      }
      if (activeTab === "leaves") {
        const lRes = await fetch("/api/faculty?type=leaves")
        setLeaves(await lRes.json())
      }
      const fRes = await fetch("/api/faculty?type=list")
      setFacultyList(await fRes.json())
    } catch { setFaculty([]); setSubjects([]); setLeaves([]) }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this faculty member? This will also remove all associated data.")) return
    try {
      await fetch(`/api/faculty/${id}`, { method: "DELETE" })
      fetchData()
    } catch { alert("Failed to delete") }
  }

  const filtered = faculty.filter(f => {
    if (!search) return true
    const s = search.toLowerCase()
    return f.firstName.toLowerCase().includes(s) || f.lastName.toLowerCase().includes(s) || f.email.toLowerCase().includes(s) || f.employeeId.toLowerCase().includes(s)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Faculty Management</h1>
        {can("faculty", "create") && <button onClick={() => { setModalType("faculty"); setEditingFaculty(null); setShowModal(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Faculty
        </button>}
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === tab.key ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "list" && (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search faculty..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
            </div>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="input-field w-auto">
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <button onClick={fetchData} className="btn-secondary text-sm">Refresh</button>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr>
                  <th className="table-header">Emp ID</th>
                  <th className="table-header">Name</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Department</th>
                  <th className="table-header">Designation</th>
                  <th className="table-header">Subjects</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Actions</th>
                </tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="text-center py-10 text-gray-500">Loading...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-10 text-gray-500">No faculty found</td></tr>
                  ) : (
                    filtered.map(f => (
                      <tr key={f.id} className="hover:bg-gray-50">
                        <td className="table-cell font-mono text-xs">{f.employeeId}</td>
                        <td className="table-cell font-medium">{f.firstName} {f.lastName}</td>
                        <td className="table-cell">{f.email}</td>
                        <td className="table-cell">{f.department}</td>
                        <td className="table-cell">{f.designation}</td>
                        <td className="table-cell">{f._count?.facultySubjects || 0}</td>
                        <td className="table-cell"><span className={`badge ${f.isActive ? "badge-success" : "badge-danger"}`}>{f.isActive ? "Active" : "Inactive"}</span></td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            {can("faculty", "update") && <button onClick={() => { setEditingFaculty(f); setModalType("faculty"); setShowModal(true) }} className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><Edit size={15} /></button>}
                            {can("faculty", "delete") && <button onClick={() => handleDelete(f.id)} className="p-1.5 hover:bg-red-50 rounded text-red-600"><Trash2 size={15} /></button>}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "subjects" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">{subjects.length} total assignments</p>
            {can("faculty", "create") && <button onClick={() => { setModalType("subject"); setShowModal(true) }} className="btn-primary text-sm flex items-center gap-1"><Plus size={14} /> Assign Subject</button>}
          </div>
          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead><tr>
                <th className="table-header">Faculty</th>
                <th className="table-header">Course</th>
                <th className="table-header">Subject</th>
                <th className="table-header">Semester</th>
                <th className="table-header">Academic Year</th>
                <th className="table-header">Actions</th>
              </tr></thead>
              <tbody>
                {subjects.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{s.faculty?.firstName} {s.faculty?.lastName}</td>
                    <td className="table-cell">{s.course?.name || "-"}</td>
                    <td className="table-cell">{s.subject?.name || "-"}</td>
                    <td className="table-cell">Sem {s.semester}</td>
                    <td className="table-cell">{s.academicYear}</td>
                    <td className="table-cell">
                      {can("faculty", "delete") && <button onClick={async () => { if (confirm("Remove this assignment?")) { await fetch(`/api/faculty?type=subject&id=${s.id}`, { method: "DELETE" }); fetchData() } }} className="p-1.5 hover:bg-red-50 rounded text-red-600"><Trash2 size={15} /></button>}
                    </td>
                  </tr>
                ))}
                {subjects.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-500">No subject assignments</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "leaves" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">{leaves.length} leave requests</p>
            {can("faculty", "create") && <button onClick={() => { setModalType("leave"); setShowModal(true) }} className="btn-primary text-sm flex items-center gap-1"><Plus size={14} /> New Leave Request</button>}
          </div>
          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead><tr>
                <th className="table-header">Faculty</th>
                <th className="table-header">Type</th>
                <th className="table-header">From</th>
                <th className="table-header">To</th>
                <th className="table-header">Reason</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr></thead>
              <tbody>
                {leaves.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{l.faculty?.firstName} {l.faculty?.lastName}</td>
                    <td className="table-cell">{l.type}</td>
                    <td className="table-cell">{new Date(l.startDate).toLocaleDateString()}</td>
                    <td className="table-cell">{new Date(l.endDate).toLocaleDateString()}</td>
                    <td className="table-cell max-w-[200px] truncate">{l.reason}</td>
                    <td className="table-cell"><span className={`badge ${statusColors[l.status] || "badge-default"}`}>{l.status}</span></td>
                    <td className="table-cell">
                      {l.status === "PENDING" && (
                        <div className="flex gap-1">
                          <button onClick={async () => { await fetch("/api/faculty", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "leave", id: l.id, status: "APPROVED", approvedBy: "Admin" }) }); fetchData() }} className="p-1.5 hover:bg-green-50 rounded text-green-600"><CheckCircle size={15} /></button>
                          <button onClick={async () => { await fetch("/api/faculty", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "leave", id: l.id, status: "REJECTED", approvedBy: "Admin" }) }); fetchData() }} className="p-1.5 hover:bg-red-50 rounded text-red-600"><XCircle size={15} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {leaves.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-500">No leave requests</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-gray-800">
                {modalType === "faculty" ? (editingFaculty ? "Edit Faculty" : "Add Faculty") : modalType === "subject" ? "Assign Subject" : "New Leave Request"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            {modalType === "faculty" && <FacultyForm faculty={editingFaculty} onClose={() => { setShowModal(false); fetchData() }} />}
            {modalType === "subject" && <SubjectForm facultyList={facultyList} onClose={() => { setShowModal(false); fetchData() }} />}
            {modalType === "leave" && <LeaveForm facultyList={facultyList} onClose={() => { setShowModal(false); fetchData() }} />}
          </div>
        </div>
      )}
    </div>
  )
}

function FacultyForm({ faculty, onClose }: { faculty: Faculty | null; onClose: () => void }) {
  const [form, setForm] = useState({
    firstName: faculty?.firstName || "", lastName: faculty?.lastName || "",
    email: faculty?.email || "", phone: faculty?.phone || "",
    department: faculty?.department || "", designation: faculty?.designation || "Assistant Professor",
    qualification: faculty?.qualification || "", specialization: faculty?.specialization || "",
    dateOfJoining: faculty?.dateOfJoining ? faculty.dateOfJoining.split("T")[0] : "",
    salary: faculty?.salary?.toString() || "", address: faculty?.address || "",
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (faculty) {
        await fetch("/api/faculty", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "faculty", id: faculty.id, ...form }),
        })
      } else {
        await fetch("/api/faculty", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "faculty", ...form }),
        })
      }
      onClose()
    } catch { alert("Failed to save") }
    setSaving(false)
  }
  function upd(f: string, v: any) { setForm({ ...form, [f]: v }) }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">First Name</label><input required value={form.firstName} onChange={e => upd("firstName", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label><input required value={form.lastName} onChange={e => upd("lastName", e.target.value)} className="input-field" /></div>
        {!faculty && <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" required value={form.email} onChange={e => upd("email", e.target.value)} className="input-field" /></div>}
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input required value={form.phone} onChange={e => upd("phone", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Department</label><input required value={form.department} onChange={e => upd("department", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
          <select value={form.designation} onChange={e => upd("designation", e.target.value)} className="input-field">
            <option value="Professor">Professor</option>
            <option value="Associate Professor">Associate Professor</option>
            <option value="Assistant Professor">Assistant Professor</option>
            <option value="Lecturer">Lecturer</option>
            <option value="HOD">HOD</option>
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label><input required value={form.qualification} onChange={e => upd("qualification", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label><input value={form.specialization} onChange={e => upd("specialization", e.target.value)} className="input-field" /></div>
        {!faculty && <div><label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label><input type="date" required value={form.dateOfJoining} onChange={e => upd("dateOfJoining", e.target.value)} className="input-field" /></div>}
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Salary</label><input type="number" value={form.salary} onChange={e => upd("salary", e.target.value)} className="input-field" /></div>
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea rows={2} value={form.address} onChange={e => upd("address", e.target.value)} className="input-field" /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : faculty ? "Update" : "Add Faculty"}</button>
      </div>
    </form>
  )
}

function SubjectForm({ facultyList, onClose }: { facultyList: Faculty[]; onClose: () => void }) {
  const [courses, setCourses] = useState<Course[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [form, setForm] = useState({ facultyId: "", courseId: "", subjectId: "", semester: "1", academicYear: new Date().getFullYear().toString() })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetch("/api/curriculum?type=course").then(r => r.json()).then(setCourses) }, [])
  useEffect(() => {
    if (form.courseId) fetch(`/api/curriculum?type=subject&courseId=${form.courseId}`).then(r => r.json()).then(setSubjects)
  }, [form.courseId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "subject", ...form }),
      })
      onClose()
    } catch { alert("Failed") }
    setSaving(false)
  }
  function upd(f: string, v: any) { setForm({ ...form, [f]: v }) }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Faculty</label>
          <select required value={form.facultyId} onChange={e => upd("facultyId", e.target.value)} className="input-field">
            <option value="">Select faculty</option>
            {facultyList.map(f => <option key={f.id} value={f.id}>{f.firstName} {f.lastName} ({f.employeeId})</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
          <select required value={form.courseId} onChange={e => upd("courseId", e.target.value)} className="input-field">
            <option value="">Select course</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <select required value={form.subjectId} onChange={e => upd("subjectId", e.target.value)} className="input-field">
            <option value="">Select subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
          <input type="number" required min={1} value={form.semester} onChange={e => upd("semester", e.target.value)} className="input-field" />
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
          <input required value={form.academicYear} onChange={e => upd("academicYear", e.target.value)} className="input-field" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Assign Subject"}</button>
      </div>
    </form>
  )
}

function LeaveForm({ facultyList, onClose }: { facultyList: Faculty[]; onClose: () => void }) {
  const [form, setForm] = useState({
    facultyId: "", leaveType: "SICK", startDate: "", endDate: "", reason: "",
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "leave", ...form }),
      })
      onClose()
    } catch { alert("Failed") }
    setSaving(false)
  }
  function upd(f: string, v: any) { setForm({ ...form, [f]: v }) }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Faculty</label>
          <select required value={form.facultyId} onChange={e => upd("facultyId", e.target.value)} className="input-field">
            <option value="">Select faculty</option>
            {facultyList.map(f => <option key={f.id} value={f.id}>{f.firstName} {f.lastName}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
          <select value={form.leaveType} onChange={e => upd("leaveType", e.target.value)} className="input-field">
            <option value="SICK">Sick</option>
            <option value="CASUAL">Casual</option>
            <option value="ANNUAL">Annual</option>
            <option value="MATERNITY">Maternity</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input type="date" required value={form.startDate} onChange={e => upd("startDate", e.target.value)} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input type="date" required value={form.endDate} onChange={e => upd("endDate", e.target.value)} className="input-field" /></div>
        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
          <textarea required rows={3} value={form.reason} onChange={e => upd("reason", e.target.value)} className="input-field" /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Submit Request"}</button>
      </div>
    </form>
  )
}
