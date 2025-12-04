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
          
          // Update visitor record with location if we have visitorId
          if (visitorId) {
            await supabase
              .from('user_visitors')
              .update({ location_data: newLocationData as Json })
              .eq('id', visitorId);
          }
        },
        (error) => {
          console.log('Location access denied or unavailable:', error.message);
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );
    }
  }, [visitorId]);
  
  // Initialize visitor tracking
  useEffect(() => {
    async function initializeVisitor() {
      try {
        setIsLoading(true);
        
        // Check localStorage for existing visitor ID
        const storedVisitorId = localStorage.getItem(VISITOR_STORAGE_KEY);
        
        // Generate fingerprint
        const fingerprint = await generateFingerprint();
        const deviceInfo = getDeviceInfo();
        
        if (storedVisitorId) {
          // Existing visitor - update last visit
          const { data: existingVisitor, error } = await supabase
            .from('user_visitors')
            .select('*')
            .eq('id', storedVisitorId)
            .single();
          
          if (existingVisitor && !error) {
            // Update visit count and last visit
            await supabase
              .from('user_visitors')
              .update({
                last_visit_at: new Date().toISOString(),
                visit_count: (existingVisitor.visit_count || 0) + 1,
                device_info: JSON.parse(JSON.stringify(deviceInfo)),
              })
              .eq('id', storedVisitorId);
            
            setVisitorId(storedVisitorId);
            setIsFirstTimeUser(false);
            setLocationData((existingVisitor.location_data as unknown as LocationData) || {});
            setIsLoading(false);
            return;
          }
        }
        
        // Check if fingerprint exists in database
        const { data: existingByFingerprint } = await supabase
          .from('user_visitors')
          .select('*')
          .eq('fingerprint_hash', fingerprint)
          .single();
        
        if (existingByFingerprint) {
          // Found by fingerprint - update and store ID
          await supabase
            .from('user_visitors')
            .update({
              last_visit_at: new Date().toISOString(),
              visit_count: (existingByFingerprint.visit_count || 0) + 1,
              device_info: JSON.parse(JSON.stringify(deviceInfo)),
            })
            .eq('id', existingByFingerprint.id);
          
          localStorage.setItem(VISITOR_STORAGE_KEY, existingByFingerprint.id);
          setVisitorId(existingByFingerprint.id);
          setIsFirstTimeUser(!existingByFingerprint.onboarding_complete);
          setLocationData((existingByFingerprint.location_data as unknown as LocationData) || {});
        } else {
          // New visitor - create record
          const { data: newVisitor, error } = await supabase
            .from('user_visitors')
            .insert([{
              fingerprint_hash: fingerprint,
              device_info: JSON.parse(JSON.stringify(deviceInfo)),
              location_data: {},
            }])
            .select()
            .single();
          
          if (newVisitor && !error) {
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
    if (!visitorId) return;
    
    try {
      await supabase
        .from('user_visitors')
        .update({ onboarding_complete: true })
        .eq('id', visitorId);
      
      setIsFirstTimeUser(false);
    } catch (error) {
      console.error('Error marking onboarding complete:', error);
    }
  }, [visitorId]);
  
  return {
    visitorId,
    isFirstTimeUser,
    isLoading,
    locationData,
    requestLocation,
    markOnboardingComplete,
  };
}
