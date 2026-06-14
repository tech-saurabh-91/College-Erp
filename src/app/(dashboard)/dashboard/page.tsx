"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  Users, GraduationCap, BookOpen, DollarSign, Bell, ClipboardCheck,
  BarChart3, TrendingUp, FileText, ArrowUpRight, ArrowDownRight,
  School, BookMarked, Globe, User, Calendar, CreditCard, Award,
  Clock, ChevronRight, ExternalLink, Edit3, Save, X
} from "lucide-react"

interface DashboardData {
  role: string
  stats?: any
  recentEnquiries?: any[]
  student?: any
  attendance?: any
  fee?: any
  recentMarks?: any[]
  faculty?: any
  classSections?: any[]
  todayAttendance?: any
  parent?: any
  children?: any[]
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  )

  if (role === "ADMIN") return <AdminDashboard data={data} />
  if (role === "STUDENT") return <StudentDashboard data={data} />
  if (role === "FACULTY") return <FacultyDashboard data={data} />
  if (role === "PARENT") return <ParentDashboard data={data} />
  return <div className="text-center py-20 text-gray-500">Dashboard not available for this role</div>
}

// ─────────────────────── ADMIN ───────────────────────
function AdminDashboard({ data }: { data: DashboardData | null }) {
  const stats = data?.stats
  const statCards = [
    { label: "Total Students", value: stats?.totalStudents ?? "—", icon: Users, color: "bg-blue-500" },
    { label: "Faculty", value: stats?.totalFaculty ?? "—", icon: GraduationCap, color: "bg-green-500" },
    { label: "Programs", value: stats?.totalPrograms ?? "—", icon: BookOpen, color: "bg-purple-500" },
    { label: "Revenue", value: stats ? `₹${(stats.totalRevenue / 100000).toFixed(1)}L` : "—", icon: DollarSign, color: "bg-yellow-500" },
    { label: "Attendance", value: stats ? `${stats.attendancePercent}%` : "—", icon: ClipboardCheck, color: "bg-indigo-500" },
    { label: "Pass Rate", value: stats ? `${stats.passRate}%` : "—", icon: TrendingUp, color: "bg-teal-500" },
  ]
  const quickLinks = [
    { href: "/dashboard/admissions", label: "Admissions", icon: FileText, desc: "Manage enquiries & applications" },
    { href: "/dashboard/students", label: "Students", icon: Users, desc: "Student profiles & records" },
    { href: "/dashboard/exams", label: "Exams", icon: ClipboardCheck, desc: "Schedule & results" },
    { href: "/dashboard/attendance", label: "Attendance", icon: ClipboardCheck, desc: "Daily attendance tracking" },
    { href: "/dashboard/fees", label: "Fees", icon: DollarSign, desc: "Payments & collections" },
    { href: "/dashboard/communication", label: "Notice", icon: Bell, desc: "Send announcements" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map(s => { const Icon = s.icon; return (
          <div key={s.label} className="stat-card">
            <div className={`p-2 rounded-lg ${s.color}`}><Icon className="w-5 h-5 text-white" /></div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        )})}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map(link => { const Icon = link.icon; return (
            <Link key={link.href} href={link.href} className="card flex items-center gap-4 hover:shadow-md transition-shadow group">
              <div className="p-3 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors"><Icon className="w-6 h-6 text-blue-600" /></div>
              <div><p className="font-medium text-gray-800">{link.label}</p><p className="text-xs text-gray-500">{link.desc}</p></div>
            </Link>
          )})}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h4 className="font-semibold text-gray-800 mb-3">Recent Enquiries</h4>
          <div className="space-y-3">
            {data?.recentEnquiries?.length ? data.recentEnquiries.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div><p className="text-sm font-medium text-gray-700">{item.name}</p><p className="text-xs text-gray-500">{item.courseInterest}</p></div>
                <span className={`badge ${item.status === "NEW" || item.status === "New" ? "badge-info" : item.status === "CONTACTED" || item.status === "Contacted" ? "badge-warning" : "badge-success"}`}>{item.status}</span>
              </div>
            )) : <p className="text-sm text-gray-400 py-4 text-center">No recent enquiries</p>}
          </div>
        </div>
        <div className="card">
          <h4 className="font-semibold text-gray-800 mb-3">Fee Overview</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg"><div><p className="text-sm font-medium text-green-700">Total Collected</p><p className="text-xs text-green-500">From fee accounts</p></div><p className="text-lg font-bold text-green-700">₹{(stats?.totalRevenue ?? 0).toLocaleString()}</p></div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg"><div><p className="text-sm font-medium text-red-700">Total Dues</p><p className="text-xs text-red-500">Pending payments</p></div><p className="text-lg font-bold text-red-700">₹{(stats?.totalDues ?? 0).toLocaleString()}</p></div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"><div><p className="text-sm font-medium text-blue-700">Today's Attendance</p><p className="text-xs text-blue-500">Records marked today</p></div><p className="text-lg font-bold text-blue-700">{stats?.todayAttendance ?? 0}</p></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────── STUDENT ───────────────────────
