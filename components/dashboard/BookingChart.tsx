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

  const maxCount = Math.max(...last7Days.map(d => d.count), 4)

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
    <Card className="border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-3xl p-2">
      <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-slate-50/50">
        <div>
          <CardTitle className="text-base font-black text-slate-800 tracking-tight">Reservation Stats</CardTitle>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Booking analytics</p>
        </div>
        {/* Toggle tabs to match reference image */}
        <div className="flex bg-slate-50 p-1 rounded-xl text-[10px] font-bold text-slate-400">
          <button className="px-3 py-1.5 rounded-lg hover:text-slate-800 transition">Daily</button>
          <button className="px-3 py-1.5 rounded-lg hover:text-slate-800 transition">Weekly</button>
          <button className="px-3 py-1.5 rounded-lg bg-red-500 text-white shadow-sm transition">Monthly</button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="w-full h-[200px]">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#dc2626" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#dc2626" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const y = paddingY + ratio * chartHeight
              const val = Math.round(maxCount * (1 - ratio))
              return (
                <g key={index} className="opacity-40">
                  <line 
                    x1={paddingX} 
                    y1={y} 
                    x2={width - paddingX} 
                    y2={y} 
                    stroke="#e2e8f0" 
                    strokeWidth="1" 
                    strokeDasharray="4 4" 
                  />
                  <text 
                    x={paddingX - 10} 
                    y={y + 4} 
                    textAnchor="end" 
                    className="text-[9px] fill-slate-400 font-bold"
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
                stroke="#dc2626" 
                strokeWidth="3.5" 
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
                  r="4" 
                  className="fill-white stroke-red-600 stroke-[3px] hover:r-6 transition-all duration-200 cursor-pointer" 
                />
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="12" 
                  className="fill-transparent hover:fill-red-500/5 cursor-pointer" 
                />
                <title>{`${p.isoDate}: ${p.count} bookings`}</title>
              </g>
            ))}

            {/* X Axis Labels */}
            {points.map((p, i) => (
              <text 
                key={i} 
                x={p.x} 
                y={height - paddingY + 18} 
                textAnchor="middle" 
                className="text-[10px] fill-slate-400 font-bold"
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
