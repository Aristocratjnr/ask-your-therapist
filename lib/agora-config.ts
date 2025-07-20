// lib/agora-config.ts
export const AGORA_CONFIG = {
  appId: process.env.EXPO_PUBLIC_AGORA_APP_ID || '56194e911db54ba7a913a296beadfecb',
  // For testing, you can use null token (less secure)
  // For production, implement token server
  token: null,
};