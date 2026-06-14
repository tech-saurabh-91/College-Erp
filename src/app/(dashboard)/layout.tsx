"use client"
import { useSession, signOut } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardList,
  CalendarCheck, ClipboardCheck, DollarSign, BookMarked, Building2,
  UserCog, Bus, Bell, BarChart3, Globe, Smartphone, ChevronLeft,
  ChevronRight, LogOut, Menu, X, School, FileText, CreditCard,
  HelpCircle, Settings
} from "lucide-react"

const navItems = [
  { section: "Main", items: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/manual", label: "User Manual", icon: HelpCircle },
  ]},
  { section: "Academics", items: [
    { href: "/dashboard/admissions", label: "Admissions", icon: FileText },
    { href: "/dashboard/students", label: "Student Info", icon: Users },
    { href: "/dashboard/curriculum", label: "Curriculum", icon: BookOpen },
    { href: "/dashboard/timetable", label: "Timetable", icon: CalendarCheck },
    { href: "/dashboard/exams", label: "Examinations", icon: ClipboardList },
    { href: "/dashboard/attendance", label: "Attendance", icon: ClipboardCheck },
  ]},
  { section: "Management", items: [
    { href: "/dashboard/faculty", label: "Faculty", icon: UserCog },
    { href: "/dashboard/fees", label: "Fee Management", icon: DollarSign },
    { href: "/dashboard/accounts", label: "Accounts", icon: CreditCard },
    { href: "/dashboard/library", label: "Library", icon: BookMarked },
  ]},
  { section: "Infrastructure", items: [
    { href: "/dashboard/hostel", label: "Hostel", icon: Building2 },
    { href: "/dashboard/transport", label: "Transport", icon: Bus },
    { href: "/dashboard/hr", label: "HR & Payroll", icon: UserCog },
  ]},
  { section: "Communication", items: [
    { href: "/dashboard/communication", label: "Communication", icon: Bell },
    { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
    { href: "/dashboard/alumni", label: "Alumni", icon: Globe },
    { href: "/dashboard/portals", label: "Portals", icon: Smartphone },
  ]},
  { section: "Administration", items: [
    { href: "/dashboard/users", label: "User Master", icon: Users },
    { href: "/dashboard/roles", label: "Roles & Permissions", icon: Settings },
  ]},
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  }

  if (!session) return null

  const sessionUser = session.user as any
  const role = sessionUser?.role
  const isAdmin = role === "ADMIN"
  const permissions = sessionUser?.permissions || []

  function hasReadAccess(href: string): boolean {
    if (isAdmin) return true
    const moduleMap: Record<string, string> = {
      "/dashboard": "dashboard",
      "/dashboard/manual": "manual",
      "/dashboard/admissions": "admission",
      "/dashboard/students": "student",
      "/dashboard/curriculum": "curriculum",
      "/dashboard/timetable": "timetable",
      "/dashboard/exams": "examination",
      "/dashboard/attendance": "attendance",
      "/dashboard/faculty": "faculty",
      "/dashboard/fees": "fee",
      "/dashboard/accounts": "account",
      "/dashboard/library": "library",
      "/dashboard/hostel": "hostel",
      "/dashboard/transport": "transport",
      "/dashboard/hr": "hr",
      "/dashboard/communication": "communication",
      "/dashboard/reports": "report",
      "/dashboard/alumni": "alumni",
      "/dashboard/portals": "portal",
      "/dashboard/users": "settings",
      "/dashboard/roles": "settings",
    }
    const moduleKey = moduleMap[href]
    if (!moduleKey) return true
    return permissions.some((p: any) => p.permission?.module === moduleKey && p.canRead === true)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 z-50 h-screen bg-slate-900 text-white transition-all duration-300
        ${collapsed ? "w-16" : "w-64"}
        ${mobileOpen ? "left-0" : "-left-64 lg:left-0"}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <School className="w-7 h-7 text-blue-400" />
              <span className="font-bold text-sm">College ERP</span>
            </div>
          )}
          <button onClick={() => { setCollapsed(!collapsed); setMobileOpen(false) }}
            className="p-1.5 hover:bg-slate-700 rounded-lg hidden lg:block">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button onClick={() => setMobileOpen(false)} className="p-1.5 hover:bg-slate-700 rounded-lg lg:hidden">
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1" style={{ height: "calc(100vh - 64px)" }}>
          {navItems.map((group) => {
            const visibleItems = group.items.filter(i => hasReadAccess(i.href))
            if (visibleItems.length === 0) return null
            return (
              <div key={group.section}>
                {!collapsed && (
                  <p className="px-3 pt-4 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {group.section}
                  </p>
                )}
                {visibleItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`sidebar-link ${isActive ? "active" : ""}`}
                      title={collapsed ? item.label : undefined}
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon size={18} />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg lg:hidden">
                <Menu size={20} />
              </button>
              <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">
                {navItems.flatMap(g => g.items).find(i => i.href === pathname)?.label || "Dashboard"}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                {role}
              </span>
              <span className="text-sm text-gray-600 hidden sm:block">{session.user?.name}</span>
              <button onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