function StudentDashboard({ data }: { data: DashboardData | null }) {
  const s = data?.student
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    if (s) {
      setForm({
        phone: s.phone || "", address: s.address || "", city: s.city || "",
        state: s.state || "", pincode: s.pincode || "",
      })
    }
  }, [s])

  if (!s) return <div className="text-center py-20 text-gray-500">Student profile not found</div>

  async function saveProfile() {
    try {
      await fetch(`/api/students/${s.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...s, ...form }),
      })
      setEditing(false)
    } catch { alert("Failed to save") }
  }

  const att = data?.attendance
  const fee = data?.fee
  const marks = data?.recentMarks

  return (
    <div className="space-y-6">
      {/* Personal Info Card */}
      <div className="card relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{s.firstName} {s.lastName}</h2>
              <p className="text-sm text-gray-500">{s.rollNo} · {s.program?.name || "-"} · Sem {s.currentSemester}</p>
              <p className="text-xs text-gray-400">{s.email} · {s.phone}</p>
            </div>
          </div>
          <button onClick={() => setEditing(!editing)} className="btn-secondary text-xs flex items-center gap-1">
            <Edit3 size={14} /> {editing ? "Cancel" : "Edit"}
          </button>
        </div>

        {editing && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-3">
              {["phone", "address", "city", "state", "pincode"].map(f => (
                <div key={f}>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5 capitalize">{f}</label>
                  <input value={form[f] || ""} onChange={e => setForm({ ...form, [f]: e.target.value })} className="input-field text-sm" />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setEditing(false)} className="btn-secondary text-xs flex items-center gap-1"><X size={14} /> Cancel</button>
              <button onClick={saveProfile} className="btn-primary text-xs flex items-center gap-1"><Save size={14} /> Save</button>
            </div>
          </div>
        )}
      </div>

      {/* Attendance + Fee + Marks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><Calendar className="w-5 h-5 text-indigo-500" /><span className="text-sm font-medium text-gray-700">This Month Attendance</span></div>
          <p className="text-3xl font-bold text-gray-800">{att?.percentage ?? 0}%</p>
          <p className="text-xs text-gray-500 mt-1">{att?.present ?? 0} Present · {att?.absent ?? 0} Absent · {att?.leave ?? 0} Leave</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><CreditCard className="w-5 h-5 text-green-500" /><span className="text-sm font-medium text-gray-700">Fee Status</span></div>
          {fee ? (
            <>
              <p className="text-3xl font-bold text-green-600">₹{fee.paid.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Due: ₹{fee.due.toLocaleString()} · {fee.status}</p>
            </>
          ) : <p className="text-gray-400 text-sm">No fee data</p>}
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><Award className="w-5 h-5 text-purple-500" /><span className="text-sm font-medium text-gray-700">My Results</span></div>
          <p className="text-3xl font-bold text-gray-800">{marks?.length ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Subjects evaluated</p>
        </div>
      </div>

      {/* Fee Breakdown */}
      {fee?.accounts && fee.accounts.length > 0 && (
        <div className="card">
          <h4 className="font-semibold text-gray-800 mb-3">Fee Accounts</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><th className="table-header">Structure</th><th className="table-header">Total Fee</th><th className="table-header">Paid</th><th className="table-header">Due</th><th className="table-header">Status</th></tr></thead>
              <tbody>
                {fee.accounts.map((a: any) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="table-cell">{a.feeStructure?.name || "-"}</td>
                    <td className="table-cell">₹{a.totalFee?.toLocaleString()}</td>
                    <td className="table-cell text-green-600 font-medium">₹{a.paidAmount?.toLocaleString()}</td>
                    <td className="table-cell text-red-600 font-medium">₹{a.dueAmount?.toLocaleString()}</td>
                    <td className="table-cell"><span className={`badge ${a.status === "PAID" ? "badge-success" : a.status === "PARTIAL" ? "badge-warning" : "badge-danger"}`}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {fee.accounts[0]?.payments?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Recent Payments</h5>
              <div className="space-y-1">
                {fee.accounts[0].payments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between text-xs text-gray-600">
                    <span>{new Date(p.paymentDate).toLocaleDateString()} - {p.method}</span>
                    <span className="font-medium text-green-600">₹{p.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Marks Table */}
      {marks && marks.length > 0 && (
        <div className="card">
          <h4 className="font-semibold text-gray-800 mb-3">Subject-wise Results</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><th className="table-header">Subject</th><th className="table-header">Exam</th><th className="table-header">Marks</th><th className="table-header">Result</th></tr></thead>
              <tbody>
                {marks.map((m: any) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="table-cell">{m.subject?.name || "-"}</td>
                    <td className="table-cell">{m.exam?.schedule?.name || "-"}</td>
                    <td className="table-cell">{m.internalMarks || 0} + {m.externalMarks || 0} = <span className="font-semibold">{(m.internalMarks || 0) + (m.externalMarks || 0)}/{m.totalMarks}</span></td>
                    <td className="table-cell"><span className={`badge ${m.result === "PASS" ? "badge-success" : "badge-danger"}`}>{m.result}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-3">Quick Links</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/dashboard/students", label: "My Profile", icon: User },
            { href: "/dashboard/attendance", label: "Attendance", icon: Calendar },
            { href: "/dashboard/exams", label: "My Results", icon: Award },
            { href: "/dashboard/fees", label: "Fee Details", icon: CreditCard },
          ].map(link => { const Icon = link.icon; return (
            <Link key={link.href} href={link.href} className="card flex items-center gap-3 p-3 hover:shadow-md transition-shadow group">
              <Icon className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">{link.label}</span>
              <ChevronRight size={14} className="ml-auto text-gray-300 group-hover:text-blue-500" />
            </Link>
          )})}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────── FACULTY ───────────────────────
function FacultyDashboard({ data }: { data: DashboardData | null }) {
  const f = data?.faculty
  const sections = data?.classSections
  if (!f) return <div className="text-center py-20 text-gray-500">Faculty profile not found</div>

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{f.firstName} {f.lastName}</h2>
            <p className="text-sm text-gray-500">{f.designation} · {f.department}</p>
            <p className="text-xs text-gray-400">{f.email} · {f.employeeId}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><School className="w-5 h-5 text-blue-500" /><span className="text-sm font-medium text-gray-700">My Classes</span></div>
          <p className="text-3xl font-bold text-gray-800">{sections?.length ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Class sections</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><ClipboardCheck className="w-5 h-5 text-green-500" /><span className="text-sm font-medium text-gray-700">Today's Attendance</span></div>
          <p className="text-3xl font-bold text-gray-800">{data?.todayAttendance ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Records marked today</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><Users className="w-5 h-5 text-purple-500" /><span className="text-sm font-medium text-gray-700">Total Students</span></div>
          <p className="text-3xl font-bold text-gray-800">{sections?.reduce((sum: number, s: any) => sum + (s._count?.students || 0), 0) ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Across all classes</p>
        </div>
      </div>

      {sections && sections.length > 0 && (
        <div className="card">
          <h4 className="font-semibold text-gray-800 mb-3">My Class Sections</h4>
          <div className="space-y-2">
            {sections.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div><p className="text-sm font-medium text-gray-700">{s.name}</p><p className="text-xs text-gray-500">{s.program?.name} · {s._count?.students} students</p></div>
                <Link href="/dashboard/attendance" className="text-xs text-blue-600 hover:underline flex items-center gap-1">Mark Attendance <ExternalLink size={12} /></Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="font-semibold text-gray-800 mb-3">Quick Links</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/dashboard/attendance", label: "Attendance", icon: ClipboardCheck },
            { href: "/dashboard/exams", label: "Exams", icon: Award },
            { href: "/dashboard/students", label: "Students", icon: Users },
            { href: "/dashboard/timetable", label: "Timetable", icon: Calendar },
          ].map(link => { const Icon = link.icon; return (
            <Link key={link.href} href={link.href} className="card flex items-center gap-3 p-3 hover:shadow-md transition-shadow group">
              <Icon className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">{link.label}</span>
              <ChevronRight size={14} className="ml-auto text-gray-300 group-hover:text-green-500" />
            </Link>
          )})}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────── PARENT ───────────────────────
function ParentDashboard({ data }: { data: DashboardData | null }) {
  const p = data?.parent
  const children = data?.children
  if (!p) return <div className="text-center py-20 text-gray-500">Parent profile not found</div>

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
            <Users className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{p.name}</h2>
            <p className="text-sm text-gray-500">{p.relation}</p>
          </div>
        </div>
      </div>

      {children && children.length > 0 ? (
        children.map((child: any) => (
          <div key={child.id} className="card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">{child.firstName} {child.lastName}</h3>
                <p className="text-xs text-gray-500">{child.rollNo} · {child.program} · {child.classSection || "-"}</p>
              </div>
              <Link href={`/dashboard/students`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">View <ExternalLink size={12} /></Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-indigo-50 rounded-lg">
                <p className="text-xs text-indigo-600 font-medium">Attendance (This Month)</p>
                <p className="text-2xl font-bold text-indigo-700">{child.attendance?.percentage ?? 0}%</p>
                <p className="text-xs text-indigo-500">{child.attendance?.present ?? 0}/{child.attendance?.total ?? 0} days</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600 font-medium">Fee Status</p>
                {child.fee ? (
                  <>
                    <p className="text-2xl font-bold text-green-700">₹{child.fee.paid.toLocaleString()}</p>
                    <p className="text-xs text-green-500">Due: ₹{child.fee.due.toLocaleString()}</p>
                  </>
                ) : <p className="text-sm text-gray-400">No data</p>}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-10 text-gray-500">No children linked to your account</div>
      )}

      <div>
        <h4 className="font-semibold text-gray-800 mb-3">Quick Links</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { href: "/dashboard/attendance", label: "Attendance", icon: Calendar },
            { href: "/dashboard/exams", label: "Results", icon: Award },
            { href: "/dashboard/fees", label: "Fees", icon: CreditCard },
          ].map(link => { const Icon = link.icon; return (
            <Link key={link.href} href={link.href} className="card flex items-center gap-3 p-3 hover:shadow-md transition-shadow group">
              <Icon className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">{link.label}</span>
              <ChevronRight size={14} className="ml-auto text-gray-300 group-hover:text-purple-500" />
            </Link>
          )})}
        </div>
      </div>
    </div>
  )
}