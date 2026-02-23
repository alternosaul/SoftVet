// Pet detail modal - View full pet information, medical history, vaccines

import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import { PawPrint, FileText, Syringe, Plus, ChevronRight } from 'lucide-react'
import { getMedicalRecordsByPet, getVaccinesByPet, addVaccine } from '../../db/supabase'
import type { Pet, Client, MedicalRecord, Vaccine } from '../../db/types'

interface PetDetailProps {
  isOpen: boolean
  onClose: () => void
  pet: Pet | null
  client?: Client | null
  onEdit?: () => void
}

const speciesColors: Record<string, string> = {
  dog: 'bg-blue-100 text-blue-700',
  cat: 'bg-orange-100 text-orange-700',
  bird: 'bg-yellow-100 text-yellow-700',
  rabbit: 'bg-pink-100 text-pink-700',
  hamster: 'bg-amber-100 text-amber-700',
  fish: 'bg-cyan-100 text-cyan-700',
  reptile: 'bg-green-100 text-green-700',
  other: 'bg-gray-100 text-gray-700'
}

export default function PetDetail({ isOpen, onClose, pet, client, onEdit }: PetDetailProps) {
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [vaccines, setVaccines] = useState<Vaccine[]>([])
  const [showAddVaccine, setShowAddVaccine] = useState(false)
  const [newVaccine, setNewVaccine] = useState({ name: '', dateAdministered: '', nextDueDate: '', notes: '' })
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)

  // Load medical history and vaccines when pet is shown
  useEffect(() => {
    if (!pet?.id || !isOpen) return
    getMedicalRecordsByPet(pet.id).then(setMedicalRecords)
    getVaccinesByPet(pet.id).then(setVaccines)
  }, [pet?.id, isOpen])

  const handleAddVaccine = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pet?.id || !newVaccine.name || !newVaccine.dateAdministered) return
    try {
      await addVaccine({
        petId: pet.id,
        name: newVaccine.name,
        dateAdministered: newVaccine.dateAdministered,
        nextDueDate: newVaccine.nextDueDate,
        notes: newVaccine.notes
      })
      const updated = await getVaccinesByPet(pet.id)
      setVaccines(updated)
      setNewVaccine({ name: '', dateAdministered: '', nextDueDate: '', notes: '' })
      setShowAddVaccine(false)
    } catch (err) {
      console.error('Failed to add vaccine:', err)
    }
  }

  if (!pet) return null

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={pet.name}
      size="lg"
      footer={
        onEdit && (
          <div className="flex justify-end">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Edit Pet
            </button>
          </div>
        )
      }
    >
      <div className="space-y-6">
        {/* Header with photo */}
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
            {pet.photoUrl ? (
              <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
            ) : (
              <PawPrint className="w-12 h-12 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{pet.name}</h3>
            <p className="text-gray-500">{pet.breed} • {pet.species}</p>
            {client && (
              <p className="text-sm text-teal-600 mt-1">
                Owner: {client.firstName} {client.lastName}
              </p>
            )}
            <div className="flex gap-2 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${speciesColors[pet.species] || speciesColors.other}`}>
                {pet.species}
              </span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                {pet.gender}
              </span>
            </div>
          </div>
        </div>

        {/* Basic info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Birth Date</p>
            <p className="font-medium">{pet.birthDate || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Weight</p>
            <p className="font-medium">{pet.weight ? `${pet.weight} kg` : '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Height</p>
            <p className="font-medium">{pet.height ? `${pet.height} cm` : '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Color</p>
            <p className="font-medium">{pet.color || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Microchip ID</p>
            <p className="font-medium">{pet.microchipId || '—'}</p>
          </div>
        </div>

        {/* Medical info */}
        {(pet.treatment || pet.lastSurgery || pet.allergies) && (
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium text-gray-800">Medical Information</h4>
            {pet.treatment && (
              <div>
                <p className="text-sm text-gray-500">Current Treatment</p>
                <p className="text-gray-800">{pet.treatment}</p>
              </div>
            )}
            {pet.lastSurgery && (
              <div>
                <p className="text-sm text-gray-500">Last Surgery</p>
                <p className="text-gray-800">{pet.lastSurgery}</p>
              </div>
            )}
            {pet.allergies && (
              <div>
                <p className="text-sm text-gray-500">Allergies</p>
                <p className="text-red-600">{pet.allergies}</p>
              </div>
            )}
            {pet.medicalNotes && (
              <div>
                <p className="text-sm text-gray-500">Medical Notes</p>
                <p className="text-gray-800">{pet.medicalNotes}</p>
              </div>
            )}
          </div>
        )}

        {pet.notes && (
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500">Notes</p>
            <p className="text-gray-800">{pet.notes}</p>
          </div>
        )}

        {/* Medical history (historial médico por cita) */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Medical History
          </h4>
          {medicalRecords.length === 0 ? (
            <p className="text-sm text-gray-500">No medical records yet</p>
          ) : (
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {medicalRecords.map((rec) => (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => setSelectedRecord(rec)}
                  className="w-full text-left p-3 bg-gray-50 rounded-lg text-sm hover:bg-gray-100 transition-colors flex items-center justify-between group"
                >
                  <div>
                    <p className="text-gray-500 text-xs">{rec.createdAt?.split('T')[0]}</p>
                    {rec.diagnosis && <p><span className="text-gray-500">Diagnosis:</span> {rec.diagnosis}</p>}
                    {rec.treatment && <p><span className="text-gray-500">Treatment:</span> {rec.treatment}</p>}
                    {rec.notes && <p><span className="text-gray-500">Notes:</span> {rec.notes}</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-teal-600 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Vaccine tracking (control de vacunas) */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <Syringe className="w-4 h-4" /> Vaccines
          </h4>
          {vaccines.length === 0 && !showAddVaccine && (
            <p className="text-sm text-gray-500 mb-2">No vaccines recorded</p>
          )}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {vaccines.map((v) => (
              <div key={v.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm">
                <div>
                  <p className="font-medium">{v.name}</p>
                  <p className="text-gray-500 text-xs">
                    {v.dateAdministered}
                    {v.nextDueDate && ` • Next: ${v.nextDueDate}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {showAddVaccine ? (
            <form onSubmit={handleAddVaccine} className="mt-3 p-3 border rounded-lg space-y-2">
              <input
                type="text"
                placeholder="Vaccine name"
                value={newVaccine.name}
                onChange={(e) => setNewVaccine(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded text-sm"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  placeholder="Date"
                  value={newVaccine.dateAdministered}
                  onChange={(e) => setNewVaccine(prev => ({ ...prev, dateAdministered: e.target.value }))}
                  className="px-3 py-2 border rounded text-sm"
                  required
                />
                <input
                  type="date"
                  placeholder="Next due"
                  value={newVaccine.nextDueDate}
                  onChange={(e) => setNewVaccine(prev => ({ ...prev, nextDueDate: e.target.value }))}
                  className="px-3 py-2 border rounded text-sm"
                />
              </div>
              <input
                type="text"
                placeholder="Notes"
                value={newVaccine.notes}
                onChange={(e) => setNewVaccine(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border rounded text-sm"
              />
              <div className="flex gap-2">
                <button type="submit" className="px-3 py-1.5 bg-teal-600 text-white rounded text-sm">
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddVaccine(false)}
                  className="px-3 py-1.5 border rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddVaccine(true)}
              className="mt-2 flex items-center gap-1 text-teal-600 hover:text-teal-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add vaccine
            </button>
          )}
        </div>
      </div>

      {/* Medical record detail modal */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Detalle del historial médico"
        size="md"
      >
        {selectedRecord && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Fecha: {selectedRecord.createdAt?.split('T')[0]}
            </p>
            {selectedRecord.symptoms && (
              <div>
                <p className="text-sm font-medium text-gray-600">Síntomas</p>
                <p className="text-gray-800">{selectedRecord.symptoms}</p>
              </div>
            )}
            {selectedRecord.diagnosis && (
              <div>
                <p className="text-sm font-medium text-gray-600">Diagnóstico</p>
                <p className="text-gray-800">{selectedRecord.diagnosis}</p>
              </div>
            )}
            {selectedRecord.treatment && (
              <div>
                <p className="text-sm font-medium text-gray-600">Tratamiento</p>
                <p className="text-gray-800">{selectedRecord.treatment}</p>
              </div>
            )}
            {selectedRecord.notes && (
              <div>
                <p className="text-sm font-medium text-gray-600">Notas</p>
                <p className="text-gray-800">{selectedRecord.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Modal>
    </>
  )
}
