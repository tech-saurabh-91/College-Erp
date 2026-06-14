export const MODULES = [
  { key: "admission", label: "Admissions" },
  { key: "student", label: "Students" },
  { key: "curriculum", label: "Curriculum" },
  { key: "examination", label: "Examinations" },
  { key: "attendance", label: "Attendance" },
  { key: "faculty", label: "Faculty" },
  { key: "fee", label: "Fee Management" },
  { key: "account", label: "Accounts" },
  { key: "library", label: "Library" },
  { key: "hostel", label: "Hostel" },
  { key: "hr", label: "HR & Payroll" },
  { key: "transport", label: "Transport" },
  { key: "communication", label: "Communication" },
  { key: "report", label: "Reports" },
  { key: "alumni", label: "Alumni" },
  { key: "portal", label: "Portals" },
  { key: "timetable", label: "Timetable" },
  { key: "settings", label: "Settings" },
]

export function hasPermission(rolePermissions: any[] | undefined, moduleKey: string, action: "create" | "read" | "update" | "delete"): boolean {
  if (!rolePermissions) return false
  const actionMap: Record<string, string> = {
    create: "canCreate",
    read: "canRead",
    update: "canUpdate",
    delete: "canDelete",
  }
  const field = actionMap[action]
  return rolePermissions.some((rp: any) =>
    rp.permission?.module === moduleKey && rp[field] === true
  )
}

export function usePermissions(session: any) {
  if (!session?.user) return { can: () => false, isAdmin: false }

  const isAdmin = session.user.role === "ADMIN"
  const rolePerms = session.user.permissions || []

  if (isAdmin) {
    return {
      isAdmin: true,
      can: (_module: string, _action: string) => true,
    }
  }

  return {
    isAdmin: false,
    can: (moduleKey: string, action: "create" | "read" | "update" | "delete") =>
      hasPermission(rolePerms, moduleKey, action),
  }
}
