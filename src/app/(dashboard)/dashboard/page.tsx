"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Users, GraduationCap, BookOpen, DollarSign, Bell, ClipboardCheck,
  BarChart3, TrendingUp, FileText, ArrowUpRight, ArrowDownRight,
  School, BookMarked, Globe
} from "lucide-react"

interface DashboardData {
  stats: {
    totalStudents: number; totalFaculty: number; totalPrograms: number;
    totalCourses: number; todayAttendance: number; attendancePercent: number;
    totalRevenue: number; totalDues: number; passRate: number;
    activeUsers: number; classSections: number; activeAlumni: number;
  }
  recentEnquiries: { id: string; name: string; courseInterest: string; status: string }[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: "Total Students", value: data?.stats.totalStudents ?? "—", icon: Users, color: "bg-blue-500", change: null, up: true },
    { label: "Faculty", value: data?.stats.totalFaculty ?? "—", icon: GraduationCap, color: "bg-green-500", change: null, up: true },
    { label: "Programs", value: data?.stats.totalPrograms ?? "—", icon: BookOpen, color: "bg-purple-500", change: null, up: true },
    { label: "Revenue", value: data ? `₹${(data.stats.totalRevenue / 100000).toFixed(1)}L` : "—", icon: DollarSign, color: "bg-yellow-500", change: null, up: true },
    { label: "Attendance", value: data ? `${data.stats.attendancePercent}%` : "—", icon: ClipboardCheck, color: "bg-indigo-500", change: null, up: true },
    { label: "Pass Rate", value: data ? `${data.stats.passRate}%` : "—", icon: TrendingUp, color: "bg-teal-500", change: null, up: true },
  ]

  const quickLinks = [
    { href: "/dashboard/admissions", label: "Admissions", icon: FileText, desc: "Manage enquiries & applications" },
    { href: "/dashboard/students", label: "Students", icon: Users, desc: "Student profiles & records" },
    { href: "/dashboard/exams", label: "Exams", icon: ClipboardCheck, desc: "Schedule & results" },
    { href: "/dashboard/attendance", label: "Attendance", icon: ClipboardCheck, desc: "Daily attendance tracking" },
    { href: "/dashboard/fees", label: "Fees", icon: DollarSign, desc: "Payments & collections" },
    { href: "/dashboard/communication", label: "Notice", icon: Bell, desc: "Send announcements" },
  ]

  const miniStats = [
    { label: "Courses", value: data?.stats.totalCourses ?? "—", icon: BookMarked, color: "text-orange-500" },
    { label: "Class Sections", value: data?.stats.classSections ?? "—", icon: School, color: "text-cyan-500" },
    { label: "Active Users", value: data?.stats.activeUsers ?? "—", icon: Users, color: "text-pink-500" },
    { label: "Alumni", value: data?.stats.activeAlumni ?? "—", icon: Globe, color: "text-emerald-500" },
  ]

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {statCards.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="stat-card">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${stat.color}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    {stat.change && (
                      <span className={`flex items-center gap-0.5 text-xs font-medium ${
                        stat.up ? "text-green-600" : "text-red-600"
                      }`}>
                        {stat.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {stat.change}
                      </span>
                    )}
                  </div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {miniStats.map(s => {
              const Icon = s.icon
              return (
                <div key={s.label} className="card flex items-center gap-3 p-3">
                  <Icon className={`w-5 h-5 ${s.color}`} />
                  <div>
                    <p className="text-lg font-bold text-gray-800">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link key={link.href} href={link.href}
                    className="card flex items-center gap-4 hover:shadow-md transition-shadow group">
                    <div className="p-3 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{link.label}</p>
                      <p className="text-xs text-gray-500">{link.desc}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h4 className="font-semibold text-gray-800 mb-3">Recent Enquiries</h4>
              <div className="space-y-3">
                {data?.recentEnquiries && data.recentEnquiries.length > 0 ? (
                  data.recentEnquiries.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.courseInterest}</p>
                      </div>
                      <span className={`badge ${
                        item.status === "NEW" || item.status === "New" ? "badge-info" :
                        item.status === "CONTACTED" || item.status === "Contacted" ? "badge-warning" : "badge-success"
                      }`}>{item.status}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 py-4 text-center">No recent enquiries</p>
                )}
              </div>
            </div>
            <div className="card">
              <h4 className="font-semibold text-gray-800 mb-3">Fee Overview</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-green-700">Total Collected</p>
                    <p className="text-xs text-green-500">From fee accounts</p>
                  </div>
                  <p className="text-lg font-bold text-green-700">₹{(data?.stats.totalRevenue ?? 0).toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-red-700">Total Dues</p>
                    <p className="text-xs text-red-500">Pending payments</p>
                  </div>
                  <p className="text-lg font-bold text-red-700">₹{(data?.stats.totalDues ?? 0).toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Today&apos;s Attendance</p>
                    <p className="text-xs text-blue-500">Records marked today</p>
                  </div>
                  <p className="text-lg font-bold text-blue-700">{data?.stats.todayAttendance ?? 0}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
