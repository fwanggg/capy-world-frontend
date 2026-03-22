import { getPersonasAnalytics } from '@/lib/personas-analytics'

export async function GET(): Promise<Response> {
  const analytics = await getPersonasAnalytics()
  return Response.json(analytics, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
