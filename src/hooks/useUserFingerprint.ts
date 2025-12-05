import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

interface DeviceInfo {
  browser: string;
  os: string;
  screenWidth: number;
  screenHeight: number;
  timezone: string;
  language: string;
  colorDepth: number;
  pixelRatio: number;
}

interface LocationData {
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  country?: string;
  accuracy?: number;
}

interface VisitorRecord {
  id: string;
  fingerprint_hash: string;
  visit_count: number;
  first_visit_at: string;
  last_visit_at: string;
  onboarding_complete: boolean;
}

const VISITOR_STORAGE_KEY = 'nyay_saathi_visitor_id';

// Generate a simple browser fingerprint
async function generateFingerprint(): Promise<string> {
  const components: string[] = [];
  
  // Screen info
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
  components.push(window.devicePixelRatio.toString());
  
  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  // Language
  components.push(navigator.language);
  
  // Platform
  components.push(navigator.platform);
  
  // User agent
  components.push(navigator.userAgent);
  
  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Nyay Saathi fingerprint', 2, 2);
      components.push(canvas.toDataURL().slice(-50));
    }
  } catch (e) {
    components.push('no-canvas');
  }
  
  // WebGL info
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown');
      }
    }
  } catch (e) {
    components.push('no-webgl');
  }
  
  // Hash the components
  const data = components.join('|');
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  let os = 'Unknown';
  
  // Detect browser
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  else if (ua.includes('Opera')) browser = 'Opera';
  
  // Detect OS
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  return {
    browser,
    os,
    screenWidth: screen.width,
    screenHeight: screen.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio,
  };
}

export function useUserFingerprint() {
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [locationData, setLocationData] = useState<LocationData>({});
  
  // Request GPS location
  const requestLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const newLocationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setLocationData(newLocationData);
          
          // Update visitor record with location using secure RPC function
          if (fingerprint) {
            await supabase.rpc('update_visitor_by_fingerprint', {
              fingerprint: fingerprint,
              new_location_data: newLocationData as unknown as Json,
            });
          }
        },
        (error) => {
          console.log('Location access denied or unavailable:', error.message);
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );
    }
  }, [fingerprint]);
  
  // Initialize visitor tracking
  useEffect(() => {
    async function initializeVisitor() {
      try {
        setIsLoading(true);
        
        // Generate fingerprint
        const fp = await generateFingerprint();
        setFingerprint(fp);
        const deviceInfo = getDeviceInfo();
        
        // Check localStorage for existing visitor ID (for caching)
        const storedVisitorId = localStorage.getItem(VISITOR_STORAGE_KEY);
        
        // Use secure RPC function to look up visitor by fingerprint
        const { data: existingVisitor, error } = await supabase
          .rpc('get_visitor_by_fingerprint', { fingerprint: fp });
        
        if (existingVisitor && existingVisitor.length > 0 && !error) {
          const visitor = existingVisitor[0] as VisitorRecord;
          
          // Update visit count using secure RPC function
          await supabase.rpc('update_visitor_by_fingerprint', {
            fingerprint: fp,
            new_visit_count: (visitor.visit_count || 0) + 1,
            new_device_info: JSON.parse(JSON.stringify(deviceInfo)) as unknown as Json,
          });
          
          localStorage.setItem(VISITOR_STORAGE_KEY, visitor.id);
          setVisitorId(visitor.id);
          setIsFirstTimeUser(!visitor.onboarding_complete);
        } else {
          // New visitor - create record (INSERT is still allowed)
          const { data: newVisitor, error: insertError } = await supabase
            .from('user_visitors')
            .insert([{
              fingerprint_hash: fp,
              device_info: JSON.parse(JSON.stringify(deviceInfo)),
              location_data: {},
            }])
            .select('id')
            .single();
          
          if (newVisitor && !insertError) {
            localStorage.setItem(VISITOR_STORAGE_KEY, newVisitor.id);
            setVisitorId(newVisitor.id);
            setIsFirstTimeUser(true);
          }
        }
      } catch (error) {
        console.error('Error initializing visitor:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    initializeVisitor();
  }, []);
  
  // Mark onboarding as complete
  const markOnboardingComplete = useCallback(async () => {
    if (!fingerprint) return;
    
    try {
      await supabase.rpc('update_visitor_by_fingerprint', {
        fingerprint: fingerprint,
        new_onboarding_complete: true,
      });
      
      setIsFirstTimeUser(false);
    } catch (error) {
      console.error('Error marking onboarding complete:', error);
    }
  }, [fingerprint]);
  
  return {
    visitorId,
    isFirstTimeUser,
    isLoading,
    locationData,
    requestLocation,
    markOnboardingComplete,
  };
}
