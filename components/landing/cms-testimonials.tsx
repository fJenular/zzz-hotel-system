'use client'

import { useQuery } from '@tanstack/react-query'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Star } from 'lucide-react'
import Image from 'next/image'

export function CmsTestimonials() {
  const supabase = createBrowserSupabaseClient()

  const { data } = useQuery({
    queryKey: ['cms-testimonials'],
    queryFn: async () => {
      const { data } = await supabase
        .from('cms_sections')
        .select('content')
        .eq('section_name', 'testimonials')
        .eq('is_active', true)
        .single()
      
      return data?.content as any
    }
  })

  if (!data) return null

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <h2 className="text-4xl font-bold text-center mb-12">{data.title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.items?.map((testimonial: any, index: number) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4">
                <Image
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h4 className="font-semibold">{testimonial.name}</h4>
                <p className="text-sm text-gray-600">{testimonial.role}</p>
              </div>
            </div>
            <div className="flex mb-3">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-gray-700 italic">"{testimonial.comment}"</p>
          </div>
        ))}
      </div>
    </section>
  )
} 