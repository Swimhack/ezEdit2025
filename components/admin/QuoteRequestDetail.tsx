'use client'

import { useState, useEffect } from 'react'
import { QuoteRequestDisplay } from '@/types/admin'

interface Props {
  request: QuoteRequestDisplay
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export default function QuoteRequestDetail({ request, isOpen, onClose, onUpdate }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const [formData, setFormData] = useState({
    status: request.status,
    admin_notes: request.adminNotes || '',
    quoted_price: request.quotedPrice?.toString() || '',
    quoted_timeline: request.quotedTimeline || '',
    customer_email: request.customerEmail || ''
  })

  useEffect(() => {
    // Reset form when request changes
    setFormData({
      status: request.status,
      admin_notes: request.adminNotes || '',
      quoted_price: request.quotedPrice?.toString() || '',
      quoted_timeline: request.quotedTimeline || '',
      customer_email: request.customerEmail || ''
    })
    setIsEditing(false)
  }, [request])

  if (!isOpen) return null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updates: any = {
        status: formData.status,
        admin_notes: formData.admin_notes || null,
        customer_email: formData.customer_email || null
      }

      if (formData.quoted_price) {
        updates.quoted_price = parseFloat(formData.quoted_price)
      }
      if (formData.quoted_timeline) {
        updates.quoted_timeline = formData.quoted_timeline
      }

      const response = await fetch(`/api/admin/quote-requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Failed to update quote request')
      }

      setIsEditing(false)
      onUpdate()
    } catch (error) {
      console.error('Error updating quote request:', error)
      alert('Failed to update quote request')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/quote-requests/${request.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete quote request')
      }

      onUpdate()
      onClose()
    } catch (error) {
      console.error('Error deleting quote request:', error)
      alert('Failed to delete quote request')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'reviewed': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'quoted': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'accepted': return 'bg-green-100 text-green-800 border-green-300'
      case 'declined': return 'bg-red-100 text-red-800 border-red-300'
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Quote Request Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Domain</label>
              <p className="text-lg font-semibold text-gray-900">{request.domain}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Message</label>
              <p className="text-gray-900 whitespace-pre-wrap">{request.message}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-gray-900">
                  {new Date(request.createdAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Request ID</label>
                <p className="text-xs text-gray-600 font-mono">{request.id}</p>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              {isEditing ? (
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="quoted">Quoted</option>
                  <option value="accepted">Accepted</option>
                  <option value="declined">Declined</option>
                  <option value="completed">Completed</option>
                </select>
              ) : (
                <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(request.status)}`}>
                  {request.status}
                </span>
              )}
            </div>

            {/* Customer Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  placeholder="customer@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{request.customerEmail || 'Not provided'}</p>
              )}
            </div>

            {/* Quoted Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quoted Price</label>
              {isEditing ? (
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quoted_price}
                    onChange={(e) => setFormData({ ...formData, quoted_price: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <p className="text-gray-900">
                  {request.quotedPrice ? `$${request.quotedPrice.toFixed(2)}` : 'Not quoted yet'}
                </p>
              )}
            </div>

            {/* Quoted Timeline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Timeline</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.quoted_timeline}
                  onChange={(e) => setFormData({ ...formData, quoted_timeline: e.target.value })}
                  placeholder="e.g., 2-3 weeks"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{request.quotedTimeline || 'Not estimated yet'}</p>
              )}
            </div>

            {/* Admin Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
              {isEditing ? (
                <textarea
                  value={formData.admin_notes}
                  onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
                  placeholder="Internal notes about this quote request..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-wrap">
                  {request.adminNotes || 'No notes yet'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-between items-center">
          <div>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md font-medium"
                disabled={isDeleting || isSaving}
              >
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Are you sure?</span>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      status: request.status,
                      admin_notes: request.adminNotes || '',
                      quoted_price: request.quotedPrice?.toString() || '',
                      quoted_timeline: request.quotedTimeline || '',
                      customer_email: request.customerEmail || ''
                    })
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
