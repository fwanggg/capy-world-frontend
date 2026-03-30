import { supabase } from './supabase'
import { log } from './logging'

interface Interest {
  name: string
  confidence?: number
}

export interface PersonasAnalytics {
  totalActive: number
  liveClusters: number
  totalDataPoints: number
  interests: Array<{ label: string; percent: number }>
  totalUniqueInterests: number
  professions: Array<{ label: string; count: string }>
  totalUniqueProfessions: number
  ageGroups: Record<string, number>
  demographics: Array<{ label: string; count: number }>
}

const EMPTY_ANALYTICS: PersonasAnalytics = {
  totalActive: 0,
  liveClusters: 0,
  totalDataPoints: 0,
  interests: [],
  totalUniqueInterests: 0,
  professions: [],
  totalUniqueProfessions: 0,
  ageGroups: { '18-24': 0, '25-34': 0, '35-44': 0, '45+': 0, 'Not Specified': 0 },
  demographics: [
    { label: 'Male', count: 0 },
    { label: 'Female', count: 0 },
    { label: 'Not Specified', count: 0 },
  ],
}

/**
 * Compute personas analytics from Supabase. Use this directly from page or API — no HTTP fetch.
 * @param createdAfter - Optional ISO date string to filter personas created after this date
 */
export async function getPersonasAnalytics(createdAfter?: string): Promise<PersonasAnalytics> {
  const startMs = Date.now()
  try {
    log.info('personas_analytics_start', 'Personas analytics invoked', {
      metadata: { supabaseUrlSet: !!process.env.SUPABASE_URL, supabaseKeySet: !!process.env.SUPABASE_ANON_KEY },
    })

    let allPersonas: Array<{
      age?: number
      gender?: string
      profession?: string
      interests?: Interest[] | string[]
      spending_power?: string
    }> = []
    let offset = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
      let query = supabase
        .from('personas')
        .select('age, gender, profession, interests, spending_power')

      if (createdAfter) {
        query = query.gt('created_at', createdAfter)
      }

      const { data: batch, error } = await query.range(offset, offset + pageSize - 1)

      if (error) {
        log.error('personas_analytics_fetch_error', 'Supabase personas fetch failed', {
          metadata: { error: error.message, code: error.code, offset },
        })
        return EMPTY_ANALYTICS
      }

      if (!batch || batch.length === 0) {
        if (offset === 0) {
          log.info('personas_analytics_empty', 'Personas table returned 0 rows', { metadata: { batchCount: 0 } })
        }
        hasMore = false
      } else {
        allPersonas = allPersonas.concat(batch)
        if (batch.length < pageSize) hasMore = false
        offset += pageSize
      }
    }

    const personas = allPersonas
    const durationMs = Date.now() - startMs

    if (!personas || personas.length === 0) {
      log.warn('personas_analytics_zero', 'No personas found', {
        metadata: { totalBatches: Math.ceil(offset / pageSize) || 1, durationMs },
      })
      return EMPTY_ANALYTICS
    }

    const totalActive = personas.length
    const liveClusters = Math.ceil(totalActive / 300)

    const interestCounts: Record<string, number> = {}
    personas.forEach((p) => {
      if (Array.isArray(p.interests)) {
        p.interests.forEach((interest: Interest | string) => {
          const interestName = typeof interest === 'string' ? interest : interest?.name
          if (interestName) interestCounts[interestName] = (interestCounts[interestName] || 0) + 1
        })
      }
    })

    const interests = Object.entries(interestCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([label, count]) => ({ label, percent: Math.round((count / totalActive) * 100) }))

    const professionCounts: Record<string, number> = {}
    personas.forEach((p) => {
      if (p.profession) {
        const normalized = p.profession.toLowerCase().replace(/[-_]/g, ' ').trim()
        professionCounts[normalized] = (professionCounts[normalized] || 0) + 1
      }
    })

    const professions = Object.entries(professionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([label, count]) => ({
        label: label
          .split(/[\s-]+/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        count: count > 999 ? `${(count / 1000).toFixed(1)}k` : String(count),
      }))

    const ageGroupRanges: Record<string, number> = {
      '18-24': 0,
      '25-34': 0,
      '35-44': 0,
      '45+': 0,
      'Not Specified': 0,
    }
    personas.forEach((p) => {
      if (typeof p.age === 'number') {
        if (p.age < 25) ageGroupRanges['18-24']++
        else if (p.age < 35) ageGroupRanges['25-34']++
        else if (p.age < 45) ageGroupRanges['35-44']++
        else ageGroupRanges['45+']++
      } else {
        ageGroupRanges['Not Specified']++
      }
    })

    const genderCounts: Record<string, number> = { Male: 0, Female: 0, 'Not Specified': 0 }
    personas.forEach((p) => {
      if (p.gender === 'male') genderCounts['Male']++
      else if (p.gender === 'female') genderCounts['Female']++
      else genderCounts['Not Specified']++
    })

    const demographics = Object.entries(genderCounts).map(([label, count]) => ({ label, count }))

    log.info('personas_analytics_success', `Analytics for ${totalActive} personas`, {
      metadata: {
        totalActive,
        liveClusters,
        totalUniqueInterests: Object.keys(interestCounts).length,
        totalUniqueProfessions: Object.keys(professionCounts).length,
        durationMs: Date.now() - startMs,
      },
    })

    return {
      totalActive,
      liveClusters,
      totalDataPoints: 4800000,
      interests,
      totalUniqueInterests: Object.keys(interestCounts).length,
      professions,
      totalUniqueProfessions: Object.keys(professionCounts).length,
      ageGroups: ageGroupRanges,
      demographics,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log.error('personas_analytics_error', `Unexpected error: ${msg}`, {
      metadata: { error: String(err), durationMs: Date.now() - startMs },
    })
    return EMPTY_ANALYTICS
  }
}
