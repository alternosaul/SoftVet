import React from 'react'
import { Card } from '../ui/Card'

export interface StatsCardProps {
  title: string
  value: number | string
  icon?: React.ReactNode
  change?: {
    value: number
    isPositive: boolean
  }
  color?: 'teal' | 'orange' | 'blue' | 'green' | 'red' | 'purple'
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  change,
  color = 'teal'
}) => {
  const colorClasses = {
    teal: {
      bg: 'bg-vet-teal/10',
      text: 'text-vet-teal',
      ring: 'ring-vet-teal/20'
    },
    orange: {
      bg: 'bg-orange-500/10',
      text: 'text-orange-500',
      ring: 'ring-orange-500/20'
    },
    blue: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-500',
      ring: 'ring-blue-500/20'
    },
    green: {
      bg: 'bg-green-500/10',
      text: 'text-green-500',
      ring: 'ring-green-500/20'
    },
    red: {
      bg: 'bg-red-500/10',
      text: 'text-red-500',
      ring: 'ring-red-500/20'
    },
    purple: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-500',
      ring: 'ring-purple-500/20'
    }
  }

  return (
    <Card hover>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          
          {change && (
            <div className="flex items-center mt-2">
              <span 
                className={`
                  inline-flex items-center text-sm font-medium
                  ${change.isPositive ? 'text-green-600' : 'text-red-600'}
                `}
              >
                <svg 
                  className={`w-4 h-4 mr-1 ${change.isPositive ? '' : 'rotate-180'}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 10l7-7m0 0l7 7m-7-7v18" 
                  />
                </svg>
                {Math.abs(change.value)}%
              </span>
              <span className="text-sm text-gray-400 ml-2">vs last month</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className={`
            p-3 rounded-xl ${colorClasses[color].bg}
          `}>
            <div className={colorClasses[color].text}>
              {icon}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

export interface StatsCardsProps {
  totalAppointments: number
  totalClients: number
  totalPets: number
  todayAppointments: number
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  totalAppointments,
  totalClients,
  totalPets,
  todayAppointments
}) => {
  const AppointmentIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )

  const ClientIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )

  const PetIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  )

  const CalendarIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title="Total Appointments"
        value={totalAppointments}
        icon={<AppointmentIcon />}
        color="teal"
      />
      <StatsCard
        title="Total Clients"
        value={totalClients}
        icon={<ClientIcon />}
        color="blue"
      />
      <StatsCard
        title="Total Pets"
        value={totalPets}
        icon={<PetIcon />}
        color="orange"
      />
      <StatsCard
        title="Today's Appointments"
        value={todayAppointments}
        icon={<CalendarIcon />}
        color="green"
      />
    </div>
  )
}

export default StatsCards
