// Inventory form modal - Add/Edit medication or item

import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import type { InventoryItem } from '../../db/types'

interface InventoryFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: InventoryFormData) => Promise<void>
  item?: InventoryItem | null
}

export interface InventoryFormData {
  name: string
  type: 'medication' | 'item'
  description: string
  quantity: number
  unit: string
  price: number
  photoUrl: string
  sku: string
}

export default function InventoryForm({ isOpen, onClose, onSubmit, item }: InventoryFormProps) {
  const [formData, setFormData] = useState<InventoryFormData>({
    name: '',
    type: 'medication',
    description: '',
    quantity: 0,
    unit: 'unit',
    price: 0,
    photoUrl: '',
    sku: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        type: item.type || 'medication',
        description: item.description || '',
        quantity: item.quantity ?? 0,
        unit: item.unit || 'unit',
        price: item.price ?? 0,
        photoUrl: item.photoUrl || '',
        sku: item.sku || ''
      })
    } else {
      setFormData({
        name: '',
        type: 'medication',
        description: '',
        quantity: 0,
        unit: 'unit',
        price: 0,
        photoUrl: '',
        sku: ''
      })
    }
  }, [item, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }
    setLoading(true)
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out. Run migration 002 in Supabase for inventory.')), 30000)
      )
      await Promise.race([onSubmit(formData), timeoutPromise])
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Edit Item' : 'Add Item'}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="submit"
            form="inventory-form"
            disabled={loading}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : item ? 'Update' : 'Add'}
          </button>
        </div>
      }
    >
      <form id="inventory-form" onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'medication' | 'item' })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="medication">Medication</option>
              <option value="item">Item</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              value={formData.quantity || ''}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="unit, box, ml"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <input
              type="number"
              step="0.01"
              value={formData.price || ''}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>
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
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              rows={2}
            />
          </div>
        </div>
      </form>
    </Modal>
  )
}
