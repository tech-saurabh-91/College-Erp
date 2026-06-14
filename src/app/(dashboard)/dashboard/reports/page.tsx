"use client"
import { useEffect, useState } from "react"
import { Download, Users, TrendingUp, DollarSign, Award, BarChart3, BookOpen, CheckCircle, XCircle, Clock, Calendar } from "lucide-react"

interface Stats {
  totalStudents: number; totalFaculty: number; totalPrograms: number
  enrollmentThisYear: number; avgAttendance: number; feeCollection: number; passRate: number
  totalFeeCollected: number; totalFeeExpected: number
}

interface EnrollmentData { program: string; count: number }
interface AttendanceData { month: string; rate: number }
interface FeeData { month: string; collected: number; expected: number }
interface ExamData { program: string; passRate: number; total: number; passed: number }

export default function ReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData[]>([])
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([])
  const [feeData, setFeeData] = useState<FeeData[]>([])
  const [examData, setExamData] = useState<ExamData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      try {
        const [s, e, a, f, ex] = await Promise.all([
          fetch("/api/reports?type=stats").then(r => r.json()),
          fetch("/api/reports?type=enrollment").then(r => r.json()),
          fetch("/api/reports?type=attendance").then(r => r.json()),
          fetch("/api/reports?type=fees").then(r => r.json()),
          fetch("/api/reports?type=exams").then(r => r.json()),
        ])
        setStats(s)
        setEnrollmentData(e)
        setAttendanceData(a)
        setFeeData(f)
        setExamData(ex)
      } catch { }
      setLoading(false)
    }
    fetchAll()
  }, [])

  function handleDownload(report: string) {
    alert(`Downloading ${report} report... (placeholder)`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
        <div className="text-xs text-gray-500 bg-blue-50 text-blue-700 px-3 py-1 rounded-full">Admin: Full Access • Others: Limited</div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading reports...</div>
      ) : (
        <>
          {stats && <StatsCards stats={stats} />}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2"><BookOpen size={16} className="text-blue-500" /> Enrollment by Program</h2>
                <button onClick={() => handleDownload("Enrollment")} className="btn-secondary text-xs flex items-center gap-1"><Download size={12} /> Download</button>
              </div>
              <div className="space-y-3">
                {enrollmentData.map((d, i) => {
                  const max = Math.max(...enrollmentData.map(x => x.count), 1)
                  const pct = (d.count / max) * 100
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium">{d.program}</span>
                        <span className="text-gray-500">{d.count} students</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div className="h-3 rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
                {enrollmentData.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No data</p>}
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2"><TrendingUp size={16} className="text-green-500" /> Attendance Trend</h2>
                <button onClick={() => handleDownload("Attendance")} className="btn-secondary text-xs flex items-center gap-1"><Download size={12} /> Download</button>
              </div>
              <div className="space-y-3">
                {attendanceData.map((d, i) => {
                  const color = d.rate >= 85 ? "bg-green-500" : d.rate >= 75 ? "bg-yellow-500" : "bg-red-500"
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700">{d.month}</span>
                        <span className={`font-semibold ${d.rate >= 85 ? "text-green-600" : d.rate >= 75 ? "text-yellow-600" : "text-red-600"}`}>{d.rate}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div className={`h-3 rounded-full ${color} transition-all`} style={{ width: `${d.rate}%` }} />
                      </div>
                    </div>
                  )
                })}
                {attendanceData.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No data</p>}
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2"><DollarSign size={16} className="text-purple-500" /> Fee Collection</h2>
                <button onClick={() => handleDownload("Fees")} className="btn-secondary text-xs flex items-center gap-1"><Download size={12} /> Download</button>
              </div>
              <div className="space-y-3">
                {feeData.map((d, i) => {
                  const max = Math.max(...feeData.map(x => x.expected), 1)
                  const collectedPct = (d.collected / max) * 100
                  const expectedPct = (d.expected / max) * 100
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium">{d.month}</span>
                        <span className="text-gray-500">₹{d.collected.toLocaleString()} / ₹{d.expected.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-4 relative">
                        <div className="h-4 rounded-full bg-purple-300 transition-all absolute" style={{ width: `${expectedPct}%` }} />
                        <div className="h-4 rounded-full bg-purple-600 transition-all absolute" style={{ width: `${collectedPct}%` }} />
                      </div>
                    </div>
                  )
                })}
                {feeData.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No data</p>}
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Award size={16} className="text-orange-500" /> Exam Pass Rate</h2>
                <button onClick={() => handleDownload("Exams")} className="btn-secondary text-xs flex items-center gap-1"><Download size={12} /> Download</button>
              </div>
              <div className="space-y-3">
                {examData.map((d, i) => {
                  const pct = d.total > 0 ? (d.passed / d.total) * 100 : 0
                  const color = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : "bg-red-500"
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium">{d.program}</span>
                        <span className="text-gray-500">{d.passed}/{d.total} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div className={`h-3 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
                {examData.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No data</p>}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2"><BarChart3 size={16} className="text-gray-500" /> Download Reports</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {["Student Report", "Fee Report", "Attendance Report", "Exam Report", "Faculty Report", "Transport Report", "Hostel Report", "Library Report"].map(r => (
                <button key={r} onClick={() => handleDownload(r)} className="btn-secondary flex items-center justify-center gap-2 text-sm"><Download size={14} /> {r}</button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function StatsCards({ stats }: { stats: Stats }) {
  const cards = [
    { label: "Total Students", value: stats.totalStudents.toLocaleString(), icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Total Faculty", value: stats.totalFaculty.toLocaleString(), icon: Users, color: "text-green-600", bg: "bg-green-100" },
    { label: "Enrollment (This Year)", value: stats.enrollmentThisYear.toLocaleString(), icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100" },
    { label: "Avg Attendance", value: `${stats.avgAttendance}%`, icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
    { label: "Fee Collection", value: `${stats.feeCollection}%`, icon: DollarSign, color: "text-yellow-600", bg: "bg-yellow-100" },
    { label: "Pass Rate", value: `${stats.passRate}%`, icon: Award, color: "text-orange-600", bg: "bg-orange-100" },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((c, i) => (
        <div key={i} className="stat-card">
          <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center mb-2`}>
            <c.icon size={20} className={c.color} />
          </div>
          <p className="text-2xl font-bold text-gray-800">{c.value}</p>
          <p className="text-xs text-gray-500">{c.label}</p>
        </div>
      ))}
    </div>
  )
}
