import { supabase } from '@/lib/supabase'

interface PersonasAnalytics {
  totalActive: number
  liveClusters: number
  totalDataPoints: number
  interests: Array<{ label: string; percent: number }>
  professions: Array<{ label: string; count: string }>
  ageGroups: Record<string, number>
  demographics: Array<{ label: string; percent: number }>
}

export async function GET(): Promise<Response> {
  try {
    // Fetch all personas with demographics
    const { data: personas, error } = await supabase
      .from('personas')
      .select('age, gender, profession, interests, spending_power')

    if (error) {
      console.error('[API] Personas fetch error:', error)
      return Response.json({ error: 'Failed to fetch personas' }, { status: 500 })
    }

    if (!personas || personas.length === 0) {
      return Response.json({
        totalActive: 0,
        liveClusters: 0,
        totalDataPoints: 0,
        interests: [],
        professions: [],
        ageGroups: {},
        demographics: [],
      })
    }

    // Calculate metrics
    const totalActive = personas.length
    const liveClusters = Math.ceil(totalActive / 300) // ~300 personas per cluster

    // Interest distribution
    const interestCounts: Record<string, number> = {}
    personas.forEach((p) => {
      if (Array.isArray(p.interests)) {
        p.interests.forEach((interest: string) => {
          interestCounts[interest] = (interestCounts[interest] || 0) + 1
        })
      }
    })

    const interests = Object.entries(interestCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([label, count]) => ({
        label,
        percent: Math.round((count / totalActive) * 100),
      }))

    // Profession breakdown
    const professionCounts: Record<string, number> = {}
    personas.forEach((p) => {
      if (p.profession) {
        professionCounts[p.profession] = (professionCounts[p.profession] || 0) + 1
      }
    })

    const professions = Object.entries(professionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([label, count]) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        count: count > 999 ? `${(count / 1000).toFixed(1)}k` : String(count),
      }))

    // Age groups
    const ageGroupRanges = {
      '18-24': 0,
      '25-34': 0,
      '35-44': 0,
      '45+': 0,
    }

    personas.forEach((p) => {
      if (typeof p.age === 'number') {
        if (p.age < 25) ageGroupRanges['18-24']++
        else if (p.age < 35) ageGroupRanges['25-34']++
        else if (p.age < 45) ageGroupRanges['35-44']++
        else ageGroupRanges['45+']++
      }
    })

    // Gender demographics
    const genderCounts: Record<string, number> = { Male: 0, Female: 0, Other: 0 }
    personas.forEach((p) => {
      if (p.gender === 'male') genderCounts['Male']++
      else if (p.gender === 'female') genderCounts['Female']++
      else genderCounts['Other']++
    })

    const demographics = Object.entries(genderCounts).map(([label, count]) => ({
      label,
      percent: Math.round((count / totalActive) * 100),
    }))

    const analytics: PersonasAnalytics = {
      totalActive,
      liveClusters,
      totalDataPoints: 4800000,
      interests,
      professions,
      ageGroups: ageGroupRanges,
      demographics,
    }

    return Response.json(analytics, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[API] Unexpected error:', msg)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
