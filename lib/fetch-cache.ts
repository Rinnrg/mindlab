/**
 * Client-side fetch cache with deduplication
 * Prevents multiple identical requests firing at the same time
 * and caches responses for a configurable TTL
 */

interface CacheEntry {
  data: any
  timestamp: number
}

const cache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<any>>()

const DEFAULT_TTL = 60 * 1000 // 1 minute default

/**
 * Cached fetch — deduplicates in-flight requests and caches responses
 */
export async function cachedFetch(
  url: string,
  options?: RequestInit & { cacheTTL?: number }
): Promise<Response> {
  const { cacheTTL = DEFAULT_TTL, ...fetchOptions } = options || {}
  const cacheKey = `${url}:${JSON.stringify(fetchOptions.body || '')}`

  // Check cache first
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < cacheTTL) {
    return new Response(JSON.stringify(cached.data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Check if there's already an in-flight request for this URL
  const existing = inflight.get(cacheKey)
  if (existing) {
    const data = await existing
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Create the fetch promise
  const fetchPromise = fetch(url, fetchOptions)
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      // Cache the result
      cache.set(cacheKey, { data, timestamp: Date.now() })
      return data
    })
    .finally(() => {
      inflight.delete(cacheKey)
    })

  inflight.set(cacheKey, fetchPromise)

  const data = await fetchPromise
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Invalidate cache entries matching a pattern
 */
export function invalidateCache(pattern?: string) {
  if (!pattern) {
    cache.clear()
    return
  }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  }
}

/**
 * Simple cached JSON fetch — returns parsed data directly
 */
export async function fetchJSON<T = any>(
  url: string,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  const cacheKey = url

  // Check cache
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data as T
  }

  // Deduplicate
  const existing = inflight.get(cacheKey)
  if (existing) {
    return existing as Promise<T>
  }

  const promise = fetch(url)
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      cache.set(cacheKey, { data, timestamp: Date.now() })
      return data as T
    })
    .finally(() => {
      inflight.delete(cacheKey)
    })

  inflight.set(cacheKey, promise)
  return promise
}
