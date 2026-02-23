import { useState, useEffect } from 'react'
import { User, Bell, Link, Palette, DollarSign, Database } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { getAllSettings, setSetting } from '../db/supabase'

// Default prices for appointment types (used in Settings and when creating appointments)
const PRICE_KEYS = [
  { key: 'price_consultation', label: 'Consultation' },
  { key: 'price_vaccination', label: 'Vaccination' },
  { key: 'price_surgery', label: 'Surgery' },
  { key: 'price_grooming', label: 'Grooming' },
  { key: 'price_emergency', label: 'Emergency' },
  { key: 'price_follow-up', label: 'Follow-up' }
] as const

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile')
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [pricesSaving, setPricesSaving] = useState(false)

  // Load settings when Pricing tab is active
  useEffect(() => {
    if (activeTab === 'pricing') {
      getAllSettings().then(settings => {
        const map: Record<string, string> = {}
        for (const p of PRICE_KEYS) {
          const s = settings.find(x => x.key === p.key)
          map[p.key] = s?.value ?? ''
        }
        setPrices(map)
      }).catch(() => {})
    }
  }, [activeTab])

  const handleSavePrices = async () => {
    setPricesSaving(true)
    try {
      for (const { key } of PRICE_KEYS) {
        const val = prices[key]
        if (val !== undefined && val !== '') await setSetting(key, val)
      }
    } finally {
      setPricesSaving(false)
    }
  }

  const { user } = useAuthStore()
  const { theme, setTheme } = useUIStore()

  const renderTabContent = () => {
    if (activeTab === 'pricing') {
      return (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">Default Prices</h2>
          <p className="text-sm text-gray-500">
            Set default prices for each appointment type. These are used when creating new appointments.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRICE_KEYS.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={prices[key] ?? ''}
                  onChange={(e) => setPrices(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleSavePrices}
            disabled={pricesSaving}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            {pricesSaving ? 'Saving...' : 'Save Prices'}
          </button>
        </div>
      )
    }
    if (activeTab === 'data') {
      return (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">Data Connection</h2>
          <p className="text-sm text-gray-500">
            If you see data in Supabase Table Editor but not in the app, your data may have a different user_id.
            Supabase Row Level Security (RLS) only shows rows where user_id matches your logged-in user.
            Only run the SQL below if this is your own data (e.g. test data inserted via SQL Editor).
          </p>
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <p className="text-sm font-medium text-gray-700">Your User ID (use this in SQL):</p>
            <code className="block p-2 bg-white border rounded text-xs break-all font-mono">
              {user?.id ?? 'Not logged in'}
            </code>
            <p className="text-sm text-gray-600 mt-3">
              To assign existing data to your account, run this in Supabase SQL Editor (replace YOUR_USER_ID):
            </p>
            <pre className="p-3 bg-white border rounded text-xs overflow-x-auto">
              {`-- Replace YOUR_USER_ID with the UUID above
UPDATE clients SET user_id = 'YOUR_USER_ID'::uuid;
UPDATE pets SET user_id = 'YOUR_USER_ID'::uuid;
UPDATE appointments SET user_id = 'YOUR_USER_ID'::uuid;
UPDATE settings SET user_id = 'YOUR_USER_ID'::uuid;
-- If you ran migration 002:
UPDATE inventory SET user_id = 'YOUR_USER_ID'::uuid;
UPDATE sale_items SET user_id = 'YOUR_USER_ID'::uuid;
-- If you ran migration 003:
UPDATE medical_records SET user_id = 'YOUR_USER_ID'::uuid;
UPDATE vaccines SET user_id = 'YOUR_USER_ID'::uuid;`}
            </pre>
          </div>
        </div>
      )
    }
    if (activeTab === 'profile') {
      return (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">Profile Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
              <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Your clinic name" />
            </div>
          </div>
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Save Changes</button>
        </div>
      )
    }
    if (activeTab === 'notifications') {
      return (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">Notification Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive email reminders for appointments</p>
              </div>
              <input type="checkbox" className="w-5 h-5 text-teal-600 rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">Desktop Notifications</p>
                <p className="text-sm text-gray-500">Show desktop notifications for upcoming appointments</p>
              </div>
              <input type="checkbox" className="w-5 h-5 text-teal-600 rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">SMS Notifications</p>
                <p className="text-sm text-gray-500">Send SMS reminders to clients</p>
              </div>
              <input type="checkbox" className="w-5 h-5 text-teal-600 rounded" />
            </div>
          </div>
        </div>
      )
    }
    if (activeTab === 'integrations') {
      return (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">Integrations</h2>
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold">G</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Google Calendar</p>
                    <p className="text-sm text-gray-500">Sync appointments with Google Calendar</p>
                  </div>
                </div>
                <button className="px-4 py-2 text-teal-600 border border-teal-600 rounded-lg hover:bg-teal-50">Connect</button>
              </div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 font-bold">G</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Gmail</p>
                    <p className="text-sm text-gray-500">Send email notifications to clients</p>
                  </div>
                </div>
                <button className="px-4 py-2 text-teal-600 border border-teal-600 rounded-lg hover:bg-teal-50">Connect</button>
              </div>
            </div>
          </div>
        </div>
      )
    }
    if (activeTab === 'appearance') {
      return (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Appearance</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex-1 p-4 rounded-lg transition-colors ${
                    theme === 'light'
                      ? 'border-2 border-teal-600 bg-teal-50 dark:bg-teal-900/20'
                      : 'border border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="w-full h-8 bg-white dark:bg-gray-100 rounded border border-gray-200 dark:border-gray-600 mb-2"></div>
                  <p className="text-sm font-medium text-center">Light</p>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex-1 p-4 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'border-2 border-teal-600 bg-teal-50 dark:bg-teal-900/20'
                      : 'border border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="w-full h-8 bg-gray-800 rounded mb-2"></div>
                  <p className="text-sm font-medium text-center">Dark</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Link },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}
