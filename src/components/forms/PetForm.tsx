import React, { useState, useEffect } from 'react'
import { Pet } from '../../stores/petStore'
import { Client } from '../../stores/clientStore'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { DatePicker } from '../ui/DatePicker'
import { Button } from '../ui/Button'

export interface PetFormProps {
  pet?: Pet | null
  clients: Client[]
  clientId?: number
  onSubmit: (pet: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
  isLoading?: boolean
}

export const PetForm: React.FC<PetFormProps> = ({
  pet,
  clients,
  clientId,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    clientId: clientId || 0,
    name: '',
    species: 'dog' as Pet['species'],
    breed: '',
    gender: 'unknown' as Pet['gender'],
    birthDate: '',
    weight: 0,
    color: '',
    microchipId: '',
    notes: '',
    photoUrl: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (pet) {
      setFormData({
        clientId: pet.clientId || 0,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        gender: pet.gender,
        birthDate: pet.birthDate,
        weight: pet.weight,
        color: pet.color,
        microchipId: pet.microchipId,
        notes: pet.notes,
        photoUrl: pet.photoUrl
      })
    } else if (clientId) {
      setFormData(prev => ({ ...prev, clientId }))
    }
  }, [pet, clientId])

  const speciesOptions = [
    { value: 'dog', label: 'Dog' },
    { value: 'cat', label: 'Cat' },
    { value: 'bird', label: 'Bird' },
    { value: 'rabbit', label: 'Rabbit' },
    { value: 'hamster', label: 'Hamster' },
    { value: 'fish', label: 'Fish' },
    { value: 'reptile', label: 'Reptile' },
    { value: 'other', label: 'Other' }
  ]

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'unknown', label: 'Unknown' }
  ]

  const clientOptions = clients.map(client => ({
    value: String(client.id || ''),
    label: `${client.firstName} ${client.lastName}`
  }))

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    let newValue: string | number = value
    
    if (name === 'clientId') {
      newValue = parseInt(value) || 0
    } else if (type === 'number') {
      newValue = parseFloat(value) || 0
    }
    
    setFormData(prev => ({ ...prev, [name]: newValue }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleDateChange = (date: string) => {
    setFormData(prev => ({ ...prev, birthDate: date }))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.clientId) {
      newErrors.clientId = 'Owner is required'
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Pet name is required'
    }
    if (!formData.species) {
      newErrors.species = 'Species is required'
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
      {!clientId && (
        <Select
          label="Owner"
          name="clientId"
          value={formData.clientId}
          onChange={handleChange}
          options={clientOptions}
          placeholder="Select an owner"
          error={errors.clientId}
        />
      )}

      <Input
        label="Pet Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        placeholder="Buddy"
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Species"
          name="species"
          value={formData.species}
          onChange={handleChange}
          options={speciesOptions}
          error={errors.species}
        />
        
        <Input
          label="Breed"
          name="breed"
          value={formData.breed}
          onChange={handleChange}
          placeholder="Golden Retriever"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Gender"
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          options={genderOptions}
        />
        
        <DatePicker
          label="Birth Date"
          value={formData.birthDate}
          onChange={handleDateChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Weight (kg)"
          name="weight"
          type="number"
          value={formData.weight}
          onChange={handleChange}
          placeholder="10.5"
          min={0}
          step={0.1}
        />
        
        <Input
          label="Color"
          name="color"
          value={formData.color}
          onChange={handleChange}
          placeholder="Golden"
        />
      </div>

      <Input
        label="Microchip ID"
        name="microchipId"
        value={formData.microchipId}
        onChange={handleChange}
        placeholder="123456789012345"
      />

      <Input
        label="Photo URL"
        name="photoUrl"
        value={formData.photoUrl}
        onChange={handleChange}
        placeholder="https://example.com/photo.jpg"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Medical History / Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={4}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-vet-teal/20 focus:border-vet-teal"
          placeholder="Medical history, allergies, medications..."
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
          {pet ? 'Update Pet' : 'Add Pet'}
        </Button>
      </div>
    </form>
  )
}

export default PetForm
