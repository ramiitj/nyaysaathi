import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ============ RATE LIMITING ============
interface RateLimitEntry {
  count: number;
  windowStart: number;
}
const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT = { windowMs: 60000, maxRequests: 10 };

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('cf-connecting-ip') ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

function checkRateLimit(identifier: string): { allowed: boolean; resetIn: number } {
  const now = Date.now();
  const key = `conv:${identifier}`;
  let entry = rateLimitStore.get(key);
  
  if (rateLimitStore.size > 10000) {
    const cutoff = now - RATE_LIMIT.windowMs * 2;
    for (const [k, v] of rateLimitStore) {
      if (v.windowStart < cutoff) rateLimitStore.delete(k);
    }
  }
  
  if (!entry || now - entry.windowStart >= RATE_LIMIT.windowMs) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return { allowed: true, resetIn: RATE_LIMIT.windowMs };
  }
  
  if (entry.count >= RATE_LIMIT.maxRequests) {
    return { allowed: false, resetIn: RATE_LIMIT.windowMs - (now - entry.windowStart) };
  }
  
  entry.count++;
  return { allowed: true, resetIn: RATE_LIMIT.windowMs - (now - entry.windowStart) };
}

// ============ INPUT VALIDATION ============
const VALID_LANGUAGES = ['HI', 'EN', 'BN', 'TA', 'TE', 'MR', 'GU', 'KN', 'ML', 'PA', 'OR', 'UR'];

function sanitizeString(str: string, maxLength = 100): string {
  if (!str) return '';
  return str.slice(0, maxLength).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

function validateInput(body: any): { valid: boolean; language?: string; locationState?: string; locationCity?: string; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { language, locationState, locationCity } = body;

  let validatedLanguage = 'EN';
  if (language && typeof language === 'string') {
    if (!VALID_LANGUAGES.includes(language.toUpperCase())) {
      return { valid: false, error: 'Invalid language code' };
    }
    validatedLanguage = language.toUpperCase();
  }

  return { 
    valid: true, 
    language: validatedLanguage,
    locationState: locationState ? sanitizeString(locationState, 100) : undefined,
    locationCity: locationCity ? sanitizeString(locationCity, 100) : undefined,
  };
}

// Simple hash function for IP anonymization
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + 'nyay-saathi-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP.substring(0, 8)}...`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.', retryAfter: Math.ceil(rateLimit.resetIn / 1000) }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)) } }
      );
    }

    // Parse and validate input
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validation = validateInput(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { language, locationState, locationCity } = validation;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generate anonymous session ID
    const sessionId = crypto.randomUUID();

    // Hash the client IP for privacy
    const ipHash = await hashIP(clientIP);

    // Create conversation record
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        session_id: sessionId,
        language: language || 'EN',
        location_state: locationState,
        location_city: locationCity,
        ip_hash: ipHash,
        status: 'open',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create conversation:', error);
      throw new Error('Failed to create conversation');
    }

    // Log analytics event
    await supabase.from('analytics_events').insert({
      event_type: 'consultation_start',
      conversation_id: conversation.id,
      language: language || 'EN',
      location_state: locationState
    });

    console.log('Created conversation:', conversation.id);

    return new Response(
      JSON.stringify({ 
        conversationId: conversation.id,
        sessionId: sessionId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error creating conversation:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
