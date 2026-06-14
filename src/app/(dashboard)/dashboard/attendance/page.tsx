"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import { Check, X, CalendarDays, AlertTriangle, BarChart3, RefreshCw, FileText, Camera, Smartphone, User } from "lucide-react"
import { useSession } from "next-auth/react"

interface ClassSection { id: string; name: string; program?: { name: string }; _count?: { students: number } }
interface Student { id: string; rollNo: string; firstName: string; lastName: string; photoUrl?: string }
interface AttendanceRecord { id: string; studentId: string; status: string; remark?: string; student?: Student }

type ViewType = "daily" | "monthly" | "camera"

export default function AttendancePage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const userId = (session?.user as any)?.id
  const isAdminOrFaculty = role === "ADMIN" || role === "FACULTY"
  const isStudent = role === "STUDENT"
  const isParent = role === "PARENT"

  const [sections, setSections] = useState<ClassSection[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [selSection, setSelSection] = useState("")
  const [selDate, setSelDate] = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusMap, setStatusMap] = useState<Record<string, string>>({})
  const [viewType, setViewType] = useState<ViewType>(isAdminOrFaculty ? "daily" : "monthly")
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString())
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [summary, setSummary] = useState<any>(null)
  const [selStudentReport, setSelStudentReport] = useState("")
  const [studentReport, setStudentReport] = useState<any>(null)
  const [myStudentId, setMyStudentId] = useState("")
  const [childList, setChildList] = useState<Student[]>([])
  const [selChildId, setSelChildId] = useState("")

  useEffect(() => {
    fetch("/api/attendance?type=sections").then(r => r.json()).then(d => setSections(Array.isArray(d) ? d : []))
  }, [])

  // Student: fetch own student ID
  useEffect(() => {
    if (isStudent) {
      fetch("/api/students?search=&program=").then(r => r.json()).then(d => {
        const list = Array.isArray(d) ? d : []
        if (list.length > 0) {
          setMyStudentId(list[0].id)
          setSelStudentReport(list[0].id)
        }
      })
    }
  }, [isStudent])

  // Parent: fetch children
  useEffect(() => {
    if (isParent) {
      fetch("/api/students?search=&program=").then(r => r.json()).then(d => {
        const list = Array.isArray(d) ? d : []
        setChildList(list)
        if (list.length > 0) {
          setSelChildId(list[0].id)
          setSelStudentReport(list[0].id)
        }
      })
    }
  }, [isParent])

  useEffect(() => {
    if (selSection && isAdminOrFaculty) {
      fetch(`/api/attendance?type=students&classSectionId=${selSection}`).then(r => r.json()).then(d => {
        setStudents(Array.isArray(d) ? d : [])
      })
    }
  }, [selSection, isAdminOrFaculty])

  // Auto-fetch report for students/parents
  useEffect(() => {
    if ((isStudent || isParent) && selStudentReport) {
      fetchStudentReport()
    }
  }, [selStudentReport, month, year, isStudent, isParent])

  useEffect(() => {
    if (selSection && viewType === "daily") fetchAttendance()
  }, [selSection, selDate])

  useEffect(() => {
    if (selSection && viewType === "monthly") fetchSummary()
  }, [selSection, month, year, viewType])

  async function fetchAttendance() {
    if (!selSection) return
    setLoading(true)
    try {
      const res = await fetch(`/api/attendance?type=attendance&classSectionId=${selSection}&date=${selDate}`)
      const data = await res.json()
      const recs = Array.isArray(data) ? data : []
      setRecords(recs)
      const map: Record<string, string> = {}
      recs.forEach((r: AttendanceRecord) => { map[r.studentId] = r.status })
      setStatusMap(map)
    } catch { setRecords([]); setStatusMap({}) }
    setLoading(false)
  }

  async function fetchSummary() {
    if (!selSection) return
    setLoading(true)
    try {
      const res = await fetch(`/api/attendance?type=summary&classSectionId=${selSection}&month=${month}&year=${year}`)
      setSummary(await res.json())
    } catch { setSummary(null) }
    setLoading(false)
  }

  function toggleStatus(studentId: string, status: string) {
    setStatusMap({ ...statusMap, [studentId]: statusMap[studentId] === status ? "NONE" : status })
  }

  async function saveAttendance() {
    setSaving(true)
    try {
      const records = students.map(s => ({ studentId: s.id, status: statusMap[s.id] || "NONE" }))
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "attendance", classSectionId: selSection, date: selDate, records, markedBy: "system" }),
      })
      await fetchAttendance()
      alert("Attendance saved")
    } catch { alert("Failed to save") }
    setSaving(false)
  }

  function getStudentStatus(sid: string): string { return statusMap[sid] || "NONE" }

  const presentCount = Object.values(statusMap).filter(s => s === "PRESENT").length
  const absentCount = Object.values(statusMap).filter(s => s === "ABSENT").length
  const leaveCount = Object.values(statusMap).filter(s => s === "LEAVE").length
  const total = students.length
  const pct = total > 0 ? ((presentCount / total) * 100).toFixed(1) : "0"
  const shortage = parseFloat(pct) < 75 && total > 0

  async function fetchStudentReport() {
    if (!selStudentReport) return
    try {
      const res = await fetch(`/api/attendance?type=student-attendance&studentId=${selStudentReport}`)
      setStudentReport(await res.json())
    } catch { setStudentReport(null) }
  }

  function handleCameraMark(studentId: string) {
    toggleStatus(studentId, "PRESENT")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Attendance</h1>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {isAdminOrFaculty && (
            <button onClick={() => setViewType("daily")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${viewType === "daily" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600"}`}>
              <CalendarDays size={15} /> Daily
            </button>
          )}
          <button onClick={() => setViewType("monthly")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${viewType === "monthly" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600"}`}>
            <BarChart3 size={15} /> Monthly
          </button>
          {isAdminOrFaculty && (
            <button onClick={() => setViewType("camera")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${viewType === "camera" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600"}`}>
              <Camera size={15} /> Camera
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        {isAdminOrFaculty && viewType !== "monthly" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Section</label>
            <select value={selSection} onChange={e => setSelSection(e.target.value)} className="input-field">
              <option value="">Select section</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name} {s.program?.name ? `(${s.program.name})` : ""} - {s._count?.students || 0} students</option>)}
            </select>
          </div>
        )}
        {viewType === "daily" && isAdminOrFaculty && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)} className="input-field" />
          </div>
        )}
        {viewType === "monthly" && (
          <>
            {isParent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Child</label>
                <select value={selChildId} onChange={e => { setSelChildId(e.target.value); setSelStudentReport(e.target.value) }} className="input-field">
                  {childList.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.rollNo})</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select value={month} onChange={e => setMonth(e.target.value)} className="input-field">
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleString("default", { month: "long" })}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input type="number" value={year} onChange={e => setYear(e.target.value)} className="input-field w-24" />
            </div>
          </>
        )}
      </div>

      {viewType === "daily" && selSection && isAdminOrFaculty && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="stat-card"><p className="text-sm text-gray-500">Total Students</p><p className="text-2xl font-bold">{total}</p></div>
            <div className="stat-card border-l-4 border-green-500"><p className="text-sm text-gray-500">Present</p><p className="text-2xl font-bold text-green-600">{presentCount}</p></div>
            <div className="stat-card border-l-4 border-red-500"><p className="text-sm text-gray-500">Absent</p><p className="text-2xl font-bold text-red-600">{absentCount}</p></div>
            <div className="stat-card border-l-4 border-yellow-500"><p className="text-sm text-gray-500">On Leave</p><p className="text-2xl font-bold text-yellow-600">{leaveCount}</p></div>
          </div>
          {shortage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm">
              <AlertTriangle size={16} /> Attendance shortage alert: Only {pct}% present today. Minimum 75% required.
            </div>
          )}
          <div className="card p-0 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                <span className={`badge ${parseFloat(pct) >= 75 ? "badge-success" : "badge-danger"}`}>{pct}% attendance</span>
              </p>
              <div className="flex gap-2">
                <button onClick={fetchAttendance} className="btn-secondary text-xs flex items-center gap-1"><RefreshCw size={14} /> Refresh</button>
                <button onClick={saveAttendance} disabled={saving} className="btn-primary text-sm">{saving ? "Saving..." : "Save Attendance"}</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr>
                  <th className="table-header">Roll No</th>
                  <th className="table-header">Student Name</th>
                  <th className="table-header text-center">Present</th>
                  <th className="table-header text-center">Absent</th>
                  <th className="table-header text-center">Leave</th>
                </tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-500">Loading...</td></tr>
                  ) : students.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-500">No students in this section</td></tr>
                  ) : (
                    students.map(s => {
                      const st = getStudentStatus(s.id)
                      return (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="table-cell font-mono text-xs">{s.rollNo}</td>
                          <td className="table-cell font-medium">{s.firstName} {s.lastName}</td>
                          <td className="table-cell text-center">
                            <button onClick={() => toggleStatus(s.id, "PRESENT")}
                              className={`p-2 rounded-full transition-all ${st === "PRESENT" ? "bg-green-100 text-green-600 ring-2 ring-green-500" : "text-gray-300 hover:text-green-500 hover:bg-green-50"}`}>
                              <Check size={20} />
                            </button>
                          </td>
                          <td className="table-cell text-center">
                            <button onClick={() => toggleStatus(s.id, "ABSENT")}
                              className={`p-2 rounded-full transition-all ${st === "ABSENT" ? "bg-red-100 text-red-600 ring-2 ring-red-500" : "text-gray-300 hover:text-red-500 hover:bg-red-50"}`}>
                              <X size={20} />
                            </button>
                          </td>
                          <td className="table-cell text-center">
                            <button onClick={() => toggleStatus(s.id, "LEAVE")}
                              className={`p-2 rounded-full transition-all ${st === "LEAVE" ? "bg-yellow-100 text-yellow-600 ring-2 ring-yellow-500" : "text-gray-300 hover:text-yellow-500 hover:bg-yellow-50"}`}>
                              <FileText size={20} />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {viewType === "monthly" && (isAdminOrFaculty ? selSection : selStudentReport) && (
        <>
          {summary && isAdminOrFaculty && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="stat-card"><p className="text-sm text-gray-500">Total Records</p><p className="text-2xl font-bold">{summary.total}</p></div>
              <div className="stat-card border-l-4 border-green-500"><p className="text-sm text-gray-500">Present</p><p className="text-2xl font-bold text-green-600">{summary.present}</p></div>
              <div className="stat-card border-l-4 border-red-500"><p className="text-sm text-gray-500">Absent</p><p className="text-2xl font-bold text-red-600">{summary.absent}</p></div>
              <div className="stat-card border-l-4 border-yellow-500"><p className="text-sm text-gray-500">Leave</p><p className="text-2xl font-bold text-yellow-600">{summary.leave}</p></div>
              <div className="stat-card"><p className="text-sm text-gray-500">Percentage</p>
                <p className={`text-2xl font-bold ${summary.percentage >= 75 ? "text-green-600" : "text-red-600"}`}>{summary.percentage}%</p>
              </div>
            </div>
          )}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-800 mb-3">
              {isStudent ? "My Attendance" : isParent ? "Child Attendance" : "Student Report"}
            </h3>
            <div className="flex items-end gap-4">
              {isAdminOrFaculty && (
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
                  <select value={selStudentReport} onChange={e => setSelStudentReport(e.target.value)} className="input-field">
                    <option value="">Choose student</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.rollNo})</option>)}
                  </select>
                </div>
              )}
              <button onClick={fetchStudentReport} className="btn-primary text-sm flex items-center gap-1"><FileText size={15} /> View Report</button>
            </div>
            {studentReport && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-4 gap-3">
                  <div className="stat-card p-3"><p className="text-xs text-gray-500">Present</p><p className="text-lg font-bold text-green-600">{studentReport.present}</p></div>
                  <div className="stat-card p-3"><p className="text-xs text-gray-500">Absent</p><p className="text-lg font-bold text-red-600">{studentReport.absent}</p></div>
                  <div className="stat-card p-3"><p className="text-xs text-gray-500">Leave</p><p className="text-lg font-bold text-yellow-600">{studentReport.leave}</p></div>
                  <div className="stat-card p-3"><p className="text-xs text-gray-500">%</p>
                    <p className={`text-lg font-bold ${studentReport.percentage >= 75 ? "text-green-600" : "text-red-600"}`}>{studentReport.percentage}%</p>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead><tr>
                      <th className="table-header">Date</th>
                      <th className="table-header">Status</th>
                    </tr></thead>
                    <tbody>
                      {studentReport.records?.map((r: any) => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="table-cell">{new Date(r.date).toLocaleDateString()}</td>
                          <td className="table-cell"><span className={`badge ${r.status === "PRESENT" ? "badge-success" : r.status === "ABSENT" ? "badge-danger" : "badge-warning"}`}>{r.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {viewType === "camera" && selSection && isAdminOrFaculty && (
        <CameraAttendance students={students} statusMap={statusMap} onMark={handleCameraMark} />
      )}
    </div>
  )
}

function CameraAttendance({ students, statusMap, onMark }: {
  students: Student[]; statusMap: Record<string, string>; onMark: (studentId: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)
  const [blinkDetected, setBlinkDetected] = useState(false)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [selStudentId, setSelStudentId] = useState("")
  const [message, setMessage] = useState("")
  const intervalRef = useRef<any>(null)

  useEffect(() => {
    loadModels()
    return () => stopCamera()
  }, [])

  async function loadModels() {
    try {
      const faceapi = (await import("face-api.js")).default
      await faceapi.nets.tinyFaceDetector.loadFromUri("https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.0/model/")
      await faceapi.nets.faceLandmark68Net.loadFromUri("https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.0/model/")
      setModelsLoaded(true)
    } catch {
      setMessage("Face detection models failed to load. Camera mode unavailable.")
    }
  }

  async function startCamera() {
    if (!modelsLoaded) return
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } })
      setStream(s)
      setCameraActive(true)
      setMessage("Look at the camera and blink to mark attendance")
      if (videoRef.current) {
        videoRef.current.srcObject = s
        await videoRef.current.play()
        startDetection()
      }
    } catch {
      setMessage("Camera access denied. Use manual attendance instead.")
    }
  }

  function stopCamera() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null) }
    setCameraActive(false)
    setFaceDetected(false)
    setBlinkDetected(false)
  }

  async function startDetection() {
    const faceapi = (await import("face-api.js")).default
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return
      const detections = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks()

      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }

      if (detections) {
        setFaceDetected(true)
        const landmarks = detections.landmarks
        if (ctx && canvasRef.current) {
          const box = detections.detection.box
          ctx.strokeStyle = "#22c55e"
          ctx.lineWidth = 3
          ctx.strokeRect(box.x, box.y, box.width, box.height)
          ctx.font = "14px sans-serif"
          ctx.fillStyle = "#22c55e"
          ctx.fillText("Face Detected", box.x, box.y - 8)
        }

        const leftEye = landmarks.getLeftEye()
        const rightEye = landmarks.getRightEye()
        const leftEAR = getEAR(leftEye)
        const rightEAR = getEAR(rightEye)
        const avgEAR = (leftEAR + rightEAR) / 2

        if (avgEAR < 0.2) {
          setBlinkDetected(true)
          setMessage("Blink detected! ✓ You can mark attendance now.")
          if (ctx && canvasRef.current) {
            ctx.fillStyle = "#22c55e"
            ctx.font = "16px sans-serif"
            ctx.fillText("✓ Liveness Confirmed", 10, 30)
          }
          if (intervalRef.current) clearInterval(intervalRef.current)
        } else {
          setMessage("Please blink to confirm you're a real person")
        }
      } else {
        setFaceDetected(false)
        setMessage("No face detected. Look at the camera.")
      }
    }, 300)
  }

  function getEAR(eye: any[]): number {
    if (eye.length < 6) return 1
    const a = Math.sqrt((eye[1].x - eye[5].x) ** 2 + (eye[1].y - eye[5].y) ** 2)
    const b = Math.sqrt((eye[2].x - eye[4].x) ** 2 + (eye[2].y - eye[4].y) ** 2)
    const c = Math.sqrt((eye[0].x - eye[3].x) ** 2 + (eye[0].y - eye[3].y) ** 2)
    return (a + b) / (2 * c)
  }

  function markAttendance() {
    if (!selStudentId) { setMessage("Select a student first"); return }
    if (!blinkDetected) { setMessage("Please complete the liveness check (blink) first"); return }
    onMark(selStudentId)
    setMessage("Attendance marked as Present! ✓")
    setBlinkDetected(false)
    setTimeout(() => {
      startDetection()
    }, 1000)
  }

  const selectedStudent = students.find(s => s.id === selStudentId)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card p-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <Camera size={18} /> Face Recognition
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
            <select value={selStudentId} onChange={e => { setSelStudentId(e.target.value); setBlinkDetected(false) }} className="input-field">
              <option value="">Choose student</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.rollNo}){statusMap[s.id] === "PRESENT" ? " ✓" : ""}</option>)}
            </select>
          </div>

          {!modelsLoaded ? (
            <div className="text-center py-8 text-gray-500">Loading face detection models...</div>
          ) : !cameraActive ? (
            <button onClick={startCamera} className="btn-primary w-full flex items-center justify-center gap-2">
              <Camera size={18} /> Start Camera
            </button>
          ) : (
            <>
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: 360 }}>
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" width={640} height={480} />
              </div>

              {message && (
                <div className={`text-sm p-3 rounded-lg ${
                  message.includes("✓") ? "bg-green-50 text-green-700" :
                  message.includes("denied") ? "bg-red-50 text-red-700" :
                  "bg-blue-50 text-blue-700"
                }`}>
                  {message}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={markAttendance}
                  disabled={!blinkDetected || !selStudentId}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                  <Check size={18} /> Mark Present
                </button>
                <button onClick={stopCamera} className="btn-secondary">Stop Camera</button>
              </div>
            </>
          )}

          <div className="border-t border-gray-100 pt-3 mt-3">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Smartphone size={12} /> Liveness: blink your eyes when prompted. Camera data stays on your device.
            </p>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Today's Status</h3>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead><tr>
              <th className="table-header">Student</th>
              <th className="table-header text-center">Status</th>
            </tr></thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="table-cell">{s.firstName} {s.lastName}</td>
                  <td className="table-cell text-center">
                    {statusMap[s.id] === "PRESENT" ? (
                      <span className="badge badge-success">Present</span>
                    ) : statusMap[s.id] === "ABSENT" ? (
                      <span className="badge badge-danger">Absent</span>
                    ) : statusMap[s.id] === "LEAVE" ? (
                      <span className="badge badge-warning">Leave</span>
                    ) : (
                      <span className="badge badge-default">--</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
