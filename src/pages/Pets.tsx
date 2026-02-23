import { useState } from 'react'
import { Plus, Search, PawPrint } from 'lucide-react'
import { usePetStore } from '../stores/petStore'
import { useClientStore } from '../stores/clientStore'
import PetForm from '../components/forms/PetForm'
import PetDetail from '../components/forms/PetDetail'
import type { Pet } from '../db/types'
import type { PetFormData } from '../components/forms/PetForm'

export default function Pets() {
  const { pets, addPet, updatePet, fetchPets } = usePetStore()
  const { clients } = useClientStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)
  const [editingPet, setEditingPet] = useState<Pet | null>(null)

  const filteredPets = pets.filter(pet =>
    pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pet.breed.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  const handleSubmit = async (data: PetFormData) => {
    try {
      const now = new Date().toISOString()
      if (editingPet?.id) {
        await updatePet(editingPet.id, data)
      } else {
        await addPet({
          ...data,
          createdAt: now,
          updatedAt: now
        })
      }
      setShowForm(false)
      setEditingPet(null)
      fetchPets()
    } catch (err) {
      console.error('Save pet failed:', err)
      throw err
    }
  }

  const handleViewDetails = (pet: Pet) => {
    setSelectedPet(pet)
    setShowDetail(true)
  }

  const handleEdit = () => {
    if (selectedPet) {
      setEditingPet(selectedPet)
      setShowDetail(false)
      setShowForm(true)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pets</h1>
          <p className="text-gray-500">Manage your patient database</p>
        </div>
        <button
          onClick={() => {
            setEditingPet(null)
            setShowForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus className="w-5 h-5" />
          Add Pet
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search pets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPets.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 mb-2">No pets found. Add a client first, then add their pets.</p>
            <p className="text-sm text-gray-400">
              If you have data in Supabase but it does not appear here, go to Settings → Data to fix the user_id (RLS).
            </p>
          </div>
        ) : (
          filteredPets.map((pet) => {
            const owner = clients.find(c => c.id === pet.clientId)
            return (
              <div
                key={pet.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                    {pet.photoUrl ? (
                      <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <PawPrint className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{pet.name}</h3>
                    <p className="text-sm text-gray-500">{pet.breed}</p>
                    {owner && (
                      <p className="text-xs text-teal-600 mt-0.5">
                        Owner: {owner.firstName} {owner.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${speciesColors[pet.species] || speciesColors.other}`}>
                    {pet.species}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                    {pet.gender}
                  </span>
                  {pet.weight > 0 && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {pet.weight} kg
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleViewDetails(pet)}
                  className="mt-4 w-full py-2 text-teal-600 font-medium hover:bg-teal-50 rounded-lg transition-colors"
                >
                  View Details
                </button>
              </div>
            )
          })
        )}
      </div>

      <PetForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingPet(null)
        }}
        onSubmit={handleSubmit}
        pet={editingPet}
        clients={clients}
      />

      <PetDetail
        isOpen={showDetail}
        onClose={() => {
          setShowDetail(false)
          setSelectedPet(null)
        }}
        pet={selectedPet}
        client={selectedPet ? clients.find(c => c.id === selectedPet.clientId) : null}
        onEdit={handleEdit}
      />
    </div>
  )
}
