export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      vehicles: {
        Row: {
          id: string
          plate: string
          brand: string
          model: string
          year: number
          color: string | null
          status: 'available' | 'in_maintenance' | 'unavailable'
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          plate: string
          brand: string
          model: string
          year: number
          color?: string | null
          status?: 'available' | 'in_maintenance' | 'unavailable'
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          plate?: string
          brand?: string
          model?: string
          year?: number
          color?: string | null
          status?: 'available' | 'in_maintenance' | 'unavailable'
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      maintenance_orders: {
        Row: {
          id: string
          vehicle_id: string
          order_number: string
          description: string
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority: number
          estimated_hours: number | null
          actual_hours: number | null
          start_date: string | null
          end_date: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          completed_by: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          vehicle_id: string
          order_number: string
          description: string
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority?: number
          estimated_hours?: number | null
          actual_hours?: number | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          completed_by?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          vehicle_id?: string
          order_number?: string
          description?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority?: number
          estimated_hours?: number | null
          actual_hours?: number | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          completed_by?: string | null
          notes?: string | null
        }
      }
      maintenance_timeline: {
        Row: {
          id: string
          maintenance_order_id: string
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          changed_at: string
          changed_by: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          maintenance_order_id: string
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          changed_at?: string
          changed_by?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          maintenance_order_id?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          changed_at?: string
          changed_by?: string | null
          notes?: string | null
        }
      }
      vehicle_downtime: {
        Row: {
          id: string
          vehicle_id: string
          maintenance_order_id: string | null
          start_time: string
          end_time: string | null
          downtime_hours: number | null
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          maintenance_order_id?: string | null
          start_time: string
          end_time?: string | null
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          maintenance_order_id?: string | null
          start_time?: string
          end_time?: string | null
          reason?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      v_vehicles_in_maintenance: {
        Row: {
          id: string | null
          plate: string | null
          brand: string | null
          model: string | null
          year: number | null
          order_number: string | null
          description: string | null
          status: string | null
          start_date: string | null
          estimated_hours: number | null
          hours_in_maintenance: number | null
        }
      }
      v_vehicle_downtime_summary: {
        Row: {
          vehicle_id: string | null
          plate: string | null
          brand: string | null
          model: string | null
          total_downtime_events: number | null
          total_downtime_hours: number | null
          avg_downtime_hours: number | null
          max_downtime_hours: number | null
        }
      }
      v_maintenance_performance: {
        Row: {
          id: string | null
          order_number: string | null
          plate: string | null
          description: string | null
          status: string | null
          estimated_hours: number | null
          actual_hours: number | null
          variance_percentage: number | null
          start_date: string | null
          end_date: string | null
          total_elapsed_hours: number | null
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      maintenance_status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
      vehicle_status: 'available' | 'in_maintenance' | 'unavailable'
    }
  }
}
