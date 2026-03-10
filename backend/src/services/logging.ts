import { supabase } from 'shared'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogOptions {
  userId?: string
  requestId?: string
  sourceFile?: string
  sourceLine?: number
  metadata?: Record<string, any>
  durationMs?: number
}

/**
 * Get the environment from NODE_ENV or DEV flag
 * Returns 'prod' for production, 'dev' for development
 */
function getEnvironment(): string {
  const nodeEnv = process.env.NODE_ENV
  const isDev = process.env.DEV === 'true'

  if (nodeEnv === 'production') return 'prod'
  if (isDev) return 'dev'
  return nodeEnv?.startsWith('prod') ? 'prod' : 'dev'
}

/**
 * Log an event to the app_log table
 * Also logs to console for immediate visibility in development
 */
export async function logEvent(
  level: LogLevel,
  event: string,
  message: string,
  options?: LogOptions
): Promise<void> {
  const environment = getEnvironment()
  const timestamp = new Date().toISOString()

  // Always log to console for immediate visibility
  const logPrefix = `[${timestamp}] [${level.toUpperCase()}] [${event}]`
  const consoleMessage = `${logPrefix} ${message}${options?.metadata ? ' ' + JSON.stringify(options.metadata) : ''}`

  if (level === 'error') {
    console.error(consoleMessage)
  } else if (level === 'warn') {
    console.warn(consoleMessage)
  } else {
    console.log(consoleMessage)
  }

  // Write to database (async, don't wait for it to avoid blocking requests)
  writeLogToDatabase({
    level,
    environment,
    event,
    message,
    ...options
  }).catch((error) => {
    // If logging itself fails, only log to console to avoid infinite loops
    console.error('[LOGGING] Failed to write log to database:', error instanceof Error ? error.message : String(error))
  })
}

/**
 * Internal function to write logs to the database
 * Runs asynchronously without blocking the main request
 */
async function writeLogToDatabase(
  data: {
    level: LogLevel
    environment: string
    event: string
    message: string
    userId?: string
    requestId?: string
    sourceFile?: string
    sourceLine?: number
    metadata?: Record<string, any>
    durationMs?: number
  }
): Promise<void> {
  try {
    const { error } = await supabase.from('app_log').insert({
      level: data.level,
      environment: data.environment,
      event: data.event,
      message: data.message,
      user_id: data.userId || null,
      request_id: data.requestId || null,
      source_file: data.sourceFile || null,
      source_line: data.sourceLine || null,
      metadata: data.metadata || {},
      duration_ms: data.durationMs || null
    })

    if (error) {
      console.error('[LOGGING] Database insert error:', error)
    }
  } catch (error) {
    console.error('[LOGGING] Unexpected error writing to database:', error instanceof Error ? error.message : String(error))
  }
}

/**
 * Convenience functions for common log levels
 */
export const log = {
  debug: (event: string, message: string, options?: LogOptions) =>
    logEvent('debug', event, message, options),
  info: (event: string, message: string, options?: LogOptions) =>
    logEvent('info', event, message, options),
  warn: (event: string, message: string, options?: LogOptions) =>
    logEvent('warn', event, message, options),
  error: (event: string, message: string, options?: LogOptions) =>
    logEvent('error', event, message, options)
}
