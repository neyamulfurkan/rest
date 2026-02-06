// src/hooks/useRealtime.ts
// Polling-based realtime updates (replaces Supabase Realtime)

import { useEffect, useRef } from 'react';

type RealtimeTable = 'Order' | 'Booking';

interface UseRealtimeOptions<T extends Record<string, any> = any> {
  table: RealtimeTable;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  onChange?: (payload: any) => void;
  filter?: string;
  schema?: string;
  enabled?: boolean;
  pollInterval?: number; // milliseconds
}

/**
 * Polling-based realtime hook (replaces Supabase Realtime)
 * Polls the API every X seconds to check for changes
 */
export function useRealtime<T extends Record<string, any> = any>(options: UseRealtimeOptions<T>): void {
  const {
    table,
    onChange,
    enabled = true,
    pollInterval = 10000, // 10 seconds default
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    console.log(`[Polling] Starting ${table} polling (${pollInterval}ms interval)`);

    const poll = async () => {
      try {
        // Fetch latest data from API
        const endpoint = table === 'Order' ? '/api/orders' : '/api/bookings';
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          console.error(`[Polling] Error fetching ${table}:`, response.status);
          return;
        }

        const data = await response.json();
        const currentData = data.data || data;

        // Compare with last known data
        if (lastDataRef.current && JSON.stringify(currentData) !== JSON.stringify(lastDataRef.current)) {
          console.log(`[Polling] ${table} data changed`);
          onChange?.({ new: currentData, old: lastDataRef.current, eventType: 'UPDATE' });
        }

        lastDataRef.current = currentData;
      } catch (error) {
        console.error(`[Polling] Error polling ${table}:`, error);
      }
    };

    // Initial poll
    poll();

    // Set up polling interval
    intervalRef.current = setInterval(poll, pollInterval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        console.log(`[Polling] Stopping ${table} polling`);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [table, onChange, enabled, pollInterval]);
}

/**
 * Convenience hook for Order polling
 */
export function useOrderRealtime(
  options: Omit<UseRealtimeOptions, 'table'>
): void {
  useRealtime({
    ...options,
    table: 'Order',
  });
}

/**
 * Convenience hook for Booking polling
 */
export function useBookingRealtime(
  options: Omit<UseRealtimeOptions, 'table'>
): void {
  useRealtime({
    ...options,
    table: 'Booking',
  });
}

/**
 * Manual subscription (non-React)
 */
export function subscribeToOrders(
  options: Omit<UseRealtimeOptions, 'table'>
): () => void {
  const { onChange, pollInterval = 10000 } = options;

  const interval = setInterval(async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        onChange?.({ new: data.data, eventType: 'UPDATE' });
      }
    } catch (error) {
      console.error('Error polling orders:', error);
    }
  }, pollInterval);

  return () => clearInterval(interval);
}

/**
 * Manual subscription for bookings (non-React)
 */
export function subscribeToBookings(
  options: Omit<UseRealtimeOptions, 'table'>
): () => void {
  const { onChange, pollInterval = 10000 } = options;

  const interval = setInterval(async () => {
    try {
      const response = await fetch('/api/bookings');
      if (response.ok) {
        const data = await response.json();
        onChange?.({ new: data.data, eventType: 'UPDATE' });
      }
    } catch (error) {
      console.error('Error polling bookings:', error);
    }
  }, pollInterval);

  return () => clearInterval(interval);
}