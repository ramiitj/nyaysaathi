import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ============ RATE LIMITING ============
interface RateLimitEntry {
  count: number;
  windowStart: number;
}
const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT = { windowMs: 60000, maxRequests: 30 };

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('cf-connecting-ip') ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

function checkRateLimit(identifier: string): { allowed: boolean; resetIn: number } {
  const now = Date.now();
  const key = `legal-chat:${identifier}`;
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

function sanitizeString(str: string, maxLength = 10000): string {
  if (!str) return '';
  return str.slice(0, maxLength).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

function isValidUUID(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}

interface ValidatedInput {
  message: string;
  conversationId?: string;
  language: string;
  conversationHistory: Array<{ role: string; content: string }>;
  locationState?: string;
  fileContext?: string;
}

function validateInput(body: any): { valid: boolean; data?: ValidatedInput; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { message, conversationId, language, conversationHistory, locationState, fileContext } = body;

  if (typeof message !== 'string' || message.trim().length === 0) {
    return { valid: false, error: 'Message is required' };
  }
  if (message.length > 10000) {
    return { valid: false, error: 'Message exceeds maximum length' };
  }

  if (conversationId !== undefined && conversationId !== null) {
    if (typeof conversationId !== 'string' || !isValidUUID(conversationId)) {
      return { valid: false, error: 'Invalid conversation ID format' };
    }
  }

  let validatedLanguage = 'EN';
  if (language && typeof language === 'string') {
    if (!VALID_LANGUAGES.includes(language.toUpperCase())) {
      return { valid: false, error: 'Invalid language code' };
    }
    validatedLanguage = language.toUpperCase();
  }

  let validatedHistory: Array<{ role: string; content: string }> = [];
  if (conversationHistory && Array.isArray(conversationHistory)) {
    if (conversationHistory.length > 50) {
      return { valid: false, error: 'Conversation history too long' };
    }
    for (const msg of conversationHistory) {
      if (!msg || typeof msg !== 'object' || typeof msg.role !== 'string' || typeof msg.content !== 'string') {
        return { valid: false, error: 'Invalid message in history' };
      }
      if (!['user', 'assistant', 'model'].includes(msg.role)) {
        return { valid: false, error: 'Invalid role in history' };
      }
      validatedHistory.push({
        role: msg.role,
        content: sanitizeString(msg.content, 5000)
      });
    }
  }

  return {
    valid: true,
    data: {
      message: sanitizeString(message),
      conversationId,
      language: validatedLanguage,
      conversationHistory: validatedHistory,
      locationState: locationState ? sanitizeString(locationState, 100) : undefined,
      fileContext: fileContext ? sanitizeString(fileContext, 20000) : undefined,
    }
  };
}

// ============ PII ANONYMIZATION ============
function anonymizePII(text: string): string {
  let anonymized = text;
  
  // Phone numbers: Indian mobile (10 digits, optionally with +91 or 0 prefix)
  anonymized = anonymized.replace(/(\+91[\s-]?)?[6-9]\d{9}/g, '[PHONE]');
  anonymized = anonymized.replace(/\b0[6-9]\d{9}\b/g, '[PHONE]');
  
  // Aadhaar numbers: 12 digits, often in groups of 4
  anonymized = anonymized.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[AADHAAR]');
  
  // PAN numbers: 5 letters, 4 digits, 1 letter (ABCDE1234F)
  anonymized = anonymized.replace(/\b[A-Z]{5}\d{4}[A-Z]\b/gi, '[PAN]');
  
  // Bank account numbers: 9-18 digits
  anonymized = anonymized.replace(/\b\d{9,18}\b/g, (match) => {
    // Preserve if it looks like a year or small number
    if (match.length <= 6) return match;
    return '[ACCOUNT]';
  });
  
  // IFSC codes: 4 letters, 0, 6 alphanumeric
  anonymized = anonymized.replace(/\b[A-Z]{4}0[A-Z0-9]{6}\b/gi, '[IFSC]');
  
  // Credit/Debit card numbers: 16 digits, often in groups of 4
  anonymized = anonymized.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]');
  
  // UPI IDs: word@word pattern
  anonymized = anonymized.replace(/\b[\w.-]+@[\w]+\b/gi, (match) => {
    // Don't mask emails - only UPI IDs
    if (match.includes('.com') || match.includes('.in') || match.includes('.org') || match.includes('.net')) {
      return '[EMAIL]';
    }
    return '[UPI]';
  });
  
  // Email addresses
  anonymized = anonymized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
  
  // Money amounts: ₹ followed by numbers (with optional commas)
  anonymized = anonymized.replace(/₹\s?[\d,]+(?:\.\d{1,2})?/g, '₹[AMOUNT]');
  anonymized = anonymized.replace(/Rs\.?\s?[\d,]+(?:\.\d{1,2})?/gi, 'Rs.[AMOUNT]');
  anonymized = anonymized.replace(/INR\s?[\d,]+(?:\.\d{1,2})?/gi, 'INR [AMOUNT]');
  
  // Large standalone numbers (likely financial - 5+ digits)
  anonymized = anonymized.replace(/\b\d{1,2},\d{2},\d{3}\b/g, '[AMOUNT]'); // Indian format: 1,00,000
  anonymized = anonymized.replace(/\b\d{1,3}(?:,\d{3})+\b/g, '[AMOUNT]'); // Western format: 100,000
  
  // Passport numbers: letter followed by 7 digits
  anonymized = anonymized.replace(/\b[A-Z]\d{7}\b/gi, '[PASSPORT]');
  
  // Driving license: state code + year + number pattern
  anonymized = anonymized.replace(/\b[A-Z]{2}\d{2}\s?\d{11}\b/gi, '[LICENSE]');
  
  // Voter ID: 3 letters + 7 digits
  anonymized = anonymized.replace(/\b[A-Z]{3}\d{7}\b/gi, '[VOTER_ID]');
  
  return anonymized;
}

// ============ MAIN LOGIC ============
const DEFAULT_SYSTEM_PROMPT = `You are Nyay Saathi, a trusted legal information assistant for Indian citizens.

CRITICAL RULES:
1. Always start with a disclaimer in the user's language stating this is not legal advice
2. Cite specific Indian acts, sections, and case law when possible (format: [Act Name, Section X])
3. Use jurisdiction-specific laws based on user's location when provided
4. Explain legal jargon in simple terms that common people can understand
5. Ask 2-3 clarifying questions if the query is ambiguous
6. Recommend consulting a lawyer for complex matters or if confidence is below 85%
7. NEVER practice law or give specific legal advice - only provide general information
8. Be empathetic and understanding - many users may be in distressing situations

FORMATTING RULES (CRITICAL - FOLLOW STRICTLY):
- DO NOT use asterisks (*) for emphasis or bold
- DO NOT use double asterisks (**) for bold text
- DO NOT use any markdown formatting like headers (#), bullet points with asterisks
- Write in plain, natural sentences without any special formatting characters
- Use proper punctuation: periods, commas, colons, semicolons
- Use numbered lists (1. 2. 3.) if needed, NOT bullet points with dashes or asterisks
- Write conversationally as if speaking to someone directly
- Avoid technical jargon unless explaining it in simple terms

RESPONSE FORMAT:
- Start with appropriate disclaimer in user's language (no asterisks)
- Answer the question clearly and simply in natural conversational tone
- Cite relevant laws when applicable using [Act Name, Section X] format
- Suggest practical next steps
- End with "Consider consulting a lawyer for..." if the matter is serious

SUPPORTED LANGUAGES: Hindi, English, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, Urdu`;

function cleanResponseText(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/^-\s/gm, '• ')
    .replace(/^•\s/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function generateQueryEmbedding(query: string): Promise<number[] | null> {
  try {
    console.log('Generating embedding for query:', query.substring(0, 100) + '...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-exp-03-07:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/gemini-embedding-exp-03-07',
          content: { parts: [{ text: query }] },
          outputDimensionality: 768,
          taskType: 'RETRIEVAL_QUERY'
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Embedding generation failed:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data.embedding?.values || null;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
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

    const { message, conversationId, language, conversationHistory, locationState, fileContext } = validation.data!;

    console.log('Processing legal-chat request:', {
      messageLength: message?.length,
      language,
      locationState,
      hasFileContext: !!fileContext,
      historyLength: conversationHistory?.length || 0,
      conversationId
    });

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Load system settings
    const { data: settings } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['system_prompt', 'temperature', 'max_response_length']);

    const settingsMap = settings?.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, any>) || {};

    const systemPrompt = settingsMap.system_prompt || DEFAULT_SYSTEM_PROMPT;
    const temperature = parseFloat(settingsMap.temperature) || 0.4;

    // Perform semantic RAG search
    let ragContext = '';
    try {
      const queryEmbedding = await generateQueryEmbedding(message);
      
      if (queryEmbedding) {
        console.log('Attempting semantic search with embedding...');
        const embeddingStr = `[${queryEmbedding.join(',')}]`;
        
        const { data: ragResults, error: semanticError } = await supabase.rpc('search_documents_semantic', {
          query_embedding: embeddingStr,
          match_count: 5
        });

        if (semanticError) {
          console.error('Semantic search error:', semanticError);
        } else if (ragResults && ragResults.length > 0) {
          console.log(`Found ${ragResults.length} relevant documents via semantic search`);
          ragContext = '\n\nRELEVANT KNOWLEDGE BASE CONTEXT:\n' + 
            ragResults.map((r: any) => {
              const similarityPercent = (r.similarity * 100).toFixed(1);
              return `[Relevance: ${similarityPercent}%]\n${r.content}`;
            }).join('\n---\n');
        }
      }
      
      if (!ragContext) {
        console.log('Falling back to text-based search...');
        const { data: ragResults } = await supabase.rpc('search_documents', {
          query_text: message,
          match_count: 5
        });

        if (ragResults && ragResults.length > 0) {
          console.log(`Found ${ragResults.length} relevant documents via text search`);
          ragContext = '\n\nRELEVANT KNOWLEDGE BASE CONTEXT:\n' + 
            ragResults.map((r: any) => r.content).join('\n---\n');
        }
      }
    } catch (e) {
      console.error('RAG search error:', e);
    }

    let fileContextStr = '';
    if (fileContext && fileContext.trim()) {
      fileContextStr = `\n\nUSER UPLOADED DOCUMENTS:\n${fileContext}\n\nPlease consider these documents when answering the user's question.`;
    }

    const messages = [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}${ragContext}${fileContextStr}\n\nUser language: ${language || 'English'}\nUser location: ${locationState || 'India'}\n\nIMPORTANT: Respond in ${language || 'English'} without using any asterisks or markdown formatting. Write in natural, conversational sentences.` }]
      },
      {
        role: 'model',
        parts: [{ text: 'I understand. I am Nyay Saathi, ready to help with legal information in the specified language while following all the critical rules. I will respond in natural conversational language without using asterisks or markdown formatting.' }]
      }
    ];

    // CRITICAL: If this is the first message (no history), inject context that user has already been welcomed
    // This prevents the AI from greeting the user again when they've already asked their question
    if (!conversationHistory || conversationHistory.length === 0) {
      messages.push({
        role: 'model',
        parts: [{ text: 'The user has already been shown a welcome message by the app UI. I will NOT greet them again. I will respond directly to their query. DISCLAIMER PROTOCOL: I will ONLY add a legal disclaimer when recommending specific legal actions (filing complaints, court cases, legal notices, FIRs, petitions). I will NOT add "Reminder:" disclaimers on every conversational message - only when advising on actionable legal steps.' }]
      });
    }

    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory.slice(-10)) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      }
    }

    messages.push({
      role: 'user',
      parts: [{ text: message }]
    });

    console.log('Calling Gemini API with', messages.length, 'messages');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages,
          generationConfig: {
            temperature,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ]
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, I could not generate a response. Please try again.';
    const aiResponse = cleanResponseText(rawResponse);
    console.log('Generated response length:', aiResponse.length);

    const citationPattern = /\[([^\]]+(?:Act|Code|Law|Section|Article)[^\]]*)\]/gi;
    const citations: Array<{ act: string; section: string; text: string }> = [];
    let match;
    while ((match = citationPattern.exec(aiResponse)) !== null) {
      const citationText = match[1];
      const sectionMatch = citationText.match(/Section\s+(\d+[A-Z]?)/i);
      citations.push({
        act: citationText.replace(/,?\s*Section\s+\d+[A-Z]?/i, '').trim(),
        section: sectionMatch ? sectionMatch[1] : '',
        text: citationText
      });
    }

    if (conversationId) {
      // Anonymize user message before storing to protect PII
      const anonymizedUserMessage = anonymizePII(message);
      
      await supabase.from('messages').insert([
        { conversation_id: conversationId, role: 'user', content: anonymizedUserMessage },
        { conversation_id: conversationId, role: 'assistant', content: aiResponse, citations }
      ]);

      await supabase
        .from('conversations')
        .update({ message_count: (conversationHistory?.length || 0) + 2 })
        .eq('id', conversationId);
    }

    console.log('Request completed successfully');

    return new Response(
      JSON.stringify({ response: aiResponse, citations, conversationId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in legal-chat:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
