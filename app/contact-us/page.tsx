'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { 
  Bell, Compass, ShoppingBag, MessageSquare, User, LayoutDashboard,
  HelpCircle, LogOut, ShieldCheck, Mail, Phone, MapPin, Send, Home, Sparkles
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function ContactUsPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [user, setUser] = useState<any>(null)
  
  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  
  const [sending, setSending] = useState(false)

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
        if (userData) {
          setContactData(prev => ({
            ...prev,
            name: userData.full_name,
            email: userData.email
          }))
        }
      }
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setTimeout(() => {
      alert('Terima kasih telah menghubungi kami! Tim resepsionis kami akan segera membalas pertanyaan Anda.')
      setContactData(prev => ({ ...prev, subject: '', message: '' }))
      setSending(false)
    }, 1500)
  }

  return (
    <div className="flex min-h-screen bg-gray-50/50 font-sans text-gray-800 antialiased">
      {/* LEFT SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-6 shrink-0 justify-between">
        <div className="space-y-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image src="/Zzz.svg" alt="ZZZ Hotel Logo" width={40} height={40} className="object-contain" priority />
            <span className="text-xl font-bold text-gray-900 tracking-tight">ZZZ HOTEL</span>
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
            <Link href="/contact-us" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-500 bg-rose-50/60 rounded-xl transition-all duration-200">
              <MessageSquare className="w-5 h-5 text-rose-500" />
              <span>Hubungi Kami</span>
            </Link>
            <Link href="/about" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200">
              <User className="w-5 h-5" />
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
        
        {/* CENTER COLUMN: Contact Form */}
        <main className="flex-1 overflow-y-auto px-6 py-8 space-y-8 max-w-5xl">
          {/* Header Greeting */}
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="animate-fade-in">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Hubungi Kami</h1>
              <p className="text-sm text-gray-500 mt-1">Hubungi kami. Kami dengan senang hati akan membantu pertanyaan reservasi Anda.</p>
            </div>
            
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-slide-up">
            
            {/* Left Box: Form */}
            <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Kirim Pesan</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Nama Anda</label>
                  <input 
                    type="text" 
                    value={contactData.name}
                    onChange={(e) => setContactData({...contactData, name: e.target.value})}
                    placeholder="Masukkan nama"
                    className="w-full px-3 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:border-rose-500 focus:ring-0 focus:bg-white transition"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Alamat Email</label>
                  <input 
                    type="email" 
                    value={contactData.email}
                    onChange={(e) => setContactData({...contactData, email: e.target.value})}
                    placeholder="Masukkan email"
                    className="w-full px-3 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:border-rose-500 focus:ring-0 focus:bg-white transition"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Subjek</label>
                  <input 
                    type="text" 
                    value={contactData.subject}
                    onChange={(e) => setContactData({...contactData, subject: e.target.value})}
                    placeholder="Judul subjek"
                    className="w-full px-3 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:border-rose-500 focus:ring-0 focus:bg-white transition"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Pesan</label>
                  <textarea 
                    value={contactData.message}
                    onChange={(e) => setContactData({...contactData, message: e.target.value})}
                    placeholder="Tulis detail..."
                    rows={4}
                    className="w-full px-3 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:border-rose-500 focus:ring-0 focus:bg-white transition"
                    required
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={sending}
                  className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-400 text-white font-bold rounded-2xl transition shadow-lg shadow-rose-200 text-sm flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{sending ? 'Mengirim...' : 'Kirim Pesan'}</span>
                </button>
              </form>
            </div>

            {/* Right Box: Contacts Info */}
            <div className="space-y-6">
              
              {/* Maps mock */}
              <div className="relative h-60 rounded-3xl overflow-hidden border border-gray-100 bg-gray-100 shadow-inner">
                <svg className="w-full h-full stroke-gray-300 fill-none" viewBox="0 0 100 50">
                  <path d="M 0,25 Q 25,10 50,25 T 100,25" strokeWidth="2" strokeDasharray="2 2" />
                  <circle cx="50" cy="25" r="4" className="fill-rose-500 stroke-white stroke-2 animate-ping" />
                  <circle cx="50" cy="25" r="3" className="fill-rose-500 stroke-white" />
                </svg>
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 text-xs font-bold rounded-xl shadow-md text-gray-600">
                  Jakarta Pusat, ID
                </div>
              </div>

              {/* Direct Info list */}
              <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 text-sm">Kontak ZZZ Hotel</h3>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-50">
                  <span className="p-2 bg-rose-50 text-rose-500 rounded-lg">
                    <Phone className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-gray-400">Hotline Resepsionis</span>
                    <span className="text-xs font-bold text-gray-700">+62 21 5550 1234</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-50">
                  <span className="p-2 bg-rose-50 text-rose-500 rounded-lg">
                    <Mail className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-gray-400">Email Pertanyaan</span>
                    <span className="text-xs font-bold text-gray-700">support@zzzhotel.com</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-50">
                  <span className="p-2 bg-rose-50 text-rose-500 rounded-lg">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-gray-400">Lokasi Kantor</span>
                    <span className="text-xs font-bold text-gray-700">Jl. Sudirman No. 123, Jakarta Pusat</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>

        {/* RIGHT COLUMN: Help support summary */}
        <aside className="w-full lg:w-96 bg-white border-l border-gray-100 p-6 overflow-y-auto shrink-0 space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-3">Info Dukungan</h3>
          
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-gray-800">Pertanyaan yang Sering Diajukan</h4>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl">
                <h5 className="font-bold text-gray-700 mb-1">Waktu Check-in dan Check-out?</h5>
                <p className="text-gray-500 leading-normal">Waktu Check-in mulai dari jam 14:00 dan Check-out maksimal jam 12:00 siang.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <h5 className="font-bold text-gray-700 mb-1">Apakah layanan tambahan dapat dibatalkan?</h5>
                <p className="text-gray-500 leading-normal">Layanan seperti Pembersihan atau Sarapan Prasmanan dapat dibatalkan hingga 24 jam sebelumnya tanpa biaya.</p>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  )
}
