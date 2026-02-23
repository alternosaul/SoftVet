import { useState, useEffect } from 'react'
import { Plus, Search, Pencil, Trash2, Package, Minus } from 'lucide-react'
import { useInventoryStore } from '../stores/inventoryStore'
import InventoryForm from '../components/forms/InventoryForm'
import type { InventoryItem } from '../db/types'
import type { InventoryFormData } from '../components/forms/InventoryForm'

export default function Inventory() {
  const { items, fetchItems, addItem, updateItem, deleteItem } = useInventoryStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (data: InventoryFormData) => {
    if (editingItem?.id) {
      await updateItem(editingItem.id, data)
    } else {
      await addItem(data)
    }
    setShowForm(false)
    setEditingItem(null)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this item?')) {
      await deleteItem(id)
    }
  }

  const handleAdjustQuantity = async (id: number, delta: number) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    const newQty = Math.max(0, (item.quantity ?? 0) + delta)
    await updateItem(id, { quantity: newQty })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
          <p className="text-gray-500">Medications and clinic items</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null)
            setShowForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search inventory..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No items found
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  {item.photoUrl ? (
                    <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800">{item.name}</h3>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                    item.type === 'medication' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {item.type}
                  </span>
                  <p className="mt-2 text-sm text-gray-600">
                    Qty: {item.quantity} {item.unit || 'unit'}
                  </p>
                  <p className="text-lg font-semibold text-teal-600">${(item.price || 0).toFixed(2)}</p>
                </div>
              </div>
              {/* Quick actions: +/-, edit, delete */}
              <div className="mt-4 flex items-center gap-2">
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => item.id && handleAdjustQuantity(item.id, -1)}
                    disabled={!item.quantity}
                    className="p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Restar 1"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => item.id && handleAdjustQuantity(item.id, 1)}
                    className="p-2 text-teal-600 hover:bg-teal-50"
                    title="Sumar 1"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => {
                    setEditingItem(item)
                    setShowForm(true)
                  }}
                  className="p-2 text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => item.id && handleDelete(item.id)}
                  className="p-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <InventoryForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingItem(null)
        }}
        onSubmit={handleSubmit}
        item={editingItem}
      />
    </div>
  )
}
