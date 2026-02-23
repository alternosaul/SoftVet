// Appointment form modal - Create/Edit appointment with pet/client selection
// Includes medical record, medication sales, and default pricing from settings

import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import { Trash2 } from 'lucide-react'
import { getSettingValue } from '../../db/supabase'
import type { Appointment, Pet, Client, InventoryItem } from '../../db/types'

interface AppointmentFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AppointmentFormData) => Promise<void>
  appointment?: Appointment | null
  pets: Pet[]
  clients: Client[]
  inventoryItems?: InventoryItem[]
}

// Sale item for medications sold during appointment
export interface SaleItemInput {
  inventoryId: number
  quantity: number
  unitPrice: number
}

// Medical record for this appointment
export interface MedicalRecordInput {
  symptoms: string
  diagnosis: string
  treatment: string
  notes: string
}

export interface AppointmentFormData {
  petId: number
  clientId: number
  date: string
  time: string
  duration: number
  type: Appointment['type']
  status: Appointment['status']
  veterinarian: string
  notes: string
  totalAmount: number
  amountPaid: number
  saleItems: SaleItemInput[]
  medicalRecord: MedicalRecordInput
}

const APPOINTMENT_TYPES: Appointment['type'][] = [
  'consultation', 'vaccination', 'surgery', 'grooming', 'emergency', 'follow-up'
]
const APPOINTMENT_STATUSES: Appointment['status'][] = [
  'scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'
]

// Map appointment type to settings key for default price
const PRICE_KEYS: Record<Appointment['type'], string> = {
  consultation: 'price_consultation',
  vaccination: 'price_vaccination',
  surgery: 'price_surgery',
  grooming: 'price_grooming',
  emergency: 'price_emergency',
  'follow-up': 'price_follow-up'
}

const emptyMedicalRecord: MedicalRecordInput = {
  symptoms: '',
  diagnosis: '',
  treatment: '',
  notes: ''
}

