// Appointment detail modal - View appointment with medical record, medications sold, attachments, payment

import { useState, useRef } from 'react'
import Modal from '../ui/Modal'
import { CalendarDays, FileText, Pill, DollarSign, Paperclip, Trash2, ExternalLink } from 'lucide-react'
import type { Appointment, Pet, Client, MedicalRecord, SaleItem, InventoryItem, AppointmentAttachment } from '../../db/types'

interface AppointmentDetailProps {
  isOpen: boolean
  onClose: () => void
  appointment: Appointment | null
  pet?: Pet | null
  client?: Client | null
  medicalRecord?: MedicalRecord | null
  saleItems?: SaleItem[]
  attachments?: AppointmentAttachment[]
  inventoryItems?: InventoryItem[]
  onEdit?: () => void
  onAttachmentUpload?: (file: File) => Promise<void>
  onAttachmentDelete?: (id: number) => Promise<void>
}

export default function AppointmentDetail({
  isOpen,
  onClose,
  appointment,
  pet,
  client,
  medicalRecord,
  saleItems = [],
  attachments = [],
  inventoryItems = [],
  onEdit,
  onAttachmentUpload,
  onAttachmentDelete
}: AppointmentDetailProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  if (!appointment) return null

  const total = appointment.totalAmount ?? 0
  const paid = appointment.amountPaid ?? 0
  const due = total - paid

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onAttachmentUpload) return
    setUploading(true)
    try {
      await onAttachmentUpload(file)
      e.target.value = ''
    } catch (err) {
      console.error('Upload failed:', err)
      alert(err instanceof Error ? err.message : 'Error al subir')
    } finally {
      setUploading(false)
    }
  }

  const isImage = (type?: string, name?: string) => {
    const t = (type || '').toLowerCase()
    const n = (name || '').toLowerCase()
    return t.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/.test(n)
  }

  // Get inventory item name by id
  const getItemName = (inventoryId: number) => {
    const item = inventoryItems.find(i => i.id === inventoryId)
    return item?.name ?? `Item #${inventoryId}`
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Appointment - ${appointment.date} ${appointment.time}`}
      size="lg"
      footer={
        onEdit && (
          <div className="flex justify-end">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Edit Appointment
            </button>
          </div>
        )
      }
    >
      <div className="space-y-6">
        {/* Basic info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
            <CalendarDays className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {pet?.name ?? 'Pet'} - {client ? `${client.firstName} ${client.lastName}` : 'Client'}
            </h3>
            <p className="text-gray-500 capitalize">{appointment.type} • {appointment.status}</p>
            <p className="text-sm text-gray-500 mt-1">
              {appointment.date} {appointment.time} • {appointment.duration} min
            </p>
            {appointment.veterinarian && (
              <p className="text-sm text-teal-600 mt-1">Vet: {appointment.veterinarian}</p>
            )}
          </div>
        </div>

        {/* Payment */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Payment
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="font-medium">${total.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Paid</p>
              <p className="font-medium text-green-600">${paid.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Due</p>
              <p className={`font-medium ${due > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                ${due.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Medications sold */}
        {saleItems.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <Pill className="w-4 h-4" /> Medications Sold
            </h4>
            <ul className="space-y-2">
              {saleItems.map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span>{getItemName(item.inventoryId)} x {item.quantity}</span>
                  <span>${(item.quantity * item.unitPrice).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Medical record (historial médico) */}
        {medicalRecord && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Medical Record
            </h4>
            <div className="space-y-3 text-sm">
              {medicalRecord.symptoms && (
                <div>
                  <p className="text-gray-500">Symptoms</p>
                  <p className="text-gray-800">{medicalRecord.symptoms}</p>
                </div>
              )}
              {medicalRecord.diagnosis && (
                <div>
                  <p className="text-gray-500">Diagnosis</p>
                  <p className="text-gray-800">{medicalRecord.diagnosis}</p>
                </div>
              )}
              {medicalRecord.treatment && (
                <div>
                  <p className="text-gray-500">Treatment</p>
                  <p className="text-gray-800">{medicalRecord.treatment}</p>
                </div>
              )}
              {medicalRecord.notes && (
                <div>
                  <p className="text-gray-500">Notes</p>
                  <p className="text-gray-800">{medicalRecord.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Attachments (PDFs, images - estudios médicos, rayos X) */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <Paperclip className="w-4 h-4" /> Adjuntos
          </h4>
          {onAttachmentUpload && (
            <div className="mb-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-2 text-sm bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 disabled:opacity-50"
              >
                {uploading ? 'Subiendo...' : '+ Subir PDF o imagen'}
              </button>
            </div>
          )}
          {attachments.length === 0 ? (
            <p className="text-sm text-gray-500">No hay adjuntos</p>
          ) : (
            <div className="space-y-2">
              {attachments.map((att) => (
                <div key={att.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  {isImage(att.fileType, att.fileName) ? (
                    <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center gap-2 min-w-0">
                      <img src={att.fileUrl} alt={att.fileName} className="w-12 h-12 object-cover rounded" />
                      <span className="text-sm truncate">{att.fileName}</span>
                      <ExternalLink className="w-4 h-4 shrink-0 text-teal-600" />
                    </a>
                  ) : (
                    <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center gap-2 text-sm text-teal-600 hover:underline truncate">
                      {att.fileName}
                      <ExternalLink className="w-4 h-4 shrink-0" />
                    </a>
                  )}
                  {onAttachmentDelete && att.id && (
                    <button
                      type="button"
                      onClick={() => onAttachmentDelete(att.id!)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {appointment.notes && (
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500">Appointment Notes</p>
            <p className="text-gray-800">{appointment.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
