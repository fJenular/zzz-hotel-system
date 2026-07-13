'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  Bell, Compass, ShoppingBag, MessageSquare, User, LayoutDashboard,
  HelpCircle, LogOut, ShieldCheck, Sparkles, Star, Award, Shield, Users, Home
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function AboutPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single()
        setUser(userData)
      }
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  return (
    <div className="flex min-h-screen bg-gray-50/50 font-sans text-gray-800 antialiased">
      {/* LEFT SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-6 shrink-0 justify-between">
        <div className="space-y-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 text-xl font-bold text-gray-900 tracking-tight">
            <span className="p-2 bg-rose-500 text-white rounded-xl shadow-md shadow-rose-200">🏨</span>
            <span>ZZZ HOTEL</span>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <Home className="w-5 h-5" />
              <span>Beranda</span>
            </Link>
            <Link href="/booking/select-room" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <Compass className="w-5 h-5" />
              <span>Cari Kamar</span>
            </Link>
            <Link href="/facilities" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <Sparkles className="w-5 h-5" />
              <span>Fasilitas</span>
            </Link>
            <Link href="/contact-us" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <MessageSquare className="w-5 h-5" />
              <span>Hubungi Kami</span>
            </Link>
            <Link href="/about" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-500 bg-rose-50/60 rounded-xl transition-all duration-200">
              <User className="w-5 h-5 text-rose-500" />
              <span>Tentang Kami</span>
            </Link>
          </nav>
        </div>

        <div className="space-y-4">
          <hr className="border-gray-100" />
          <p className="text-xs font-semibold text-gray-400 px-4 uppercase tracking-wider">Lainnya</p>
          <nav className="space-y-1">
            {user && user.role !== 'guest' && (
              <Link 
                href={
                  user.role === 'admin' || user.role === 'super_admin' ? '/admin/dashboard' :
                  user.role === 'manager' ? '/manager/dashboard' :
                  user.role === 'receptionist' ? '/receptionist/dashboard' :
                  user.role === 'rest_staff' ? '/restaurant/dashboard' :
                  user.role === 'housekeeping' ? '/housekeeping/dashboard' : '/dashboard'
                }
                className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-600 bg-rose-50/50 rounded-xl transition-all duration-200"
              >
                <LayoutDashboard className="w-5 h-5 text-rose-500" />
                <span>Staff Panel</span>
              </Link>
            )}
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <HelpCircle className="w-5 h-5" />
              <span>Bantuan & Dukungan</span>
            </Link>
            {user ? (
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span>Keluar</span>
              </button>
            ) : (
              <Link href="/login" className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
                <User className="w-5 h-5" />
                <span>Masuk</span>
              </Link>
            )}
          </nav>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col lg:flex-row min-w-0">
        
        {/* CENTER COLUMN: About Us details */}
        <main className="flex-1 overflow-y-auto px-6 py-8 space-y-8 max-w-5xl">
          {/* Header Greeting */}
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="animate-fade-in">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Tentang Kami</h1>
              <p className="text-sm text-gray-500 mt-1">Kenali sejarah keramahtamahan, visi, dan tim inti di balik ZZZ Hotel.</p>
            </div>
            
          </div>

          <div className="space-y-6 animate-slide-up">
            {/* Main Narrative Card */}
            <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="px-3.5 py-1.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100">
                    Est. 2020
                  </span>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Filosofi Kami</h2>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    ZZZ Hotel didirikan dengan satu misi sederhana: menyediakan ruang kenyamanan, kemewahan, dan kedamaian yang mendalam. Kami memadukan arsitektur modern dengan keramahtamahan Indonesia yang hangat dan penuh perhatian untuk menciptakan pengalaman yang terasa personal, abadi, dan sangat menenangkan.
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Berlokasi di Sudirman, Jakarta Pusat, kami hadir sebagai tempat perlindungan yang damai di tengah hiruk-pikuk kota metropolitan. 
                  </p>
                </div>
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
                  <Image src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600" alt="Narasi lobi hotel" fill className="object-cover" />
                </div>
              </div>
            </div>

            {/* Core Values grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 border border-gray-100 rounded-3xl shadow-sm space-y-3">
                <div className="p-3 bg-rose-50 text-rose-500 rounded-xl inline-block">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">Kualitas Abadi</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Kami memeriksa dan menyempurnakan setiap aspek kamar, kualitas sprei, dan jadwal pembersihan untuk melampaui harapan Anda.
                </p>
              </div>

              <div className="bg-white p-6 border border-gray-100 rounded-3xl shadow-sm space-y-3">
                <div className="p-3 bg-rose-50 text-rose-500 rounded-xl inline-block">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">Kenyamanan yang Aman</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Nikmati ketenangan pikiran sepenuhnya dengan penjagaan keamanan 24/7, akses kartu kunci, sistem pemesanan yang aman, dan kunci brankas.
                </p>
              </div>

              <div className="bg-white p-6 border border-gray-100 rounded-3xl shadow-sm space-y-3">
                <div className="p-3 bg-rose-50 text-rose-500 rounded-xl inline-block">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">Tamu adalah Prioritas</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Meja resepsionis kami tersedia 24 jam sehari untuk melayani permintaan khusus, binatu, dan reservasi makan.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT COLUMN: Statistics panel */}
        <aside className="w-full lg:w-96 bg-white border-l border-gray-100 p-6 overflow-y-auto shrink-0 space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-3">Metrik Kami</h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-50 text-center space-y-1">
              <span className="block text-3xl font-black text-rose-500">12k+</span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Tamu Bahagia Terlayani</span>
            </div>

            <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-50 text-center space-y-1">
              <span className="block text-3xl font-black text-rose-500">98%</span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Peringkat Ulasan Positif</span>
            </div>

            <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-50 text-center space-y-1">
              <span className="block text-3xl font-black text-rose-500">4</span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Penghargaan Hotel Nasional</span>
            </div>
          </div>
        </aside>

      </div>
    </div>
  )
}
