import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface KPIWidgetProps {
  title: string
  value: string | number
  icon: string
}

export default function KPIWidget({ title, value, icon }: KPIWidgetProps) {
  return (
    <Card className="overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-gray-50/50 to-white">
        <CardTitle className="text-sm font-semibold tracking-wide text-gray-500 uppercase">{title}</CardTitle>
        <span className="text-2xl p-2 bg-gray-50 rounded-lg">{icon}</span>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="text-2xl font-bold tracking-tight text-gray-900">{value}</div>
      </CardContent>
    </Card>
  )
}
