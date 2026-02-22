import { useState } from 'react'
import { Plus, Search, PawPrint } from 'lucide-react'
import { usePetStore } from '../stores/petStore'

export default function Pets() {
  const { pets } = usePetStore()
  const [searchTerm, setSearchTerm] = useState('')

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pets</h1>
          <p className="text-gray-500">Manage your patient database</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
          <Plus className="w-5 h-5" />
          Add Pet
        </button>
      </div>

      {/* Search */}
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

      {/* Pets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPets.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No pets found
          </div>
        ) : (
          filteredPets.map((pet) => (
            <div key={pet.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
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
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${speciesColors[pet.species] || speciesColors.other}`}>
                  {pet.species}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                  {pet.gender}
                </span>
                {pet.weight && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {pet.weight} kg
                  </span>
                )}
              </div>

              <button className="mt-4 w-full py-2 text-teal-600 font-medium hover:bg-teal-50 rounded-lg transition-colors">
                View Details
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
