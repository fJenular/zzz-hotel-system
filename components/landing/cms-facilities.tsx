'use client'

import { useQuery } from '@tanstack/react-query'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Waves, Utensils, Heart, Dumbbell, Wifi, Car, Bell, Users } from 'lucide-react'

const iconMap: any = {
  waves: Waves,
  utensils: Utensils,
  heart: Heart,
  dumbbell: Dumbbell,
  wifi: Wifi,
  car: Car,
  bell: Bell,
  users: Users
}

export function CmsFacilities() {
  const supabase = createBrowserSupabaseClient()

  const { data } = useQuery({
    queryKey: ['cms-facilities'],
    queryFn: async () => {
      const { data } = await supabase
        .from('cms_sections')
        .select('content')
        .eq('section_name', 'facilities')
        .eq('is_active', true)
        .single()
      
      return data?.content as any
    }
  })

  if (!data) return null

  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">{data.title}</h2>
          <p className="text-lg text-gray-600">{data.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.items?.map((item: any, index: number) => {
            const Icon = iconMap[item.icon] || Bell
            return (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-rose-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}