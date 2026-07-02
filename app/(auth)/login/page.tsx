'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Mail, Lock, ArrowLeft, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserSupabaseClient()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const redirectPath = searchParams.get('redirect') || '/'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (error) throw error

      // Get user role
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single()

      // Redirect based on role or query parameter
      if (redirectPath !== '/') {
        router.push(redirectPath)
      } else if (userData?.role === 'admin' || userData?.role === 'super_admin') {
        router.push('/admin/dashboard')
      } else if (userData?.role === 'manager') {
        router.push('/manager/dashboard')
      } else if (userData?.role === 'receptionist') {
        router.push('/receptionist/dashboard')
      } else if (userData?.role === 'rest_staff') {
        router.push('/restaurant/dashboard')
      } else if (userData?.role === 'housekeeping') {
        router.push('/housekeeping/dashboard')
      } else {
        router.push('/dashboard')
      }
    } catch (error: any) {
      alert(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-6 animate-scale-up z-10">
      
      {/* Back Link */}
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-rose-500 transition-colors uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      {/* Card Panel */}
      <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-xl shadow-rose-100/30 space-y-6">
        
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <span className="p-3 bg-rose-500 text-white text-xl rounded-2xl shadow-lg shadow-rose-200 inline-block">
            🏨
          </span>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Login to ZZZ Hotel</h1>
          <p className="text-xs text-gray-400 font-medium">Welcome back! Please enter your details below.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Input */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Email Address</label>
            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl focus-within:border-rose-500 focus-within:bg-white transition-all duration-200">
              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
              <input 
                id="email"
                type="email" 
                placeholder="yourname@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="bg-transparent border-none p-0 text-xs font-semibold text-gray-700 placeholder-gray-400 focus:ring-0 w-full"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Password</label>
            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl focus-within:border-rose-500 focus-within:bg-white transition-all duration-200">
              <Lock className="w-4 h-4 text-gray-400 shrink-0" />
              <input 
                id="password"
                type="password" 
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="bg-transparent border-none p-0 text-xs font-semibold text-gray-700 placeholder-gray-400 focus:ring-0 w-full"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-400 text-white font-bold rounded-2xl transition shadow-lg shadow-rose-200 text-sm flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        {/* Footnotes */}
        <div className="text-center text-xs pt-2 border-t border-gray-50">
          <span className="text-gray-400 font-medium">Don&apos;t have an account? </span>
          <Link href="/register" className="text-rose-500 hover:text-rose-600 font-bold transition">
            Create Account
            </Link>
          </div>

        </div>

        {/* Security badges */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>SSL Secured Authentication</span>
        </div>

      </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50/50 px-4 font-sans text-gray-800 antialiased relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-200/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-200/10 rounded-full blur-3xl pointer-events-none"></div>

      <Suspense fallback={
        <div className="w-full max-w-md bg-white border border-gray-100 p-8 rounded-3xl shadow-xl shadow-rose-100/30 text-center py-16 text-sm font-semibold text-gray-400 animate-pulse">
          Loading login form...
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}