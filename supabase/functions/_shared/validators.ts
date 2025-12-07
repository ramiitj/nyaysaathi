// Input validation schemas for edge functions
// Using manual validation since zod isn't available in Deno edge functions

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// String validation helpers
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Content sanitization - remove potential injection patterns
export function sanitizeString(str: string, maxLength = 10000): string {
  if (!str) return '';
  return str
    .slice(0, maxLength)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .trim();
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

// Validate language code
const VALID_LANGUAGES = ['HI', 'EN', 'BN', 'TA', 'TE', 'MR', 'GU', 'KN', 'ML', 'PA', 'OR', 'UR'];
export function isValidLanguage(lang: string): boolean {
  return VALID_LANGUAGES.includes(lang.toUpperCase());
}

// Validate UUID format
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// === LEGAL CHAT VALIDATION ===
export interface LegalChatInput {
  message: string;
  conversationId?: string;
  language?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  locationState?: string;
  fileContext?: string;
}

export function validateLegalChatInput(body: unknown): ValidationResult<LegalChatInput> {
  if (!isObject(body)) {
    return { success: false, error: 'Invalid request body' };
  }

  const { message, conversationId, language, conversationHistory, locationState, fileContext } = body;

  // Message is required and must be a non-empty string
  if (!isString(message) || message.trim().length === 0) {
    return { success: false, error: 'Message is required' };
  }

  if (message.length > 10000) {
    return { success: false, error: 'Message exceeds maximum length of 10000 characters' };
  }

  // Validate optional conversationId
  if (conversationId !== undefined && conversationId !== null) {
    if (!isString(conversationId) || !isValidUUID(conversationId)) {
      return { success: false, error: 'Invalid conversation ID format' };
    }
  }

  // Validate optional language
  let validatedLanguage = 'EN';
  if (language !== undefined && language !== null) {
    if (!isString(language) || !isValidLanguage(language)) {
      return { success: false, error: 'Invalid language code' };
    }
    validatedLanguage = language.toUpperCase();
  }

  // Validate conversation history
  let validatedHistory: Array<{ role: string; content: string }> = [];
  if (conversationHistory !== undefined && conversationHistory !== null) {
    if (!isArray(conversationHistory)) {
      return { success: false, error: 'Conversation history must be an array' };
    }
    if (conversationHistory.length > 50) {
      return { success: false, error: 'Conversation history exceeds maximum of 50 messages' };
    }
    for (const msg of conversationHistory) {
      if (!isObject(msg) || !isString(msg.role) || !isString(msg.content)) {
        return { success: false, error: 'Invalid message format in conversation history' };
      }
      if (!['user', 'assistant', 'model'].includes(msg.role)) {
        return { success: false, error: 'Invalid role in conversation history' };
      }
      validatedHistory.push({
        role: msg.role,
        content: sanitizeString(msg.content as string, 5000)
      });
    }
  }

  return {
    success: true,
    data: {
      message: sanitizeString(message),
      conversationId: conversationId as string | undefined,
      language: validatedLanguage,
      conversationHistory: validatedHistory,
      locationState: locationState ? sanitizeString(locationState as string, 100) : undefined,
      fileContext: fileContext ? sanitizeString(fileContext as string, 20000) : undefined,
    }
  };
}

// === SPEECH TO TEXT VALIDATION ===
export interface SpeechToTextInput {
  audio: string;
  language?: string;
}

export function validateSpeechToTextInput(body: unknown): ValidationResult<SpeechToTextInput> {
  if (!isObject(body)) {
    return { success: false, error: 'Invalid request body' };
  }

  const { audio, language } = body;

  if (!isString(audio) || audio.length === 0) {
    return { success: false, error: 'Audio data is required' };
  }

  // Base64 audio should be reasonable size (max ~10MB)
  if (audio.length > 15000000) {
    return { success: false, error: 'Audio data exceeds maximum size' };
  }

  // Validate it looks like base64
  if (!/^[A-Za-z0-9+/=]+$/.test(audio)) {
    return { success: false, error: 'Invalid audio data format' };
  }

  let validatedLanguage = 'EN';
  if (language !== undefined && language !== null) {
    if (!isString(language) || !isValidLanguage(language)) {
      return { success: false, error: 'Invalid language code' };
    }
    validatedLanguage = language.toUpperCase();
  }

  return {
    success: true,
    data: {
      audio,
      language: validatedLanguage
    }
  };
}

// === TEXT TO SPEECH VALIDATION ===
export interface TextToSpeechInput {
  text: string;
  language?: string;
}

export function validateTextToSpeechInput(body: unknown): ValidationResult<TextToSpeechInput> {
  if (!isObject(body)) {
    return { success: false, error: 'Invalid request body' };
  }

  const { text, language } = body;

  if (!isString(text) || text.trim().length === 0) {
    return { success: false, error: 'Text is required' };
  }

  if (text.length > 5000) {
    return { success: false, error: 'Text exceeds maximum length of 5000 characters' };
  }

  let validatedLanguage = 'EN';
  if (language !== undefined && language !== null) {
    if (!isString(language) || !isValidLanguage(language)) {
      return { success: false, error: 'Invalid language code' };
    }
    validatedLanguage = language.toUpperCase();
  }

  return {
    success: true,
    data: {
      text: sanitizeString(text, 5000),
      language: validatedLanguage
    }
  };
}

// === CREATE CONVERSATION VALIDATION ===
export interface CreateConversationInput {
  language?: string;
  locationState?: string;
  locationCity?: string;
}

export function validateCreateConversationInput(body: unknown): ValidationResult<CreateConversationInput> {
  if (!isObject(body)) {
    return { success: false, error: 'Invalid request body' };
  }

  const { language, locationState, locationCity } = body;

  let validatedLanguage = 'EN';
  if (language !== undefined && language !== null) {
    if (!isString(language) || !isValidLanguage(language)) {
      return { success: false, error: 'Invalid language code' };
    }
    validatedLanguage = language.toUpperCase();
  }

  return {
    success: true,
    data: {
      language: validatedLanguage,
      locationState: locationState ? sanitizeString(locationState as string, 100) : undefined,
      locationCity: locationCity ? sanitizeString(locationCity as string, 100) : undefined,
    }
  };
}

// === PROCESS USER FILE VALIDATION ===
export interface ProcessUserFileInput {
  fileId: string;
  language?: string;
}

export function validateProcessUserFileInput(body: unknown): ValidationResult<ProcessUserFileInput> {
  if (!isObject(body)) {
    return { success: false, error: 'Invalid request body' };
  }

  const { fileId, language } = body;

  if (!isString(fileId) || !isValidUUID(fileId)) {
    return { success: false, error: 'Valid fileId is required' };
  }

  let validatedLanguage = 'EN';
  if (language !== undefined && language !== null) {
    if (!isString(language) || !isValidLanguage(language)) {
      return { success: false, error: 'Invalid language code' };
    }
    validatedLanguage = language.toUpperCase();
  }

  return {
    success: true,
    data: {
      fileId,
      language: validatedLanguage
    }
  };
}

// Validation error response helper
export function validationErrorResponse(error: string, corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
