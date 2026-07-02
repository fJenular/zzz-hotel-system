'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { Menu, X, User, LogOut } from 'lucide-react'
import Link from 'next/link'

export function Header() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
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
            <Link href="/contact-us" className="text-gray-700 hover:text-rose-500 transition">contact us</Link>
            <Link href="/about" className="text-gray-700 hover:text-rose-500 transition">About</Link>
            
            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="text-gray-700 hover:text-rose-500 transition">
                  Dashboard
                </Link>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
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
              <Link href="/contact-us" className="text-gray-700 hover:text-rose-500 transition">contact us</Link>
              <Link href="/about" className="text-gray-700 hover:text-rose-500 transition">About</Link>
              {user ? (
                <>
                  <Link href="/dashboard" className="text-gray-700 hover:text-rose-500 transition">Dashboard</Link>
                  <Button variant="outline" onClick={handleLogout}>Logout</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => router.push('/login')}>Login</Button>
                  <Button onClick={() => router.push('/register')}>Register</Button>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}