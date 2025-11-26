export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Listing {
  id: string
  address: string
  price: number
  description: string | null
  images_json: string[]
  source_url: string | null
  contact_email: string
  listing_type: 'rent' | 'sale'
  created_at: string
}

export interface AvailabilityWindow {
  id: string
  listing_id: string
  day_of_week: number
  start_time: string // Format "HH:MM:SS"
  end_time: string // Format "HH:MM:SS"
  start_date: string | null
  end_date: string | null
  created_at: string
}

export interface Appointment {
  id: string
  listing_id: string
  tenant_user_id: string
  start_time: string // ISO string
  end_time: string // ISO string
  status: 'pending' | 'confirmed' | 'cancelled'
  created_at: string
}

export interface TimeSlot {
  start: Date
  end: Date
  available: boolean
}

