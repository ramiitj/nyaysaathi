// Simple in-memory rate limiter for edge functions
// Tracks requests per IP with sliding window

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

// Default limits per function type
export const RATE_LIMITS = {
  'legal-chat': { windowMs: 60000, maxRequests: 30 },
  'speech-to-text': { windowMs: 60000, maxRequests: 30 },
  'text-to-speech': { windowMs: 60000, maxRequests: 20 },
  'process-document': { windowMs: 60000, maxRequests: 5 },
  'create-conversation': { windowMs: 60000, maxRequests: 10 },
  'process-user-file': { windowMs: 60000, maxRequests: 5 },
} as const;

export function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('cf-connecting-ip') ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

export function checkRateLimit(
  identifier: string,
  functionName: keyof typeof RATE_LIMITS
): { allowed: boolean; remaining: number; resetIn: number } {
  const config = RATE_LIMITS[functionName];
  const now = Date.now();
  const key = `${functionName}:${identifier}`;
  
  let entry = rateLimitStore.get(key);
  
  // Clean up old entries periodically
  if (rateLimitStore.size > 10000) {
    const cutoff = now - config.windowMs * 2;
    for (const [k, v] of rateLimitStore) {
      if (v.windowStart < cutoff) {
        rateLimitStore.delete(k);
      }
    }
  }
  
  if (!entry || now - entry.windowStart >= config.windowMs) {
    // New window
    entry = { count: 1, windowStart: now };
    rateLimitStore.set(key, entry);
    return { 
      allowed: true, 
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs
    };
  }
  
  if (entry.count >= config.maxRequests) {
    const resetIn = config.windowMs - (now - entry.windowStart);
    return { 
      allowed: false, 
      remaining: 0,
      resetIn
    };
  }
  
  entry.count++;
  return { 
    allowed: true, 
    remaining: config.maxRequests - entry.count,
    resetIn: config.windowMs - (now - entry.windowStart)
  };
}

export function rateLimitResponse(resetIn: number, corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ 
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(resetIn / 1000)
    }),
    { 
      status: 429, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil(resetIn / 1000))
      } 
    }
  );
}
