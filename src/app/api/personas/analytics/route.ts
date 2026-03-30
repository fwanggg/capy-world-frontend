import { getPersonasAnalytics } from '@/lib/personas-analytics'

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const createdAfter = url.searchParams.get('createdAfter') || undefined

  const analytics = await getPersonasAnalytics(createdAfter)
  return Response.json(analytics, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
