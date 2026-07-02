'use client'

import { useQuery } from '@tanstack/react-query'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import Image from 'next/image'

export function CmsAbout() {
  const supabase = createBrowserSupabaseClient()

  const { data } = useQuery({
    queryKey: ['cms-about'],
    queryFn: async () => {
      const { data } = await supabase
        .from('cms_sections')
        .select('content')
        .eq('section_name', 'about')
        .eq('is_active', true)
        .single()
      
      return data?.content as any
    }
  })

  if (!data) return null

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-4xl font-bold mb-6">{data.title}</h2>
          <p className="text-lg text-gray-600 mb-8">{data.description}</p>
          <div className="grid grid-cols-2 gap-4">
            {data.stats?.map((stat: any, index: number) => (
              <div key={index} className="bg-rose-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-rose-500">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative h-[400px] rounded-lg overflow-hidden">
          <Image
            src={data.image}
            alt={data.title}
            fill
            className="object-cover"
          />
        </div>
      </div>
    </section>
  )
}