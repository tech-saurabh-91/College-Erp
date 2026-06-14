"use client"
import { GraduationCap, Users, UserCheck, BookOpen, Calendar, CreditCard, Bus, BedDouble, Library, ClipboardList, BarChart3, MessageSquare, FileText, ArrowRight, CheckCircle, Shield, Globe } from "lucide-react"

interface PortalFeature { icon: any; label: string }
interface Portal { title: string; icon: any; color: string; bgColor: string; description: string; features: PortalFeature[]; role: string }

const portals: Portal[] = [
  {
    title: "Student Portal",
    icon: GraduationCap,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    description: "Access your academic journey — courses, grades, attendance, fees, and more.",
    role: "STUDENT",
    features: [
      { icon: BookOpen, label: "View Courses & Syllabus" },
      { icon: Calendar, label: "Timetable & Exams" },
      { icon: ClipboardList, label: "Attendance Records" },
      { icon: BarChart3, label: "Grades & Results" },
      { icon: CreditCard, label: "Fee Payments" },
      { icon: Bus, label: "Transport Pass" },
      { icon: BedDouble, label: "Hostel Details" },
      { icon: Library, label: "Library Books" },
      { icon: MessageSquare, label: "Messages & Notices" },
      { icon: FileText, label: "Upload Documents" },
    ],
  },
  {
    title: "Parent Portal",
    icon: Users,
    color: "text-green-600",
    bgColor: "bg-green-50",
    description: "Stay informed about your child's academic progress and campus activities.",
    role: "PARENT",
    features: [
      { icon: ClipboardList, label: "Attendance Reports" },
      { icon: BarChart3, label: "Academic Performance" },
      { icon: CreditCard, label: "Fee Status & Payments" },
      { icon: Calendar, label: "College Events" },
      { icon: MessageSquare, label: "Communicate with Faculty" },
      { icon: FileText, label: "Student Documents" },
      { icon: BedDouble, label: "Hostel Information" },
      { icon: Bus, label: "Transport Tracking" },
      { icon: MessageSquare, label: "Notifications & Alerts" },
      { icon: Shield, label: "Secure Access" },
    ],
  },
  {
    title: "Faculty Portal",
    icon: UserCheck,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    description: "Manage classes, mark attendance, upload grades, and communicate with students.",
    role: "FACULTY",
    features: [
      { icon: BookOpen, label: "My Courses & Subjects" },
      { icon: Calendar, label: "Class Timetable" },
      { icon: ClipboardList, label: "Mark Attendance" },
      { icon: BarChart3, label: "Upload Grades" },
      { icon: Users, label: "Student List" },
      { icon: MessageSquare, label: "Send Messages" },
      { icon: FileText, label: "Leave Applications" },
      { icon: Calendar, label: "Exam Duty Schedule" },
      { icon: Shield, label: "Profile Management" },
      { icon: Globe, label: "Department Resources" },
    ],
  },
]

export default function PortalsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Portals Overview</h1>
        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Demo / Information</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {portals.map((portal, i) => (
          <div key={i} className="card overflow-hidden">
            <div className={`${portal.bgColor} px-5 py-6 -mx-5 -mt-5 mb-5`}>
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${portal.color} bg-white shadow-sm`}>
                  <portal.icon size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{portal.title}</h2>
                  <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-medium ${portal.color} ${portal.bgColor}`}>
                    Role: {portal.role}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3">{portal.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {portal.features.map((feat, j) => (
                <div key={j} className="flex items-center gap-2 text-sm text-gray-700 p-1.5 rounded-lg hover:bg-gray-50">
                  <feat.icon size={14} className="text-gray-400 shrink-0" />
                  <span className="truncate">{feat.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Login URL: <span className="font-mono text-gray-600">/login?role={portal.role.toLowerCase()}</span></p>
              <button className="w-full btn-primary flex items-center justify-center gap-2 text-sm py-2">
                Go to {portal.title.split(" ")[0]} Login <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100">
        <div className="flex items-start gap-3">
          <Shield size={24} className="text-blue-600 shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-800">Role-Based Access Control</h3>
            <p className="text-sm text-gray-600 mt-1">
              Each portal provides role-specific views and actions. Students see their own data, parents monitor their children,
              and faculty manage their assigned courses. Administrators have cross-portal access for full oversight.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {["Admin: Full Access", "Student: Academic", "Parent: Monitor", "Faculty: Teach & Manage", "Accounts: Finance", "Librarian: Library"].map((r, i) => (
                <span key={i} className="px-3 py-1 bg-white rounded-full text-xs text-gray-600 shadow-sm border border-gray-100">{r}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
