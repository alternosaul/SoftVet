import React, { useState, useRef, useEffect } from 'react'

export interface TimePickerProps {
  label?: string
  error?: string
  helperText?: string
  value?: string
  onChange?: (time: string) => void
  minuteInterval?: 5 | 10 | 15 | 30 | 60
  startTime?: string
  endTime?: string
  disabled?: boolean
  className?: string
}

export const TimePicker: React.FC<TimePickerProps> = ({
  label,
  error,
  helperText,
  value,
  onChange,
  minuteInterval = 30,
  startTime = '08:00',
  endTime = '20:00',
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string>(value || '')
  const containerRef = useRef<HTMLDivElement>(null)

  // Generate time slots based on interval
  const generateTimeSlots = () => {
    const slots: string[] = []
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    
    let currentHour = startHour
    let currentMin = startMin
    
    while (
      currentHour < endHour || 
      (currentHour === endHour && currentMin <= endMin)
    ) {
      slots.push(
        `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`
      )
      
      currentMin += minuteInterval
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60)
        currentMin = currentMin % 60
      }
    }
    
    return slots
  }

  const timeSlots = generateTimeSlots()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    onChange?.(time)
    setIsOpen(false)
  }

  const formatDisplayTime = (time: string) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatInputValue = (timeValue?: string) => {
    if (!timeValue) return ''
    return formatDisplayTime(timeValue)
  }

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          type="text"
          readOnly
          value={formatInputValue(value)}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          placeholder="Select a time"
          disabled={disabled}
          className={`
            w-full rounded-lg border bg-gray-50 px-4 py-2.5
            transition-colors duration-200 cursor-pointer
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
              : 'border-gray-200 focus:border-vet-teal focus:ring-vet-teal/20'
            }
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        />
        
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
          {timeSlots.map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => handleTimeSelect(time)}
              className={`
                w-full px-4 py-2 text-left text-sm
                transition-colors duration-150
                ${selectedTime === time || value === time
                  ? 'bg-vet-teal text-white'
                  : 'hover:bg-gray-100 text-gray-700'
                }
              `}
            >
              {formatDisplayTime(time)}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  )
}

export default TimePicker
