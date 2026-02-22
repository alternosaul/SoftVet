import React, { useState, useMemo } from 'react'
import { Client } from '../../stores/clientStore'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

export interface ClientListProps {
  clients: Client[]
  onClientClick?: (client: Client) => void
  onAddClient?: () => void
}

export const ClientList: React.FC<ClientListProps> = ({
  clients,
  onClientClick,
  onAddClient
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name')

  const filteredClients = useMemo(() => {
    let result = [...clients]
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        client =>
          client.firstName.toLowerCase().includes(query) ||
          client.lastName.toLowerCase().includes(query) ||
          client.email.toLowerCase().includes(query) ||
          client.phone.includes(query)
      )
    }
    
    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase()
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase()
        return nameA.localeCompare(nameB)
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    
    return result
  }, [clients, searchQuery, sortBy])

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            leftIcon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'name' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSortBy('name')}
          >
            By Name
          </Button>
          <Button
            variant={sortBy === 'date' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSortBy('date')}
          >
            By Date
          </Button>
          {onAddClient && (
            <Button variant="primary" size="sm" onClick={onAddClient}>
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Client
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">
        Showing {filteredClients.length} of {clients.length} clients
      </p>

      {/* Client list */}
      <div className="grid gap-4">
        {filteredClients.length === 0 ? (
          <Card className="text-center py-8">
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" 
              />
            </svg>
            <p className="text-gray-500">No clients found</p>
          </Card>
        ) : (
          filteredClients.map(client => (
            <Card
              key={client.id}
              hover
              onClick={() => onClientClick?.(client)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-vet-teal/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-vet-teal font-semibold text-lg">
                    {client.firstName[0]}{client.lastName[0]}
                  </span>
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">
                    {client.firstName} {client.lastName}
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {client.email}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {client.phone}
                    </span>
                  </div>
                  {client.address && (
                    <p className="text-sm text-gray-400 mt-1 truncate">
                      {client.city ? `${client.city}, ` : ''}{client.state} {client.zipCode}
                    </p>
                  )}
                </div>
                
                {/* Arrow */}
                <svg 
                  className="w-5 h-5 text-gray-300 flex-shrink-0" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default ClientList
