'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, Compass, LayoutDashboard, DoorOpen, 
  Calendar, CreditCard, Users, Utensils, Award
} from 'lucide-react'
import LogoutButton from './LogoutButton'

type AdminSidebarProps = {
  userName?: string
  userRole?: string
}

export default function AdminSidebar({ userName = 'Administrator', userRole = 'admin' }: AdminSidebarProps) {
  const pathname = usePathname()

  const navItems = [
    {
      label: 'Main Site',
      items: [
        { href: '/', label: 'Home', icon: Home },
        { href: '/booking/select-room', label: 'Discover Rooms', icon: Compass },
      ]
    },
    {
      label: 'Admin Control Panel',
      items: [
        { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/users', label: 'Users CRUD', icon: Users },
      ]
    },
    {
      label: 'Hotel Management',
      items: [
        { href: '/admin/rooms', label: 'Rooms CRUD', icon: DoorOpen },
        { href: '/admin/room-types', label: 'Room Types CRUD', icon: Award },
        { href: '/admin/bookings', label: 'Bookings CRUD', icon: Calendar },
        { href: '/admin/payments', label: 'Payments CRUD', icon: CreditCard },
      ]
    },
    {
      label: 'F&B Management',
      items: [
        { href: '/admin/menus', label: 'Restaurant Menus', icon: Utensils },
      ]
    }
  ]

  const isActive = (href: string) => pathname === href

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-neutral-100 p-6 shrink-0 justify-between min-h-screen">
      <div className="space-y-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 text-xl font-bold text-neutral-900 tracking-tight">
          <span className="p-2 bg-amber-500 text-neutral-950 rounded-xl shadow-md shadow-amber-200/50">🏨</span>
          <span className="font-serif tracking-wider">ZZZ HOTEL</span>
        </Link>

        {/* Navigation Categories */}
        <nav className="space-y-5">
          {navItems.map((category, idx) => (
            <div key={idx} className="space-y-1">
              <p className="text-[10px] font-bold text-neutral-400 px-4 uppercase tracking-widest">{category.label}</p>
              <div className="space-y-0.5">
                {category.items.map((item) => {
                  const active = isActive(item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                        active
                          ? 'text-amber-700 bg-amber-50/70 shadow-sm'
                          : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-amber-600' : 'text-neutral-400'}`} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Profile details & Logout Button */}
      <div className="space-y-4 pt-4 border-t border-neutral-100">
        <p className="text-[10px] font-bold text-neutral-400 px-4 uppercase tracking-widest">Account</p>
        <div className="px-4 py-2.5 bg-neutral-50 border border-neutral-100/50 rounded-xl mb-2">
          <p className="text-xs font-bold text-neutral-800 truncate">{userName}</p>
          <p className="text-[10px] text-neutral-500 capitalize">{userRole?.replace('_', ' ')}</p>
        </div>
        <LogoutButton />
      </div>
    </aside>
  )
}
