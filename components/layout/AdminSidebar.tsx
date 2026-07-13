'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, DoorOpen, Calendar, CreditCard, 
  Users, Utensils, Award, Home, Compass, User
} from 'lucide-react'
import LogoutButton from './LogoutButton'

type AdminSidebarProps = {
  userName?: string
  userRole?: string
}

export default function AdminSidebar({ userName = 'Administrator', userRole = 'admin' }: AdminSidebarProps) {
  const pathname = usePathname()

  const navCategories = [
    {
      label: 'Situs Utama',
      items: [
        { href: '/', label: 'Halaman Utama', icon: Home },
        { href: '/booking/select-room', label: 'Cari Kamar', icon: Compass },
      ]
    },
    {
      label: 'Admin Inti',
      items: [
        { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/users', label: 'Tamu & Pengguna', icon: Users },
      ]
    },
    {
      label: 'Manajemen Hotel',
      items: [
        { href: '/admin/rooms', label: 'Daftar Kamar', icon: DoorOpen },
        { href: '/admin/room-types', label: 'Tipe Kamar', icon: Award },
        { href: '/admin/bookings', label: 'Pemesanan', icon: Calendar },
        { href: '/admin/payments', label: 'Pembayaran', icon: CreditCard },
      ]
    },
    {
      label: 'Layanan',
      items: [
        { href: '/admin/menus', label: 'Menu Restoran', icon: Utensils },
      ]
    }
  ]

  const isActive = (href: string) => pathname === href

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 p-6 shrink-0 justify-between min-h-screen">
      <div className="space-y-8">
        
        {/* Branding (Mimics 'travl' design in reference image) */}
        <Link href="/admin/dashboard" className="flex items-center gap-3 transition-opacity hover:opacity-90">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-500/20">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 21V9.75A2.25 2.25 0 0017.25 7.5h-10.5A2.25 2.25 0 004.5 9.75V21m3.5-11.25h.008v.008H8V9.75zm.562 0h.008v.008H8.562V9.75zM12 9.75h.008v.008H12V9.75zm.562 0h.008v.008H12.562V9.75zM16.5 9.75h.008v.008H16.5V9.75zm.562 0h.008v.008H17.062V9.75zM15 21v-5.25a2.25 2.25 0 00-2.25-2.25h-1.5A2.25 2.25 0 009 15.75V21" />
            </svg>
          </div>
          <div>
            <span className="text-xl font-black text-slate-800 tracking-tight block leading-tight">zzz-hotel</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">Dashboard Admin</span>
          </div>
        </Link>

        {/* Navigation Categories */}
        <nav className="space-y-6">
          {navCategories.map((category, idx) => (
            <div key={idx} className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 px-3 uppercase tracking-widest">{category.label}</p>
              <div className="space-y-0.5">
                {category.items.map((item) => {
                  const active = isActive(item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-2xl transition-all duration-200 ${
                        active
                          ? 'text-red-600 bg-red-50/50 shadow-sm border border-red-100/20'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      <Icon className={`w-4.5 h-4.5 ${active ? 'text-red-500' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Profile Details & Logout (Pill format similar to reference image card) */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 truncate leading-none">{userName}</p>
            <p className="text-[10px] text-slate-400 font-semibold capitalize mt-1 leading-none">{userRole?.replace('_', ' ')}</p>
          </div>
        </div>
        
        <div className="px-2">
          <LogoutButton />
        </div>
        
        <p className="text-[9px] text-slate-400 font-medium text-center leading-relaxed">
          Dashboard Admin ZZZ Hotel<br />
          © 2026 Hak Cipta Dilindungi Undang-Undang
        </p>
      </div>
    </aside>
  )
}
