'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Users } from 'lucide-react'

interface BookingFormProps {
  roomId?: string
}

export function BookingForm({ roomId }: BookingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 2
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const checkIn = new Date(formData.checkIn)
      const checkOut = new Date(formData.checkOut)
      
      if (checkOut <= checkIn) {
        alert('Check-out date must be after check-in date')
        return
      }

      const params = new URLSearchParams({
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        guests: formData.guests.toString(),
        ...(roomId && { roomId })
      })

      router.push(`/booking/confirmation?${params.toString()}`)
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="checkIn" className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Check-in
        </Label>
        <Input
          id="checkIn"
          type="date"
          value={formData.checkIn}
          min={today}
          onChange={(e) => setFormData({...formData, checkIn: e.target.value})}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="checkOut" className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Check-out
        </Label>
        <Input
          id="checkOut"
          type="date"
          value={formData.checkOut}
          min={formData.checkIn || today}
          onChange={(e) => setFormData({...formData, checkOut: e.target.value})}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="guests" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          Guests
        </Label>
        <Input
          id="guests"
          type="number"
          min="1"
          max="10"
          value={formData.guests}
          onChange={(e) => setFormData({...formData, guests: parseInt(e.target.value)})}
          required
          className="mt-1"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Processing...' : 'Book Now'}
      </Button>
    </form>
  )
}