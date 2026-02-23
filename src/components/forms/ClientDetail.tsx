// Client detail modal - View client info and their pets

import Modal from '../ui/Modal'
import { Phone, Mail, MapPin, PawPrint } from 'lucide-react'
import type { Client } from '../../db/types'
import type { Pet } from '../../db/types'

interface ClientDetailProps {
  isOpen: boolean
  onClose: () => void
  client: Client | null
  pets: Pet[]
  onEdit?: () => void
}

export default function ClientDetail({ isOpen, onClose, client, pets, onEdit }: ClientDetailProps) {
  if (!client) return null

  const clientPets = pets.filter(p => p.clientId === client.id)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${client.firstName} ${client.lastName}`}
      size="lg"
      footer={
        onEdit && (
          <div className="flex justify-end">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Edit Client
            </button>
          </div>
        )
      }
    >
      <div className="space-y-6">
        {/* Contact info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-5 h-5" />
            {client.email}
          </div>
          {client.phone && (
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-5 h-5" />
              {client.phone}
            </div>
          )}
          {(client.address || client.city) && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-5 h-5" />
              {[client.address, client.city, client.state, client.zipCode].filter(Boolean).join(', ')}
            </div>
          )}
        </div>

        {client.notes && (
          <div>
            <p className="text-sm text-gray-500">Notes</p>
            <p className="text-gray-800">{client.notes}</p>
          </div>
        )}

        {/* Pets */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-800 flex items-center gap-2 mb-3">
            <PawPrint className="w-5 h-5" />
            Pets ({clientPets.length})
          </h4>
          {clientPets.length === 0 ? (
            <p className="text-gray-500 text-sm">No pets registered</p>
          ) : (
            <div className="space-y-2">
              {clientPets.map((pet) => (
                <div
                  key={pet.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800">{pet.name}</p>
                    <p className="text-sm text-gray-500">{pet.breed} • {pet.species}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs bg-teal-100 text-teal-700">
                    {pet.gender}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
