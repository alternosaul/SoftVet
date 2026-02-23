// Pet form modal - Add/Edit pet with full care information

import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import type { Pet, Client } from '../../db/types'

interface PetFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PetFormData) => Promise<void>
  pet?: Pet | null
  clients: Client[]
}

export interface PetFormData {
  clientId: number
  name: string
  species: Pet['species']
  breed: string
  gender: Pet['gender']
  birthDate: string
  weight: number
  height?: number
  color: string
  microchipId: string
  photoUrl: string
  treatment: string
  lastSurgery: string
  allergies: string
  medicalNotes: string
  notes: string
}

const SPECIES_OPTIONS: Pet['species'][] = ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other']

export default function PetForm({ isOpen, onClose, onSubmit, pet, clients }: PetFormProps) {
  const [formData, setFormData] = useState<PetFormData>({
    clientId: clients[0]?.id ?? 0,
    name: '',
    species: 'dog',
    breed: '',
    gender: 'unknown',
    birthDate: '',
    weight: 0,
    height: 0,
    color: '',
    microchipId: '',
    photoUrl: '',
    treatment: '',
    lastSurgery: '',
    allergies: '',
    medicalNotes: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Reset loading when modal closes
  useEffect(() => {
    if (!isOpen) setLoading(false)
  }, [isOpen])

  useEffect(() => {
    if (pet) {
      setFormData({
        clientId: pet.clientId,
        name: pet.name,
        species: pet.species,
        breed: pet.breed || '',
        gender: pet.gender,
        birthDate: pet.birthDate || '',
        weight: pet.weight || 0,
        height: pet.height || 0,
        color: pet.color || '',
        microchipId: pet.microchipId || '',
        photoUrl: pet.photoUrl || '',
        treatment: pet.treatment || '',
        lastSurgery: pet.lastSurgery || '',
        allergies: pet.allergies || '',
        medicalNotes: pet.medicalNotes || '',
        notes: pet.notes || ''
      })
    } else if (clients.length > 0) {
      setFormData(prev => ({
        ...prev,
        clientId: clients[0].id ?? 0
      }))
    }
  }, [pet, clients])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }
    if (!formData.clientId) {
      setError('Please select an owner')
      return
    }
    setLoading(true)
    try {
      // Timeout after 15 seconds to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out. Verify migration 002 and 003 are run in Supabase.')), 30000)
      )
      await Promise.race([onSubmit(formData), timeoutPromise])
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save'
      setError(msg.includes('column') || msg.includes('does not exist')
        ? 'Database schema may be outdated. Run migration 002_extended_schema.sql in Supabase SQL Editor.'
        : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={pet ? 'Edit Pet' : 'Add Pet'}
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
            form="pet-form"
            disabled={loading}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : pet ? 'Update' : 'Add Pet'}
          </button>
        </div>
      }
    >
      <form id="pet-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Owner */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner *</label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              required
            >
              <option value={0}>Select owner...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="Pet name"
              required
            />
          </div>

          {/* Species */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Species</label>
            <select
              value={formData.species}
              onChange={(e) => setFormData({ ...formData, species: e.target.value as Pet['species'] })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              {SPECIES_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Breed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
            <input
              type="text"
              value={formData.breed}
              onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="Breed"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as Pet['gender'] })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>

          {/* Birth Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              value={formData.weight || ''}
              onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="0"
            />
          </div>

          {/* Height */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
            <input
              type="number"
              step="0.1"
              value={formData.height || ''}
              onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="0"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="Color"
            />
          </div>

          {/* Microchip */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Microchip ID</label>
            <input
              type="text"
              value={formData.microchipId}
              onChange={(e) => setFormData({ ...formData, microchipId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="Microchip ID"
            />
          </div>

          {/* Photo URL */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
            <input
              type="url"
              value={formData.photoUrl}
              onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="https://..."
            />
          </div>

          {/* Treatment */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Treatment</label>
            <textarea
              value={formData.treatment}
              onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              rows={2}
              placeholder="Current medications or treatments"
            />
          </div>

          {/* Last Surgery */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Surgery</label>
            <input
              type="text"
              value={formData.lastSurgery}
              onChange={(e) => setFormData({ ...formData, lastSurgery: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="Date and type"
            />
          </div>

          {/* Allergies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
            <input
              type="text"
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="Known allergies"
            />
          </div>

          {/* Medical Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Medical Notes</label>
            <textarea
              value={formData.medicalNotes}
              onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              rows={2}
              placeholder="Important medical history"
            />
          </div>

          {/* General Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              rows={2}
              placeholder="Additional notes"
            />
          </div>
        </div>
      </form>
    </Modal>
  )
}
