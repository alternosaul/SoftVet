// Reports page - Basic reports: inventory, clients, upcoming appointments

import { useMemo } from 'react'
import { Package, Users, CalendarDays, TrendingUp, AlertTriangle } from 'lucide-react'
import { useInventoryStore } from '../stores/inventoryStore'
import { useClientStore } from '../stores/clientStore'
import { useAppointmentStore } from '../stores/appointmentStore'
import { usePetStore } from '../stores/petStore'

export default function Reports() {
  const { items } = useInventoryStore()
  const { clients } = useClientStore()
  const { appointments } = useAppointmentStore()
  const { pets } = usePetStore()

  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const nextWeekStr = nextWeek.toISOString().split('T')[0]

  // Inventory report: low stock, total value
  const inventoryReport = useMemo(() => {
    const lowStock = items.filter(i => (i.quantity ?? 0) < 5)
    const totalValue = items.reduce((sum, i) => sum + (i.quantity ?? 0) * (i.price ?? 0), 0)
    return { lowStock, totalValue, totalItems: items.length }
  }, [items])

  // Client flow: new clients this month
  const clientReport = useMemo(() => {
    const now = new Date()
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const newThisMonth = clients.filter(c => {
      const created = c.createdAt?.split('T')[0] ?? ''
      return created >= monthStart
    })
    return { newThisMonth: newThisMonth.length, total: clients.length }
  }, [clients])

  // Upcoming appointments (next 7 days)
  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter(apt => apt.date >= today && apt.date <= nextWeekStr && apt.status !== 'cancelled')
      .sort((a, b) => {
        const d = a.date.localeCompare(b.date)
        return d !== 0 ? d : a.time.localeCompare(b.time)
      })
      .slice(0, 15)
  }, [appointments, today, nextWeekStr])

  // Appointment type breakdown
  const typeBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    appointments
      .filter(apt => apt.status !== 'cancelled')
      .forEach(apt => {
        counts[apt.type] = (counts[apt.type] ?? 0) + 1
      })
    return Object.entries(counts).map(([type, count]) => ({ type, count }))
  }, [appointments])

  const getClientName = (clientId: number) => {
    const c = clients.find(x => x.id === clientId)
    return c ? `${c.firstName} ${c.lastName}` : `#${clientId}`
  }
  const getPetName = (petId: number) => {
    const p = pets.find(x => x.id === petId)
    return p ? p.name : `#${petId}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>
        <p className="text-gray-500">Resumen de inventario, clientes y citas próximas</p>
      </div>

      {/* Inventory report */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" /> Inventario
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Total productos</p>
            <p className="text-2xl font-bold text-gray-800">{inventoryReport.totalItems}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Valor total inventario</p>
            <p className="text-2xl font-bold text-teal-600">
              ${inventoryReport.totalValue.toFixed(2)}
            </p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg">
            <p className="text-sm text-amber-700 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" /> Stock bajo (&lt;5)
            </p>
            <p className="text-2xl font-bold text-amber-700">{inventoryReport.lowStock.length}</p>
            {inventoryReport.lowStock.length > 0 && (
              <ul className="mt-2 text-sm text-amber-800">
                {inventoryReport.lowStock.slice(0, 3).map(i => (
                  <li key={i.id}>{i.name}: {i.quantity} {i.unit || 'unit'}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Client flow */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" /> Flujo de clientes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-teal-50 rounded-lg">
            <p className="text-sm text-teal-700">Clientes nuevos este mes</p>
            <p className="text-2xl font-bold text-teal-800">{clientReport.newThisMonth}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Total clientes</p>
            <p className="text-2xl font-bold text-gray-800">{clientReport.total}</p>
          </div>
        </div>
      </div>

      {/* Upcoming appointments */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <CalendarDays className="w-5 h-5" /> Citas próximas (7 días)
        </h2>
        {upcomingAppointments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay citas programadas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-500">Fecha</th>
                  <th className="text-left py-2 text-gray-500">Hora</th>
                  <th className="text-left py-2 text-gray-500">Cliente</th>
                  <th className="text-left py-2 text-gray-500">Mascota</th>
                  <th className="text-left py-2 text-gray-500">Tipo</th>
                  <th className="text-left py-2 text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody>
                {upcomingAppointments.map(apt => (
                  <tr key={apt.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2">{apt.date}</td>
                    <td className="py-2">{apt.time}</td>
                    <td className="py-2">{getClientName(apt.clientId)}</td>
                    <td className="py-2">{getPetName(apt.petId)}</td>
                    <td className="py-2 capitalize">{apt.type}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        apt.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Appointment type breakdown */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" /> Citas por tipo
        </h2>
        {typeBreakdown.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Sin datos</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {typeBreakdown.map(({ type, count }) => (
              <div key={type} className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500 capitalize">{type}</p>
                <p className="text-xl font-bold text-gray-800">{count}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
