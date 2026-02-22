import React, { useState, useMemo } from 'react'
import { Pet } from '../../stores/petStore'
import { Client } from '../../stores/clientStore'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'

export interface PetListProps {
  pets: Pet[]
  clients: Client[]
  onPetClick?: (pet: Pet) => void
  onAddPet?: () => void
}

export const PetList: React.FC<PetListProps> = ({
  pets,
  clients,
  onPetClick,
  onAddPet
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [speciesFilter, setSpeciesFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'species'>('name')

  const getClientById = (clientId: string) => clients.find(c => c.id === clientId)

  const speciesOptions = [
    { value: 'all', label: 'All Species' },
    { value: 'dog', label: 'Dog' },
    { value: 'cat', label: 'Cat' },
    { value: 'bird', label: 'Bird' },
    { value: 'rabbit', label: 'Rabbit' },
    { value: 'hamster', label: 'Hamster' },
    { value: 'fish', label: 'Fish' },
    { value: 'reptile', label: 'Reptile' },
    { value: 'other', label: 'Other' }
  ]

  const filteredPets = useMemo(() => {
    let result = [...pets]
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        pet =>
          pet.name.toLowerCase().includes(query) ||
          pet.breed.toLowerCase().includes(query) ||
          pet.color.toLowerCase().includes(query)
      )
    }
    
    // Filter by species
    if (speciesFilter !== 'all') {
      result = result.filter(pet => pet.species === speciesFilter)
    }
    
    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      }
      return a.species.localeCompare(b.species)
    })
    
    return result
  }, [pets, searchQuery, speciesFilter, sortBy])

  const getSpeciesIcon = (species: Pet['species']) => {
    const icons: Record<Pet['species'], JSX.Element> = {
      dog: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
      cat: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
      bird: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
      rabbit: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
      hamster: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
      fish: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
      reptile: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
      other: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      )
    }
    return icons[species]
  }

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 'Unknown'
    const birth = new Date(birthDate)
    const today = new Date()
    let years = today.getFullYear() - birth.getFullYear()
    let months = today.getMonth() - birth.getMonth()
    
    if (months < 0) {
      years--
      months += 12
    }
    
    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}`
    } else if (months > 0) {
      return `${months} 1 ? 's' : ''}`
    }
    return 'Less than a month month${months >'
  }

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search pets..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            leftIcon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
        
        <Select
          value={speciesFilter}
          onChange={e => setSpeciesFilter(e.target.value)}
          options={speciesOptions}
          className="w-full sm:w-40"
        />
        
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'name' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSortBy('name')}
          >
            By Name
          </Button>
          <Button
            variant={sortBy === 'species' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSortBy('species')}
          >
            By Species
          </Button>
          {onAddPet && (
            <Button variant="primary" size="sm" onClick={onAddPet}>
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Pet
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">
        Showing {filteredPets.length} of {pets.length} pets
      </p>

      {/* Pet grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPets.length === 0 ? (
          <Card className="col-span-full text-center py-8">
            <svg 
              className="w-12 h-12 mx-auto text-gray-300 mb-3" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
              />
            </svg>
            <p className="text-gray-500">No pets found</p>
          </Card>
        ) : (
          filteredPets.map(pet => {
            const owner = getClientById(pet.clientId)
            return (
              <Card
                key={pet.id}
                hover
                onClick={() => onPetClick?.(pet)}
                className="cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {/* Pet avatar */}
                  <div className="w-16 h-16 rounded-xl bg-vet-teal/10 flex items-center justify-center flex-shrink-0 text-vet-teal">
                    {pet.photoUrl ? (
                      <img 
                        src={pet.photoUrl} 
                        alt={pet.name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    ) : (
                      getSpeciesIcon(pet.species)
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">
                      {pet.name}
                    </h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {pet.breed || pet.species}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600 capitalize">
                        {pet.species}
                      </span>
                      {pet.weight > 0 && (
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                          {pet.weight} kg
                        </span>
                      )}
                      {pet.birthDate && (
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                          {calculateAge(pet.birthDate)}
                        </span>
                      )}
                    </div>
                    {owner && (
                      <p className="text-xs text-gray-400 mt-2">
                        Owner: {owner.firstName} {owner.lastName}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

export default PetList
