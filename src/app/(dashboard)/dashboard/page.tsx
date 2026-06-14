"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Users, GraduationCap, BookOpen, DollarSign, Bell, Bus,
  Building2, BookMarked, ClipboardCheck, BarChart3, TrendingUp,
  ArrowUpRight, ArrowDownRight
} from "lucide-react"

const statCards = [
  { label: "Total Students", value: "1,247", icon: Users, color: "bg-blue-500", change: "+12%", up: true },
  { label: "Faculty", value: "89", icon: GraduationCap, color: "bg-green-500", change: "+3%", up: true },
  { label: "Programs", value: "24", icon: BookOpen, color: "bg-purple-500", change: null, up: true },
  { label: "Revenue (FY)", value: "₹2.4Cr", icon: DollarSign, color: "bg-yellow-500", change: "+18%", up: true },
  { label: "Attendance", value: "87%", icon: ClipboardCheck, color: "bg-indigo-500", change: "-2%", up: false },
  { label: "Pass Rate", value: "92%", icon: TrendingUp, color: "bg-teal-500", change: "+5%", up: true },
]

const quickLinks = [
  { href: "/dashboard/admissions", label: "Admissions", icon: FileText, desc: "Manage enquiries & applications" },
  { href: "/dashboard/students", label: "Students", icon: Users, desc: "Student profiles & records" },
  { href: "/dashboard/exams", label: "Exams", icon: ClipboardCheck, desc: "Schedule & results" },
  { href: "/dashboard/attendance", label: "Attendance", icon: ClipboardCheck, desc: "Daily attendance tracking" },
  { href: "/dashboard/fees", label: "Fees", icon: DollarSign, desc: "Payments & collections" },
  { href: "/dashboard/communication", label: "Notice", icon: Bell, desc: "Send announcements" },
]

import { FileText } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
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

      {/* Quick Links */}
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

      {/* Recent Activity & Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h4 className="font-semibold text-gray-800 mb-3">Recent Enquiries</h4>
          <div className="space-y-3">
            {[
              { name: "Amit Singh", course: "B.Tech CS", status: "New" },
              { name: "Priya Sharma", course: "BCA", status: "Contacted" },
              { name: "Rohit Verma", course: "MBA", status: "Converted" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-700">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.course}</p>
                </div>
                <span className={`badge ${
                  item.status === "New" ? "badge-info" :
                  item.status === "Contacted" ? "badge-warning" : "badge-success"
                }`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h4 className="font-semibold text-gray-800 mb-3">Upcoming Events</h4>
          <div className="space-y-3">
            {[
              { event: "Mid Term Exams", date: "Sep 15, 2025" },
              { event: "Sports Day", date: "Oct 5, 2025" },
              { event: "Parent-Teacher Meet", date: "Oct 20, 2025" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <p className="text-sm font-medium text-gray-700">{item.event}</p>
                <span className="text-xs text-gray-500">{item.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
