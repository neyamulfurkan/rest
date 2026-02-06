// src/lib/supabase.ts
// DEPRECATED: Supabase no longer used for storage
// This file is kept for backwards compatibility only
// File uploads now use local filesystem (Render persistent disk)

// Stub exports to prevent import errors
export const supabase = {
  storage: {
    from: () => ({
      upload: () => Promise.reject(new Error('Supabase storage disabled')),
      remove: () => Promise.reject(new Error('Supabase storage disabled')),
    }),
  },
  channel: () => ({
    on: () => ({ subscribe: () => {} }),
  }),
  removeChannel: () => {},
};

console.warn('⚠️ Supabase is disabled. Using local file storage.');