'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { Menu, X, User, LogOut, Calendar, Settings } from 'lucide-react'
import Link from 'next/link'

export function Header() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)

      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('avatar_url')
          .eq('id', authUser.id)
          .single()

        if (userData?.avatar_url) {
          setAvatarUrl(userData.avatar_url)
        }
      }
    }
    getUser()
  }, [supabase])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setAvatarUrl(null)
    setIsDropdownOpen(false)
    router.push('/')
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-rose-500">
            🏨 ZZZ Hotel
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-700 hover:text-rose-500 transition">Home</Link>
            <Link href="/booking/select-room" className="text-gray-700 hover:text-rose-500 transition">Discover</Link>
            <Link href="/facilities" className="text-gray-700 hover:text-rose-500 transition">Facilities</Link>
            <Link href="/contact-us" className="text-gray-700 hover:text-rose-500 transition">Contact Us</Link>
            <Link href="/about" className="text-gray-700 hover:text-rose-500 transition">About</Link>
            
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 hover:opacity-80 transition"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-rose-100 flex items-center justify-center border-2 border-rose-200">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-rose-500" />
                    )}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      href="/my-bookings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Calendar className="w-4 h-4" />
                      My Bookings
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Profile
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => router.push('/login')}>
                  <User className="w-4 h-4 mr-2" />
                  Login
                </Button>
                <Button onClick={() => router.push('/register')}>
                  Register
                </Button>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-4">
              <Link href="/" className="text-gray-700 hover:text-rose-500 transition">Home</Link>
              <Link href="/booking/select-room" className="text-gray-700 hover:text-rose-500 transition">Discover</Link>
              <Link href="/facilities" className="text-gray-700 hover:text-rose-500 transition">Facilities</Link>
              <Link href="/contact-us" className="text-gray-700 hover:text-rose-500 transition">Contact Us</Link>
              <Link href="/about" className="text-gray-700 hover:text-rose-500 transition">About</Link>
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-2 py-2 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-rose-100 flex items-center justify-center">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-rose-500" />
                      )}
                    </div>
                    <span className="text-sm text-gray-600 truncate">{user.email}</span>
                  </div>
                  <Link 
                    href="/my-bookings" 
                    className="flex items-center gap-2 text-gray-700 hover:text-rose-500 transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Calendar className="w-4 h-4" />
                    My Bookings
                  </Link>
                  <Link 
                    href="/profile" 
                    className="flex items-center gap-2 text-gray-700 hover:text-rose-500 transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Profile
                  </Link>
                  <Button variant="outline" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => router.push('/login')}>
                    <User className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                  <Button onClick={() => router.push('/register')}>
                    Register
                  </Button>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}