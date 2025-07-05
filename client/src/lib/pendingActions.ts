// Utility functions for storing pending actions during authentication flow

interface PendingLikeAction {
  buzzId: number;
  title: string;
  returnUrl: string;
  selectedSports: number[];
  timestamp: number;
  shouldProcess?: boolean; // Flag to track if this action should be processed
}

const PENDING_LIKE_KEY = 'stapubox_pending_like';
const PENDING_ACTION_EXPIRY = 30 * 60 * 1000; // 30 minutes

export function storePendingLike(action: Omit<PendingLikeAction, 'timestamp'>) {
  const pendingAction: PendingLikeAction = {
    ...action,
    timestamp: Date.now(),
    shouldProcess: false // Initially set to false
  };
  localStorage.setItem(PENDING_LIKE_KEY, JSON.stringify(pendingAction));
}

export function getPendingLike(): PendingLikeAction | null {
  try {
    const stored = localStorage.getItem(PENDING_LIKE_KEY);
    if (!stored) return null;
    
    const action: PendingLikeAction = JSON.parse(stored);
    
    // Check if action has expired
    if (Date.now() - action.timestamp > PENDING_ACTION_EXPIRY) {
      clearPendingLike();
      return null;
    }
    
    return action;
  } catch (error) {
    clearPendingLike();
    return null;
  }
}

export function clearPendingLike() {
  localStorage.removeItem(PENDING_LIKE_KEY);
}

export function enablePendingLikeProcessing() {
  const pendingLike = getPendingLike();
  if (pendingLike) {
    pendingLike.shouldProcess = true;
    localStorage.setItem(PENDING_LIKE_KEY, JSON.stringify(pendingLike));
  }
}

export function buildReturnUrl(currentUrl: string, selectedSports: number[]): string {
  const url = new URL(currentUrl);
  
  // Add selected sports as query parameters
  if (selectedSports.length > 0) {
    url.searchParams.set('sports', selectedSports.join(','));
  }
  
  return url.toString();
}

export function parseReturnUrl(returnUrl: string): { url: string; selectedSports: number[] } {
  try {
    const url = new URL(returnUrl);
    const sportsParam = url.searchParams.get('sports');
    const selectedSports = sportsParam ? sportsParam.split(',').map(Number).filter(n => !isNaN(n)) : [];
    
    return {
      url: returnUrl,
      selectedSports
    };
  } catch (error) {
    return {
      url: returnUrl,
      selectedSports: []
    };
  }
}