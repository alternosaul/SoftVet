import { useMemo, useState } from 'react'
import { CalendarDays, Users, PawPrint, TrendingUp, DollarSign } from 'lucide-react'
import { useAppointmentStore } from '../stores/appointmentStore'
import { useClientStore } from '../stores/clientStore'
import { usePetStore } from '../stores/petStore'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

export default function Dashboard() {
  const { appointments } = useAppointmentStore()
  const { clients } = useClientStore()
  const { pets } = usePetStore()
  const [chartView, setChartView] = useState<'week' | 'month'>('week')

  const today = new Date().toISOString().split('T')[0]
  const todayAppointments = appointments.filter(apt => apt.date === today)

  // Calculate weekly/monthly data for charts
  const chartData = useMemo(() => {
    const now = new Date()
    const result: { period: string; consultations: number; income: number }[] = []

    if (chartView === 'week') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
        const dayApts = appointments.filter(apt => apt.date === dateStr && apt.status !== 'cancelled')
        const income = dayApts.reduce((sum, apt) => sum + (apt.amountPaid ?? 0), 0)
        result.push({
          period: dayName,
          consultations: dayApts.length,
          income
        })
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthStr = d.toLocaleDateString('en-US', { month: 'short' })
        const startDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0)
        const endDate = lastDay.toISOString().split('T')[0]
        const monthApts = appointments.filter(
          apt => apt.date >= startDate && apt.date <= endDate && apt.status !== 'cancelled'
        )
        const income = monthApts.reduce((sum, apt) => sum + (apt.amountPaid ?? 0), 0)
        result.push({
          period: monthStr,
          consultations: monthApts.length,
          income
        })
      }
    }
    return result
  }, [appointments, chartView])

  const totalIncome = appointments
    .filter(apt => apt.status !== 'cancelled')
    .reduce((sum, apt) => sum + (apt.amountPaid ?? 0), 0)
  const totalOwed = appointments
    .filter(apt => apt.status !== 'cancelled')
    .reduce((sum, apt) => sum + Math.max(0, (apt.totalAmount ?? 0) - (apt.amountPaid ?? 0)), 0)

  // Monthly sales (ventas del mes)
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  const monthlySales = appointments
    .filter(apt => apt.date >= monthStart && apt.date <= monthEnd && apt.status !== 'cancelled')
    .reduce((sum, apt) => sum + (apt.amountPaid ?? 0), 0)

  const stats = [
    { label: "Today's Appointments", value: todayAppointments.length, icon: CalendarDays, color: 'bg-blue-500' },
    { label: 'Total Clients', value: clients.length, icon: Users, color: 'bg-teal-500' },
    { label: 'Total Pets', value: pets.length, icon: PawPrint, color: 'bg-orange-500' },
    { label: 'Total Income', value: `$${totalIncome.toFixed(0)}`, icon: DollarSign, color: 'bg-green-500' },
    { label: 'Monthly Sales', value: `$${monthlySales.toFixed(0)}`, icon: DollarSign, color: 'bg-emerald-500' },
    { label: 'Amount Owed', value: `$${totalOwed.toFixed(0)}`, icon: TrendingUp, color: totalOwed > 0 ? 'bg-red-500' : 'bg-gray-500' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here's your clinic overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Consultations & Income</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setChartView('week')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                chartView === 'week' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setChartView('month')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                chartView === 'month' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
        <div className="h-64 min-h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="period" stroke="#6b7280" fontSize={12} />
              <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={12} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === 'income' ? [`$${value.toFixed(2)}`, 'Income'] : [value, 'Consultations']
                }
              />
              <Legend />
              <Bar yAxisId="left" dataKey="consultations" fill="#0d9488" name="Consultations" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Today's Appointments</h2>
        {todayAppointments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No appointments scheduled for today</p>
        ) : (
          <div className="space-y-3">
            {todayAppointments.slice(0, 5).map((apt) => {
              const pet = pets.find(p => p.id === apt.petId)
              const client = clients.find(c => c.id === apt.clientId)
              return (
                <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                      <CalendarDays className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{apt.time}</p>
                      <p className="text-sm text-gray-500">
                        {pet?.name || 'Pet'} - {client ? `${client.firstName} ${client.lastName}` : 'Client'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    apt.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {apt.status}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
