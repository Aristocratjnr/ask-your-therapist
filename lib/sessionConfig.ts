// Session configuration for maintaining user sessions
export const SESSION_CONFIG = {
  // Session will be maintained for 2 days of inactivity (in seconds)
  SESSION_DURATION: 2 * 24 * 60 * 60, // 172800 seconds = 2 days
  
  // Auto-refresh tokens when they're close to expiring
  AUTO_REFRESH_THRESHOLD: 60 * 5, // 5 minutes before expiry
  
  // Storage key for persisting session data
  STORAGE_KEY: 'otconekt-auth-token',
};

// Helper function to check if session should be considered expired
export const isSessionExpired = (lastActivity: string): boolean => {
  const lastActivityTime = new Date(lastActivity).getTime();
  const currentTime = new Date().getTime();
  const timeDifference = currentTime - lastActivityTime;
  
  return timeDifference > (SESSION_CONFIG.SESSION_DURATION * 1000);
};

// Helper function to update last activity timestamp
export const updateLastActivity = (): string => {
  const timestamp = new Date().toISOString();
  // You could store this in AsyncStorage if needed for more sophisticated tracking
  return timestamp;
};
