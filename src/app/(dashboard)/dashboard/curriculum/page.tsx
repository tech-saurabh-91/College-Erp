"use client"
import { useEffect, useState } from "react"
import { Plus, X, ChevronDown, ChevronRight, BookOpen, Layers, BookText } from "lucide-react"

interface Program { id: string; code: string; name: string; duration: number; degreeType: string; department: string; description?: string; totalSemesters: number; totalCredits?: number; isActive: boolean }
interface Course { id: string; code: string; name: string; programId: string; program?: Program; semester: number; credits: number; isElective: boolean; description?: string; maxMarks: number; passMarks: number; isActive: boolean }
interface Subject { id: string; code: string; name: string; courseId: string; course?: Course & { program?: Program }; credits: number; type: string; maxMarks: number; passMarks: number; isActive: boolean }

const degreeTypes = ["BACHELOR", "MASTER", "DIPLOMA", "CERTIFICATE"]

export default function CurriculumPage() {
  const [activeView, setActiveView] = useState<"program" | "course" | "subject">("program")
  const [programs, setPrograms] = useState<Program[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null)
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)

  useEffect(() => { fetchData() }, [activeView])

  async function fetchData() {
    setLoading(true)
    try {
      const [pRes, cRes, sRes] = await Promise.all([
        fetch("/api/curriculum?type=program"),
        fetch("/api/curriculum?type=course"),
        fetch("/api/curriculum?type=subject"),
      ])
      setPrograms(await pRes.json())
      setCourses(await cRes.json())
      setSubjects(await sRes.json())
    } catch { setPrograms([]); setCourses([]); setSubjects([]) }
    setLoading(false)
  }

  const views = [
    { key: "program" as const, label: "Programs", icon: BookOpen },
    { key: "course" as const, label: "Courses", icon: Layers },
    { key: "subject" as const, label: "Subjects", icon: BookText },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Curriculum Management</h1>
        <button onClick={() => { setEditingItem(null); setShowModal(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add {activeView === "program" ? "Program" : activeView === "course" ? "Course" : "Subject"}
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {views.map(v => {
          const Icon = v.icon
          return (
            <button key={v.key} onClick={() => setActiveView(v.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeView === v.key ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"
              }`}>
              <Icon size={16} /> {v.label}
            </button>
          )
        })}
      </div>

      {/* Programs view */}
      {activeView === "program" && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Code</th>
                <th className="table-header">Name</th>
                <th className="table-header">Degree</th>
                <th className="table-header">Department</th>
                <th className="table-header">Duration</th>
                <th className="table-header">Semesters</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {programs.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="table-cell font-mono text-xs font-medium">{p.code}</td>
                  <td className="table-cell font-medium">{p.name}</td>
                  <td className="table-cell">{p.degreeType}</td>
                  <td className="table-cell">{p.department}</td>
                  <td className="table-cell">{p.duration} yrs</td>
                  <td className="table-cell">{p.totalSemesters}</td>
                  <td className="table-cell"><span className={`badge ${p.isActive ? "badge-success" : "badge-danger"}`}>{p.isActive ? "Active" : "Inactive"}</span></td>
                  <td className="table-cell">
                    <button onClick={() => { setEditingItem(p); setShowModal(true) }} className="text-blue-600 hover:underline text-sm">Edit</button>
                  </td>
                </tr>
              ))}
              {programs.length === 0 && !loading && (
                <tr><td colSpan={8} className="text-center py-10 text-gray-500">No programs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Courses view with accordion by program */}
      {activeView === "course" && (
        <div className="space-y-3">
          {programs.map(p => {
            const progCourses = courses.filter(c => c.programId === p.id)
            return (
              <div key={p.id} className="card p-0 overflow-hidden">
                <button onClick={() => setExpandedProgram(expandedProgram === p.id ? null : p.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {expandedProgram === p.id ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                    <span className="font-semibold text-gray-800">{p.name}</span>
                    <span className="text-xs text-gray-500">({progCourses.length} courses)</span>
                  </div>
                  <span className="text-xs text-gray-400">{p.code}</span>
                </button>
                {expandedProgram === p.id && (
                  <div className="border-t border-gray-100 overflow-x-auto">
                    {progCourses.length === 0 ? (
                      <p className="p-4 text-sm text-gray-500 text-center">No courses for this program</p>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="table-header">Code</th>
                            <th className="table-header">Name</th>
                            <th className="table-header">Semester</th>
                            <th className="table-header">Credits</th>
                            <th className="table-header">Type</th>
                            <th className="table-header">Status</th>
                            <th className="table-header">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {progCourses.map(c => (
                            <tr key={c.id} className="hover:bg-gray-50">
                              <td className="table-cell font-mono text-xs">{c.code}</td>
                              <td className="table-cell font-medium">{c.name}</td>
                              <td className="table-cell">Sem {c.semester}</td>
                              <td className="table-cell">{c.credits}</td>
                              <td className="table-cell">{c.isElective ? "Elective" : "Core"}</td>
                              <td className="table-cell"><span className={`badge ${c.isActive ? "badge-success" : "badge-danger"}`}>{c.isActive ? "Active" : "Inactive"}</span></td>
                              <td className="table-cell">
                                <button onClick={() => { setEditingItem(c); setShowModal(true) }} className="text-blue-600 hover:underline text-sm">Edit</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Subjects view with accordion by course */}
      {activeView === "subject" && (
        <div className="space-y-3">
          {courses.map(c => {
            const courseSubjects = subjects.filter(s => s.courseId === c.id)
            return (
              <div key={c.id} className="card p-0 overflow-hidden">
                <button onClick={() => setExpandedCourse(expandedCourse === c.id ? null : c.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {expandedCourse === c.id ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                    <span className="font-semibold text-gray-800">{c.name}</span>
                    <span className="text-xs text-gray-500">({courseSubjects.length} subjects)</span>
                  </div>
                  <span className="text-xs text-gray-400">{c.code}</span>
                </button>
                {expandedCourse === c.id && (
                  <div className="border-t border-gray-100 overflow-x-auto">
                    {courseSubjects.length === 0 ? (
                      <p className="p-4 text-sm text-gray-500 text-center">No subjects for this course</p>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="table-header">Code</th>
                            <th className="table-header">Name</th>
                            <th className="table-header">Type</th>
                            <th className="table-header">Credits</th>
                            <th className="table-header">Max Marks</th>
                            <th className="table-header">Status</th>
                            <th className="table-header">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {courseSubjects.map(s => (
                            <tr key={s.id} className="hover:bg-gray-50">
                              <td className="table-cell font-mono text-xs">{s.code}</td>
                              <td className="table-cell font-medium">{s.name}</td>
                              <td className="table-cell">{s.type}</td>
                              <td className="table-cell">{s.credits}</td>
                              <td className="table-cell">{s.maxMarks}</td>
                              <td className="table-cell"><span className={`badge ${s.isActive ? "badge-success" : "badge-danger"}`}>{s.isActive ? "Active" : "Inactive"}</span></td>
                              <td className="table-cell">
                                <button onClick={() => { setEditingItem(s); setShowModal(true) }} className="text-blue-600 hover:underline text-sm">Edit</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingItem ? "Edit" : "Add"} {activeView === "program" ? "Program" : activeView === "course" ? "Course" : "Subject"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <CurriculumForm type={activeView} item={editingItem} programs={programs} courses={courses}
              onClose={() => { setShowModal(false); fetchData() }} />
          </div>
        </div>
      )}
    </div>
  )
}

function CurriculumForm({ type, item, programs, courses, onClose }: {
  type: string; item: any; programs: Program[]; courses: Course[]; onClose: () => void
}) {
  const [form, setForm] = useState<any>(() => {
    if (type === "program") return {
      code: item?.code || "",
      name: item?.name || "",
      duration: item?.duration || 3,
      degreeType: item?.degreeType || "BACHELOR",
      department: item?.department || "",
      description: item?.description || "",
      totalSemesters: item?.totalSemesters || 6,
      totalCredits: item?.totalCredits || "",
    }
    if (type === "course") return {
      code: item?.code || "",
      name: item?.name || "",
      programId: item?.programId || "",
      semester: item?.semester || 1,
      credits: item?.credits || 4,
      isElective: item?.isElective || false,
      description: item?.description || "",
      maxMarks: item?.maxMarks || 100,
      passMarks: item?.passMarks || 40,
    }
    return {
      code: item?.code || "",
      name: item?.name || "",
      courseId: item?.courseId || "",
      credits: item?.credits || 3,
      type: item?.type || "THEORY",
      maxMarks: item?.maxMarks || 100,
      passMarks: item?.passMarks || 40,
    }
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const isEdit = !!item?.id
      await fetch(isEdit ? `/api/curriculum/${item.id}` : "/api/curriculum", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...form }),
      })
      onClose()
    } catch { alert("Failed to save") }
    setSaving(false)
  }

  function update(field: string, value: any) { setForm({ ...form, [field]: value }) }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      {type === "program" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
            <input required value={form.code} onChange={e => update("code", e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input required value={form.name} onChange={e => update("name", e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Degree Type</label>
            <select value={form.degreeType} onChange={e => update("degreeType", e.target.value)} className="input-field">
              {degreeTypes.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input required value={form.department} onChange={e => update("department", e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (years)</label>
            <input type="number" required min={1} value={form.duration} onChange={e => update("duration", e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Semesters</label>
            <input type="number" required min={1} value={form.totalSemesters} onChange={e => update("totalSemesters", e.target.value)} className="input-field" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={2} value={form.description} onChange={e => update("description", e.target.value)} className="input-field" />
          </div>
        </div>
      )}

      {type === "course" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
            <input required value={form.code} onChange={e => update("code", e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input required value={form.name} onChange={e => update("name", e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
            <select required value={form.programId} onChange={e => update("programId", e.target.value)} className="input-field">
              <option value="">Select Program</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
            <input type="number" required min={1} value={form.semester} onChange={e => update("semester", e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
            <input type="number" required min={1} value={form.credits} onChange={e => update("credits", e.target.value)} className="input-field" />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isElective} onChange={e => update("isElective", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm font-medium text-gray-700">Is Elective</span>
            </label>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={2} value={form.description} onChange={e => update("description", e.target.value)} className="input-field" />
          </div>
        </div>
      )}

      {type === "subject" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
            <input required value={form.code} onChange={e => update("code", e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input required value={form.name} onChange={e => update("name", e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select required value={form.courseId} onChange={e => update("courseId", e.target.value)} className="input-field">
              <option value="">Select Course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={form.type} onChange={e => update("type", e.target.value)} className="input-field">
              <option value="THEORY">Theory</option>
              <option value="PRACTICAL">Practical</option>
              <option value="PROJECT">Project</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
            <input type="number" required min={1} value={form.credits} onChange={e => update("credits", e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Marks</label>
            <input type="number" value={form.maxMarks} onChange={e => update("maxMarks", e.target.value)} className="input-field" />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save"}</button>
      </div>
    </form>
  )
}
