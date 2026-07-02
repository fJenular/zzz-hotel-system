import { Mail, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold mb-4">🏨 ZZZ Hotel</h3>
            <p className="text-gray-400 mb-4">
              Experience luxury and comfort in the heart of the city. Your perfect stay awaits.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition" aria-label="Facebook">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition" aria-label="Instagram">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition" aria-label="Twitter">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-400 hover:text-white transition">Home</Link></li>
              <li><Link href="/#about" className="text-gray-400 hover:text-white transition">About Us</Link></li>
              <li><Link href="/#rooms" className="text-gray-400 hover:text-white transition">Our Rooms</Link></li>
              <li><Link href="/#facilities" className="text-gray-400 hover:text-white transition">Facilities</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              <li><Link href="/booking/select-room" className="text-gray-400 hover:text-white transition">Book a Room</Link></li>
              <li><Link href="/restaurant" className="text-gray-400 hover:text-white transition">Restaurant</Link></li>
              <li><Link href="/spa" className="text-gray-400 hover:text-white transition">Spa & Wellness</Link></li>
              <li><Link href="/events" className="text-gray-400 hover:text-white transition">Events</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-blue-500 mt-1" />
                <span className="text-gray-400">Jl. Sudirman No. 123, Jakarta Pusat</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-500" />
                <span className="text-gray-400">+62 21 1234567</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-500" />
                <span className="text-gray-400">info@zzzhotel.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-center text-gray-400">
          <p>&copy; 2026 ZZZ Hotel. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}