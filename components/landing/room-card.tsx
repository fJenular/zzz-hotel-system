'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'

interface RoomCardProps {
  room: {
    id: string
    room_number: string
    room_types: {
      name: string
      base_price: number
      max_occupancy: number
    }
  }
}

export function RoomCard({ room }: RoomCardProps) {
  const router = useRouter()

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader onClick={() => router.push(`/rooms/${room.id}`)}>
        <CardTitle className="flex justify-between items-center">
          <span>Room {room.room_number}</span>
          <span className="text-sm font-normal text-gray-500">{room.room_types.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent onClick={() => router.push(`/rooms/${room.id}`)}>
        <div className="flex gap-4 text-sm text-gray-600 mb-4">
          <span className="flex items-center gap-1">
            <Users size={16} /> {room.room_types.max_occupancy} Guests
          </span>
        </div>
        <div className="text-2xl font-bold text-rose-500">
          Rp {room.room_types.base_price.toLocaleString()}
          <span className="text-sm text-gray-500 font-normal">/night</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={() => router.push(`/rooms/${room.id}`)}>
          View Details
        </Button>
      </CardFooter>
    </Card>
  )
}