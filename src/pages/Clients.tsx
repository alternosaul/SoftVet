import { useState } from 'react'
import { Plus, Search, Phone, Mail, MapPin } from 'lucide-react'
import { useClientStore } from '../stores/clientStore'
import { usePetStore } from '../stores/petStore'
import ClientForm from '../components/forms/ClientForm'
import ClientDetail from '../components/forms/ClientDetail'
import type { Client } from '../db/types'
import type { ClientFormData } from '../components/forms/ClientForm'

export default function Clients() {
  const { clients, addClient, updateClient, fetchClients } = useClientStore()
  const { pets } = usePetStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const filteredClients = clients.filter(client =>
    client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (data: ClientFormData) => {
    try {
      const now = new Date().toISOString()
      if (editingClient?.id) {
        await updateClient(editingClient.id, {
          ...data,
          updatedAt: now
        })
      } else {
        await addClient({
          ...data,
          createdAt: now,
          updatedAt: now
        })
      }
      setShowForm(false)
      setEditingClient(null)
      fetchClients()
    } catch (err) {
      console.error('Save client failed:', err)
      throw err
    }
  }

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client)
    setShowDetail(true)
  }

  const handleEdit = () => {
    if (selectedClient) {
      setEditingClient(selectedClient)
      setShowDetail(false)
      setShowForm(true)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
          <p className="text-gray-500">Manage your client database</p>
        </div>
        <button
          onClick={() => {
            setEditingClient(null)
            setShowForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus className="w-5 h-5" />
          Add Client
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 mb-2">No clients found</p>
            <p className="text-sm text-gray-400">
              If you have data in Supabase but it does not appear here, go to Settings → Data to fix the user_id (RLS).
            </p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-teal-600 font-semibold text-lg">
                      {client.firstName[0]}{client.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{client.firstName} {client.lastName}</h3>
                    <p className="text-sm text-gray-500">Client since {new Date(client.createdAt).getFullYear()}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  {client.phone || '—'}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  {client.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {client.city && client.state ? `${client.city}, ${client.state}` : '—'}
                </div>
              </div>

              <button
                onClick={() => handleViewDetails(client)}
                className="mt-4 w-full py-2 text-teal-600 font-medium hover:bg-teal-50 rounded-lg transition-colors"
              >
                View Details
              </button>
            </div>
          ))
        )}
      </div>

      <ClientForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingClient(null)
        }}
        onSubmit={handleSubmit}
        client={editingClient}
      />

      <ClientDetail
        isOpen={showDetail}
        onClose={() => {
          setShowDetail(false)
          setSelectedClient(null)
        }}
        client={selectedClient}
        pets={pets}
        onEdit={handleEdit}
      />
    </div>
  )
}
