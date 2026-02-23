import { useState, useEffect } from 'react'
import { Plus, Search, Eye } from 'lucide-react'
import { useAppointmentStore } from '../stores/appointmentStore'
import { useClientStore } from '../stores/clientStore'
import { usePetStore } from '../stores/petStore'
import { useInventoryStore } from '../stores/inventoryStore'
import AppointmentForm from '../components/forms/AppointmentForm'
import AppointmentDetail from '../components/forms/AppointmentDetail'
import {
  getMedicalRecordsByAppointment,
  getSaleItemsByAppointment,
  getAppointmentAttachments,
  addMedicalRecord,
  addSaleItem,
  uploadAppointmentAttachment,
  deleteAppointmentAttachment
} from '../db/supabase'
import type { Appointment } from '../db/types'
import type { AppointmentFormData } from '../components/forms/AppointmentForm'

export default function Appointments() {
  const { appointments, addAppointment, updateAppointment, fetchAppointments } = useAppointmentStore()
  const { clients } = useClientStore()
  const { pets } = usePetStore()
  const { items: inventoryItems } = useInventoryStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null)
  const [viewMedicalRecord, setViewMedicalRecord] = useState<Awaited<ReturnType<typeof getMedicalRecordsByAppointment>>[0] | null>(null)
  const [viewSaleItems, setViewSaleItems] = useState<Awaited<ReturnType<typeof getSaleItemsByAppointment>>>([])
  const [viewAttachments, setViewAttachments] = useState<Awaited<ReturnType<typeof getAppointmentAttachments>>>([])

  // Load medical record, sale items, attachments when viewing appointment
  useEffect(() => {
    if (!viewingAppointment?.id) {
      setViewMedicalRecord(null)
      setViewSaleItems([])
      setViewAttachments([])
      return
    }
    getMedicalRecordsByAppointment(viewingAppointment.id).then(recs => setViewMedicalRecord(recs[0] ?? null))
    getSaleItemsByAppointment(viewingAppointment.id).then(setViewSaleItems)
    getAppointmentAttachments(viewingAppointment.id).then(setViewAttachments)
  }, [viewingAppointment?.id])

  // Helper to get client/pet names by ID
  const getClientName = (clientId: number) => {
    const c = clients.find(x => x.id === clientId)
    return c ? `${c.firstName} ${c.lastName}` : `Client #${clientId}`
  }
  const getPetName = (petId: number) => {
    const p = pets.find(x => x.id === petId)
    return p ? p.name : `Pet #${petId}`
  }

  const handleSubmit = async (data: AppointmentFormData) => {
    const client = clients.find(c => c.id === data.clientId)
    const pet = pets.find(p => p.id === data.petId)
    if (!client || !pet) throw new Error('Client or pet not found')

    const appointmentData = {
      petId: data.petId,
      clientId: data.clientId,
      date: data.date,
      time: data.time,
      duration: data.duration,
      type: data.type,
      status: data.status,
      veterinarian: data.veterinarian,
      notes: data.notes,
      totalAmount: data.totalAmount,
      amountPaid: data.amountPaid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    let appointmentId: number
    if (editingAppointment?.id) {
      await updateAppointment(editingAppointment.id, {
        petId: data.petId,
        clientId: data.clientId,
        date: data.date,
        time: data.time,
        duration: data.duration,
        type: data.type,
        status: data.status,
        veterinarian: data.veterinarian,
        notes: data.notes,
        totalAmount: data.totalAmount,
        amountPaid: data.amountPaid
      }, client, pet)
      appointmentId = editingAppointment.id
    } else {
      appointmentId = await addAppointment(appointmentData, client, pet)
    }

    // Save medical record and sale items only when creating (not editing)
    if (!editingAppointment) {
      const hasMedicalRecord = data.medicalRecord.symptoms || data.medicalRecord.diagnosis ||
        data.medicalRecord.treatment || data.medicalRecord.notes
      if (hasMedicalRecord && appointmentId) {
        await addMedicalRecord({
          appointmentId,
          petId: data.petId,
          symptoms: data.medicalRecord.symptoms,
          diagnosis: data.medicalRecord.diagnosis,
          treatment: data.medicalRecord.treatment,
          notes: data.medicalRecord.notes
        })
      }
      for (const item of data.saleItems) {
        await addSaleItem({
          appointmentId,
          inventoryId: item.inventoryId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })
      }
    }

    setShowForm(false)
    setEditingAppointment(null)
    fetchAppointments()
  }

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = !searchTerm ||
      getClientName(apt.clientId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getPetName(apt.petId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || apt.status === filterStatus
    const matchesType = !filterType || apt.type === filterType
    const matchesDateFrom = !filterDateFrom || apt.date >= filterDateFrom
    const matchesDateTo = !filterDateTo || apt.date <= filterDateTo
    return matchesSearch && matchesStatus && matchesType && matchesDateFrom && matchesDateTo
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
          <p className="text-gray-500">Manage your clinic appointments</p>
        </div>
        <button
          onClick={() => {
            setEditingAppointment(null)
            setShowForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus className="w-5 h-5" />
          New Appointment
        </button>
      </div>

      {/* Search and filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, mascota, tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Todos los estados</option>
          <option value="scheduled">Scheduled</option>
          <option value="confirmed">Confirmed</option>
          <option value="in-progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no-show">No-show</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Todos los tipos</option>
          <option value="consultation">Consultation</option>
          <option value="vaccination">Vaccination</option>
          <option value="surgery">Surgery</option>
          <option value="grooming">Grooming</option>
          <option value="emergency">Emergency</option>
          <option value="follow-up">Follow-up</option>
        </select>
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
            placeholder="Desde"
          />
          <span className="text-gray-400">—</span>
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
            placeholder="Hasta"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pet</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No appointments found. Add clients and pets first.
                </td>
              </tr>
            ) : (
              filteredAppointments.map((apt) => {
                const total = apt.totalAmount ?? 0
                const paid = apt.amountPaid ?? 0
                const due = total - paid
                return (
                  <tr key={apt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{apt.date}</p>
                        <p className="text-sm text-gray-500">{apt.time}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{getClientName(apt.clientId)}</td>
                    <td className="px-6 py-4 text-gray-600">{getPetName(apt.petId)}</td>
                    <td className="px-6 py-4 text-gray-600 capitalize">{apt.type}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <span className="text-gray-600">Total: ${total.toFixed(2)}</span>
                        {due > 0 && (
                          <span className="ml-2 text-red-600">Due: ${due.toFixed(2)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        apt.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        apt.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                        apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => {
                          setViewingAppointment(apt)
                        }}
                        className="flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium text-sm"
                      >
                        <Eye className="w-4 h-4" /> View
                      </button>
                      <button
                        onClick={() => {
                          setEditingAppointment(apt)
                          setShowForm(true)
                        }}
                        className="text-teal-600 hover:text-teal-700 font-medium text-sm"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <AppointmentForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingAppointment(null)
        }}
        onSubmit={handleSubmit}
        appointment={editingAppointment}
        pets={pets}
        clients={clients}
        inventoryItems={inventoryItems}
      />

      <AppointmentDetail
        isOpen={!!viewingAppointment}
        onClose={() => setViewingAppointment(null)}
        appointment={viewingAppointment}
        pet={viewingAppointment ? pets.find(p => p.id === viewingAppointment.petId) : null}
        client={viewingAppointment ? clients.find(c => c.id === viewingAppointment.clientId) : null}
        medicalRecord={viewMedicalRecord}
        saleItems={viewSaleItems}
        attachments={viewAttachments}
        inventoryItems={inventoryItems}
        onEdit={() => {
          if (viewingAppointment) {
            setViewingAppointment(null)
            setEditingAppointment(viewingAppointment)
            setShowForm(true)
          }
        }}
        onAttachmentUpload={async (file) => {
          if (!viewingAppointment?.id) return
          const att = await uploadAppointmentAttachment(viewingAppointment.id, file)
          setViewAttachments(prev => [att, ...prev])
        }}
        onAttachmentDelete={async (id) => {
          await deleteAppointmentAttachment(id)
          setViewAttachments(prev => prev.filter(a => a.id !== id))
        }}
      />
    </div>
  )
}