export default function AppointmentForm({
  isOpen,
  onClose,
  onSubmit,
  appointment,
  pets,
  clients,
  inventoryItems = []
}: AppointmentFormProps) {
  const [formData, setFormData] = useState<AppointmentFormData>({
    petId: 0,
    clientId: 0,
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    duration: 30,
    type: 'consultation',
    status: 'scheduled',
    veterinarian: '',
    notes: '',
    totalAmount: 0,
    amountPaid: 0,
    saleItems: [],
    medicalRecord: { ...emptyMedicalRecord }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectByPet, setSelectByPet] = useState(true) // true = select pet first, false = select client first

  // Pets filtered by selected client (when selecting by client)
  const petsForClient = formData.clientId
    ? pets.filter(p => p.clientId === formData.clientId)
    : []

  // When pet is selected, auto-fill client
  useEffect(() => {
    if (formData.petId && selectByPet) {
      const pet = pets.find(p => p.id === formData.petId)
      if (pet) setFormData(prev => ({ ...prev, clientId: pet.clientId }))
    }
  }, [formData.petId, selectByPet, pets])

  // When client is selected, reset pet if not in their list (skip when editing - appointment data is valid)
  useEffect(() => {
    if (appointment) return
    if (formData.clientId && formData.petId) {
      const pet = pets.find(p => p.id === formData.petId)
      if (pet && pet.clientId !== formData.clientId) {
        setFormData(prev => ({ ...prev, petId: 0 }))
      }
    }
  }, [appointment, formData.clientId, formData.petId, pets])

  // Load default price from settings when type changes (for new appointments)
  // Keeps medications total when changing type
  useEffect(() => {
    if (!appointment && formData.type) {
      const key = PRICE_KEYS[formData.type]
      getSettingValue(key).then(val => {
        const basePrice = val ? parseFloat(val) : 0
        setFormData(prev => {
          const medsTotal = prev.saleItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
          return { ...prev, totalAmount: basePrice + medsTotal }
        })
      }).catch(() => {})
    }
  }, [formData.type, appointment])


  useEffect(() => {
    if (appointment) {
      setFormData({
        petId: appointment.petId,
        clientId: appointment.clientId,
        date: appointment.date,
        time: appointment.time,
        duration: appointment.duration || 30,
        type: appointment.type,
        status: appointment.status,
        veterinarian: appointment.veterinarian || '',
        notes: appointment.notes || '',
        totalAmount: appointment.totalAmount || 0,
        amountPaid: appointment.amountPaid || 0,
        saleItems: [],
        medicalRecord: { ...emptyMedicalRecord }
      })
    } else if (pets.length > 0) {
      const firstPet = pets[0]
      setFormData(prev => ({
        ...prev,
        petId: firstPet.id ?? 0,
        clientId: firstPet.clientId,
        saleItems: [],
        medicalRecord: { ...emptyMedicalRecord }
      }))
    }
  }, [appointment, pets])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    // Use appointment values as fallback when editing (avoids validation bug when auto-filled fields)
    const petId = formData.petId || appointment?.petId
    const clientId = formData.clientId || appointment?.clientId
    if (!petId || !clientId) {
      setError('Please select a pet and client')
      return
    }
    setLoading(true)
    try {
      const dataToSubmit = { ...formData, petId, clientId }
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out. Check your connection.')), 30000)
      )
      await Promise.race([onSubmit(dataToSubmit), timeoutPromise])
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const selectedClient = clients.find(c => c.id === formData.clientId)
  const selectedPet = pets.find(p => p.id === formData.petId)
  const amountDue = (formData.totalAmount || 0) - (formData.amountPaid || 0)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={appointment ? 'Edit Appointment' : 'New Appointment'}
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="appointment-form"
            disabled={loading}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : appointment ? 'Update' : 'Create'}
          </button>
        </div>
      }
    >
      <form id="appointment-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        {/* Toggle selection order */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSelectByPet(true)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              selectByPet ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Select Pet first
          </button>
          <button
            type="button"
            onClick={() => setSelectByPet(false)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              !selectByPet ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Select Client first
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectByPet ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pet *</label>
                <select
                  value={formData.petId}
                  onChange={(e) => setFormData({ ...formData, petId: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value={0}>Select pet...</option>
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.breed}) - {clients.find(c => c.id === p.clientId)?.firstName} {clients.find(c => c.id === p.clientId)?.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client (auto-filled)</label>
                <input
                  type="text"
                  value={selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : ''}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: Number(e.target.value), petId: 0 })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value={0}>Select client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pet *</label>
                <select
                  value={formData.petId}
                  onChange={(e) => setFormData({ ...formData, petId: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value={0}>Select pet...</option>
                  {petsForClient.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.breed})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              min={5}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as Appointment['type'] })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              {APPOINTMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Appointment['status'] })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              {APPOINTMENT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Veterinarian</label>
            <input
              type="text"
              value={formData.veterinarian}
              onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="Dr. Name"
            />
          </div>

          {/* Medications sold (cobrar medicamentos en consulta) */}
          {inventoryItems.length > 0 && (
            <div className="md:col-span-2 border-t pt-4 mt-4">
              <h4 className="font-medium text-gray-800 mb-3">Medications to sell</h4>
              <div className="space-y-2">
                {formData.saleItems.map((item, idx) => {
                  const inv = inventoryItems.find(i => i.id === item.inventoryId)
                  return (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <span className="flex-1 text-sm">{inv?.name ?? 'Item'}</span>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => {
                          const qty = parseInt(e.target.value) || 1
                          const prev = formData.saleItems[idx]
                          const diff = (qty - prev.quantity) * prev.unitPrice
                          setFormData(prevF => ({
                            ...prevF,
                            saleItems: prevF.saleItems.map((s, i) =>
                              i === idx ? { ...s, quantity: qty } : s
                            ),
                            totalAmount: Math.max(0, (prevF.totalAmount || 0) + diff)
                          }))
                        }}
                        className="w-16 px-2 py-1 border rounded text-sm"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const price = parseFloat(e.target.value) || 0
                          const prev = formData.saleItems[idx]
                          const diff = prev.quantity * (price - prev.unitPrice)
                          setFormData(prevF => ({
                            ...prevF,
                            saleItems: prevF.saleItems.map((s, i) =>
                              i === idx ? { ...s, unitPrice: price } : s
                            ),
                            totalAmount: Math.max(0, (prevF.totalAmount || 0) + diff)
                          }))
                        }}
                        className="w-20 px-2 py-1 border rounded text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const removed = formData.saleItems[idx]
                          const sub = removed.quantity * removed.unitPrice
                          setFormData(prev => ({
                            ...prev,
                            saleItems: prev.saleItems.filter((_, i) => i !== idx),
                            totalAmount: Math.max(0, (prev.totalAmount || 0) - sub)
                          }))
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
                <select
                  value=""
                  onChange={(e) => {
                    const id = Number(e.target.value)
                    if (!id) return
                    const inv = inventoryItems.find(i => i.id === id)
                    if (!inv) return
                    setFormData(prev => ({
                      ...prev,
                      saleItems: [...prev.saleItems, { inventoryId: id, quantity: 1, unitPrice: inv.price }],
                      totalAmount: (prev.totalAmount || 0) + inv.price
                    }))
                    e.target.value = ''
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="">Add medication...</option>
                  {inventoryItems.filter(i => i.type === 'medication').map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.name} (${inv.price})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Medical record (historial médico por cita) */}
          <div className="md:col-span-2 border-t pt-4 mt-4">
            <h4 className="font-medium text-gray-800 mb-3">Medical Record</h4>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Symptoms</label>
                <input
                  type="text"
                  value={formData.medicalRecord.symptoms}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    medicalRecord: { ...prev.medicalRecord, symptoms: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Symptoms observed"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Diagnosis</label>
                <input
                  type="text"
                  value={formData.medicalRecord.diagnosis}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    medicalRecord: { ...prev.medicalRecord, diagnosis: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Diagnosis"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Treatment</label>
                <input
                  type="text"
                  value={formData.medicalRecord.treatment}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    medicalRecord: { ...prev.medicalRecord, treatment: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Treatment prescribed"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Notes</label>
                <textarea
                  value={formData.medicalRecord.notes}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    medicalRecord: { ...prev.medicalRecord, notes: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows={2}
                  placeholder="Additional notes"
                />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="md:col-span-2 border-t pt-4 mt-4">
            <h4 className="font-medium text-gray-800 mb-3">Payment</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalAmount || ''}
                  onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amountPaid || ''}
                  onChange={(e) => setFormData({ ...formData, amountPaid: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Due</label>
                <input
                  type="text"
                  value={amountDue > 0 ? amountDue.toFixed(2) : '0.00'}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50"
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              rows={2}
            />
          </div>
        </div>
      </form>
    </Modal>
  )
}
