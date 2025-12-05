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

// Function to clean response text of any remaining markdown
function cleanResponseText(text: string): string {
  return text
    .replace(/\*\*/g, '')           // Remove bold markers
    .replace(/\*/g, '')             // Remove italics markers
    .replace(/#{1,6}\s/g, '')       // Remove headers
    .replace(/^-\s/gm, '• ')        // Replace dash bullets with simple bullet
    .replace(/^•\s/gm, '')          // Remove bullet points entirely for cleaner text
    .replace(/`([^`]+)`/g, '$1')    // Remove code formatting
    .replace(/\n{3,}/g, '\n\n')     // Reduce multiple newlines
    .trim();
}

// Generate embedding for semantic search using Gemini text-embedding-004
async function generateQueryEmbedding(query: string): Promise<number[] | null> {
  try {
    console.log('Generating embedding for query:', query.substring(0, 100) + '...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text: query }] },
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
    const embedding = data.embedding?.values;
    
    if (embedding) {
      console.log(`Generated ${embedding.length}-dimensional embedding`);
    }
    
    return embedding || null;
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
    const { message, conversationId, language, conversationHistory, locationState, fileContext } = await req.json();

    console.log('Processing legal-chat request:', {
      messageLength: message?.length,
      language,
      locationState,
      hasFileContext: !!fileContext,
      historyLength: conversationHistory?.length || 0,
      conversationId
    });

    if (!message) {
      throw new Error('Message is required');
    }

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

    // Perform semantic RAG search with vector embeddings
    let ragContext = '';
    try {
      // First try semantic search with embeddings
      const queryEmbedding = await generateQueryEmbedding(message);
      
      if (queryEmbedding) {
        console.log('Attempting semantic search with embedding...');
        
        // Format embedding as a string for the RPC call
        const embeddingStr = `[${queryEmbedding.join(',')}]`;
        
        const { data: ragResults, error: semanticError } = await supabase.rpc('search_documents_semantic', {
          query_embedding: embeddingStr,
          match_count: 5
        });

        if (semanticError) {
          console.error('Semantic search error:', semanticError);
          // Fall through to text search
        } else if (ragResults && ragResults.length > 0) {
          console.log(`Found ${ragResults.length} relevant documents via semantic search`);
          ragContext = '\n\nRELEVANT KNOWLEDGE BASE CONTEXT:\n' + 
            ragResults.map((r: any) => {
              const similarityPercent = (r.similarity * 100).toFixed(1);
              console.log(`- Document chunk (${similarityPercent}% similar): ${r.content.substring(0, 50)}...`);
              return `[Relevance: ${similarityPercent}%]\n${r.content}`;
            }).join('\n---\n');
        } else {
          console.log('Semantic search returned no results');
        }
      }
      
      // Fallback to text search if semantic search didn't return results
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
        } else {
          console.log('No relevant documents found in knowledge base');
        }
      }
    } catch (e) {
      console.error('RAG search error:', e);
    }

    // Add file context if provided
    let fileContextStr = '';
    if (fileContext && fileContext.trim()) {
      fileContextStr = `\n\nUSER UPLOADED DOCUMENTS:\n${fileContext}\n\nPlease consider these documents when answering the user's question.`;
    }

    // Build conversation messages for Gemini
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

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory.slice(-10)) { // Last 10 messages for context
        messages.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      }
    }

    // Add current message
    messages.push({
      role: 'user',
      parts: [{ text: message }]
    });

    console.log('Calling Gemini API with', messages.length, 'messages');

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
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
    
    // Clean the response text to remove any remaining markdown
    const aiResponse = cleanResponseText(rawResponse);
    console.log('Generated response length:', aiResponse.length);

    // Extract citations from response (simple pattern matching)
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
    
    if (citations.length > 0) {
      console.log(`Extracted ${citations.length} citations from response`);
    }

    // Store messages in database if conversationId provided
    if (conversationId) {
      await supabase.from('messages').insert([
        { conversation_id: conversationId, role: 'user', content: message },
        { conversation_id: conversationId, role: 'assistant', content: aiResponse, citations }
      ]);

      // Update conversation message count
      await supabase
        .from('conversations')
        .update({ message_count: (conversationHistory?.length || 0) + 2 })
        .eq('id', conversationId);
    }

    console.log('Request completed successfully');

    return new Response(
      JSON.stringify({ 
        response: aiResponse, 
        citations,
        conversationId 
      }),
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
