import { createClient } from '@supabase/supabase-js'

// Configuración específica para desarrollo
const isDevelopment = import.meta.env.DEV
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://awnudpkaqgyadfvjvacf.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3bnVkcGthcWd5YWRmdmp2YWNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNDA3OTcsImV4cCI6MjA2NDkxNjc5N30.mGDeJyhT3ew9ADPk0rlpIlUvMq_hfFDnlvIUhpEb2D8'

// Configuración específica para desarrollo
const devConfig = {
  auth: {
    persistSession: false, // Desactivar persistencia en desarrollo
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storage: undefined
  },
  global: {
    headers: {
      'X-Client-Info': 'nexus-vending-management-dev'
    }
  }
}

// Configuración para producción
const prodConfig = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'nexus-supabase-auth-token'
  },
  global: {
    headers: {
      'X-Client-Info': 'nexus-vending-management'
    }
  },
  db: {
    schema: 'public'
  }
}

// Usar configuración según el entorno
const config = isDevelopment ? devConfig : prodConfig

export const supabase = createClient(supabaseUrl, supabaseKey, config)

// Función para verificar la conexión
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('id')
      .limit(1)
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error de conexión:', error)
    return { success: false, error: error.message }
  }
}
