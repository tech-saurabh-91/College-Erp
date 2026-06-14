"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Mail, Lock, AlertCircle, HelpCircle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetSent, setResetSent] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const result = await signIn("credentials", { email, password, redirect: false })
    if (result?.error) {
      setError("Invalid email or password")
      setLoading(false)
    } else {
      router.push("/dashboard")
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail) return
    setResetSent(true)
  }

  if (showForgot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
            <p className="text-sm text-gray-500 mt-1">Enter your email to reset your password</p>
          </div>
          {resetSent ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-700 text-sm">Password reset link sent to <strong>{resetEmail}</strong></p>
                <p className="text-green-600 text-xs mt-1">Contact your administrator if you don&apos;t receive it.</p>
              </div>
              <button onClick={() => { setShowForgot(false); setResetSent(false) }} className="btn-primary w-full py-2.5">
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" className="input-field" value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)} placeholder="your@email.com" required />
              </div>
              <button type="submit" className="btn-primary w-full py-2.5">Send Reset Link</button>
              <button type="button" onClick={() => setShowForgot(false)} className="text-sm text-blue-600 hover:underline w-full text-center">
                Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">E</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">College ERP</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="email" className="input-field pl-9" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="password" className="input-field pl-9" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <button type="button" onClick={() => setShowForgot(true)}
            className="text-sm text-blue-600 hover:underline w-full text-center flex items-center justify-center gap-1">
            <HelpCircle size={14} /> Forgot Password?
          </button>
        </form>
      </div>
    </div>
  )
}
