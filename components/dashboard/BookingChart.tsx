import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function BookingChart() {
  const supabase = await createClient()

  // Fetch bookings in the last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: bookings } = await supabase
    .from('bookings')
    .select('created_at, total_price')
    .gte('created_at', sevenDaysAgo.toISOString())

  // Generate last 7 days list
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return {
      dateStr: d.toLocaleDateString(undefined, { weekday: 'short' }),
      isoDate: d.toISOString().split('T')[0],
      count: 0,
    }
  })

  if (bookings) {
    bookings.forEach((b: any) => {
      if (b.created_at) {
        const dateKey = new Date(b.created_at).toISOString().split('T')[0]
        const dayObj = last7Days.find(d => d.isoDate === dateKey)
        if (dayObj) {
          dayObj.count += 1
        }
      }
    })
  }

  const maxCount = Math.max(...last7Days.map(d => d.count), 4) // minimum scale of 4

  // Chart dimensions
  const width = 500
  const height = 200
  const paddingX = 40
  const paddingY = 30
  const chartWidth = width - 2 * paddingX
  const chartHeight = height - 2 * paddingY

  // Calculate SVG coordinates
  const points = last7Days.map((d, i) => {
    const x = paddingX + (i / 6) * chartWidth
    const y = height - paddingY - (d.count / maxCount) * chartHeight
    return { x, y, ...d }
  })

  // Create path data
  let linePath = ''
  let areaPath = ''

  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
  }

  return (
    <Card className="border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
      <CardHeader className="border-b border-gray-50 pb-4 bg-gradient-to-r from-gray-50/50 to-white">
        <CardTitle className="text-lg font-bold text-gray-800">Bookings (Last 7 Days)</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="w-full h-[220px]">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const y = paddingY + ratio * chartHeight
              const val = Math.round(maxCount * (1 - ratio))
              return (
                <g key={index} className="opacity-20">
                  <line 
                    x1={paddingX} 
                    y1={y} 
                    x2={width - paddingX} 
                    y2={y} 
                    stroke="#9ca3af" 
                    strokeWidth="1" 
                    strokeDasharray="4 4" 
                  />
                  <text 
                    x={paddingX - 10} 
                    y={y + 4} 
                    textAnchor="end" 
                    className="text-[10px] fill-gray-500 font-medium"
                  >
                    {val}
                  </text>
                </g>
              )
            })}

            {/* Area under the line */}
            {areaPath && (
              <path d={areaPath} fill="url(#chartGradient)" className="transition-all duration-500" />
            )}

            {/* The line itself */}
            {linePath && (
              <path 
                d={linePath} 
                fill="none" 
                stroke="#f43f5e" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="transition-all duration-500"
              />
            )}

            {/* Dots */}
            {points.map((p, i) => (
              <g key={i} className="group">
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="5" 
                  className="fill-white stroke-rose-500 stroke-2 hover:r-7 transition-all duration-200 cursor-pointer" 
                />
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="15" 
                  className="fill-transparent hover:fill-rose-500/10 cursor-pointer" 
                />
                <title>{`${p.isoDate}: ${p.count} bookings`}</title>
              </g>
            ))}

            {/* X Axis Labels */}
            {points.map((p, i) => (
              <text 
                key={i} 
                x={p.x} 
                y={height - paddingY + 20} 
                textAnchor="middle" 
                className="text-[11px] fill-gray-500 font-medium"
              >
                {p.dateStr}
              </text>
            ))}
          </svg>
        </div>
      </CardContent>
    </Card>
  )
}
