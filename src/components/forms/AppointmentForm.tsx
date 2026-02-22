import React, { useState, useEffect } from 'react'
import { Appointment } from '../../stores/appointmentStore'
import { Pet } from '../../stores/petStore'
import { Client } from '../../stores/clientStore'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { DatePicker } from '../ui/DatePicker'
import { TimePicker } from '../ui/TimePicker'
import { Button } from '../ui/Button'

export interface AppointmentFormProps {
  appointment?: Appointment | null
  clients: Client[]
  pets: Pet[]
  preselectedClientId?: number
  preselectedPetId?: number
  onSubmit: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
  isLoading?: boolean
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  appointment,
  clients,
  pets,
  preselectedClientId,
  preselectedPetId,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    clientId: preselectedClientId || 0,
    petId: preselectedPetId || 0,
    date: '',
    time: '',
    duration: 30,
    type: 'consultation' as Appointment['type'],
    status: 'scheduled' as Appointment['status'],
    notes: '',
    veterinarian: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [filteredPets, setFilteredPets] = useState<Pet[]>([])

  useEffect(() => {
    if (appointment) {
      setFormData({
        clientId: appointment.clientId || 0,
        petId: appointment.petId || 0,
        date: appointment.date,
        time: appointment.time,
        duration: appointment.duration,
        type: appointment.type,
        status: appointment.status,
        notes: appointment.notes,
        veterinarian: appointment.veterinarian
      })
    } else if (preselectedClientId) {
      setFormData(prev => ({ ...prev, clientId: preselectedClientId }))
    } else if (preselectedPetId) {
      const pet = pets.find(p => p.id === preselectedPetId)
      if (pet) {
        setFormData(prev => ({ 
          ...prev, 
          petId: preselectedPetId,
          clientId: pet.clientId
        }))
      }
    }
  }, [appointment, preselectedClientId, preselectedPetId, pets])

  useEffect(() => {
    if (formData.clientId) {
      const clientPets = pets.filter(p => p.clientId === formData.clientId)
      setFilteredPets(clientPets)
    } else {
      setFilteredPets([])
    }
  }, [formData.clientId, pets])

  const serviceTypeOptions = [
    { value: 'consultation', label: 'Consultation' },
    { value: 'vaccination', label: 'Vaccination' },
    { value: 'surgery', label: 'Surgery' },
    { value: 'grooming', label: 'Grooming' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'follow-up', label: 'Follow-up' }
  ]

  const statusOptions = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'no-show', label: 'No Show' }
  ]

  const durationOptions = [
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '1 hour' },
    { value: '90', label: '1.5 hours' },
    { value: '120', label: '2 hours' }
  ]

  const clientOptions = clients.map(client => ({
    value: String(client.id || ''),
    label: `${client.firstName} ${client.lastName}`
  }))

  const petOptions = filteredPets.map(pet => ({
    value: String(pet.id || ''),
    label: `${pet.name} (${pet.species})`
  }))

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    let newValue: string | number = value
    
    if (type === 'number') {
      newValue = parseInt(value) || 0
    }
    
    setFormData(prev => ({ ...prev, [name]: newValue }))
    
    if (name === 'clientId' && value) {
      setFormData(prev => ({ ...prev, petId: 0 }))
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleDateChange = (date: string) => {
    setFormData(prev => ({ ...prev, date }))
    if (errors.date) {
      setErrors(prev => ({ ...prev, date: '' }))
    }
  }

  const handleTimeChange = (time: string) => {
    setFormData(prev => ({ ...prev, time }))
    if (errors.time) {
      setErrors(prev => ({ ...prev, time: '' }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.clientId) {
      newErrors.clientId = 'Client is required'
    }
    if (!formData.petId) {
      newErrors.petId = 'Pet is required'
    }
    if (!formData.date) {
      newErrors.date = 'Date is required'
    }
    if (!formData.time) {
      newErrors.time = 'Time is required'
    }
    if (!formData.type) {
      newErrors.type = 'Service type is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Client (Owner)"
          name="clientId"
          value={formData.clientId}
          onChange={handleChange}
          options={clientOptions}
          placeholder="Select a client"
          error={errors.clientId}
        />
        
        <Select
          label="Pet"
          name="petId"
          value={formData.petId}
          onChange={handleChange}
          options={petOptions}
          placeholder="Select a pet"
          error={errors.petId}
          disabled={!formData.clientId}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DatePicker
          label="Date"
          value={formData.date}
          onChange={handleDateChange}
          error={errors.date}
        />
        
        <TimePicker
          label="Time"
          value={formData.time}
          onChange={handleTimeChange}
          error={errors.time}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Service Type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          options={serviceTypeOptions}
          error={errors.type}
        />
        
        <Select
          label="Duration"
          name="duration"
          value={formData.duration.toString()}
          onChange={handleChange}
          options={durationOptions}
        />
      </div>

      {appointment && (
        <Select
          label="Status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          options={statusOptions}
        />
      )}

      <Input
        label="Veterinarian"
        name="veterinarian"
        value={formData.veterinarian}
        onChange={handleChange}
        placeholder="Dr. Smith"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={4}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-vet-teal/20 focus:border-vet-teal"
          placeholder="Reason for visit, symptoms, special instructions..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
        >
          {appointment ? 'Update Appointment' : 'Schedule Appointment'}
        </Button>
      </div>
    </form>
  )
}

export default AppointmentForm
