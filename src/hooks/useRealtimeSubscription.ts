import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

type TableName = 'documents' | 'conversations' | 'messages' | 'analytics_events' | 'user_visitors';

interface SubscriptionConfig {
  table: TableName;
  filter?: string;
  onInsert?: (payload: { new: Record<string, unknown> }) => void;
  onUpdate?: (payload: { new: Record<string, unknown>; old: Record<string, unknown> }) => void;
  onDelete?: (payload: { old: Record<string, unknown> }) => void;
  onChange?: () => void;
}

export const useRealtimeSubscription = (
  configs: SubscriptionConfig[],
  channelName: string,
  enabled: boolean = true
) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || configs.length === 0) return;

    // Create channel
    let channel = supabase.channel(channelName);

    // Add subscriptions for each config
    configs.forEach(config => {
      channel = channel.on(
        'postgres_changes' as const,
        {
          event: '*',
          schema: 'public',
          table: config.table,
          filter: config.filter
        },
        (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
          // Call specific handlers based on event type
          if (payload.eventType === 'INSERT' && config.onInsert) {
            config.onInsert({ new: payload.new });
          } else if (payload.eventType === 'UPDATE' && config.onUpdate) {
            config.onUpdate({ new: payload.new, old: payload.old });
          } else if (payload.eventType === 'DELETE' && config.onDelete) {
            config.onDelete({ old: payload.old });
          }
          
          // Always call onChange if provided
          if (config.onChange) {
            config.onChange();
          }
        }
      );
    });

    // Subscribe to channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Realtime] Subscribed to ${channelName}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`[Realtime] Error subscribing to ${channelName}`);
      }
    });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        console.log(`[Realtime] Unsubscribing from ${channelName}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, channelName, JSON.stringify(configs.map(c => ({ table: c.table, filter: c.filter })))]);

  return channelRef;
};

// Convenience hook for single table subscription
export const useTableSubscription = (
  table: TableName,
  callbacks: {
    onInsert?: (data: Record<string, unknown>) => void;
    onUpdate?: (data: Record<string, unknown>) => void;
    onDelete?: (data: Record<string, unknown>) => void;
    onChange?: () => void;
  },
  enabled: boolean = true
) => {
  return useRealtimeSubscription(
    [{
      table,
      onInsert: callbacks.onInsert ? (p) => callbacks.onInsert!(p.new) : undefined,
      onUpdate: callbacks.onUpdate ? (p) => callbacks.onUpdate!(p.new) : undefined,
      onDelete: callbacks.onDelete ? (p) => callbacks.onDelete!(p.old) : undefined,
      onChange: callbacks.onChange ? () => callbacks.onChange!() : undefined
    }],
    `${table}-subscription`,
    enabled
  );
};
