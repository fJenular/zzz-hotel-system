'use client'

import { useQuery } from '@tanstack/react-query'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Calendar, Users } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CmsHero() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 2
  })

  const supabase = createBrowserSupabaseClient()

  const { data } = useQuery({
    queryKey: ['cms-hero'],
    queryFn: async () => {
      const { data } = await supabase
        .from('cms_sections')
        .select('content')
        .eq('section_name', 'hero')
        .eq('is_active', true)
        .single()
      
      return data?.content as any
    }
  })

  const handleBookNow = (e: React.FormEvent) => {
    e.preventDefault()
    
    const params = new URLSearchParams({
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      guests: formData.guests.toString()
    })

    router.push(`/booking/select-room?${params.toString()}`)
  }

  if (!data) return null

  return (
    <section 
      className="relative min-h-[600px] flex items-center justify-center text-white"
      style={{
        backgroundImage: `url(${data.background_image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">{data.title}</h1>
          <p className="text-xl md:text-2xl max-w-2xl mx-auto">{data.subtitle}</p>
        </div>

        {/* Booking Widget */}
        <form onSubmit={handleBookNow} className="bg-white rounded-lg p-6 max-w-4xl mx-auto shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                <Calendar className="w-5 h-5 inline mr-2" />
                Check-in
              </label>
              <input
                type="date"
                value={formData.checkIn}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData({...formData, checkIn: e.target.value})}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                <Calendar className="w-5 h-5 inline mr-2" />
                Check-out
              </label>
              <input
                type="date"
                value={formData.checkOut}
                min={formData.checkIn || new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData({...formData, checkOut: e.target.value})}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                <Users className="w-5 h-5 inline mr-2" />
                Guests
              </label>
              <select
                value={formData.guests}
                onChange={(e) => setFormData({...formData, guests: parseInt(e.target.value)})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 text-gray-900"
              >
                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                  <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button 
                type="submit"
                className="w-full bg-rose-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-rose-600 transition"
              >
                {data.cta_text || 'Book Now'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  )
}