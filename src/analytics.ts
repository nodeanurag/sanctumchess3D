import { inject as injectAnalytics, track as vercelTrack } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

let initialized = false;

/**
 * Initializes Vercel Web Analytics and Speed Insights.
 * Safe to call in any environment (production, preview, or local dev).
 */
export function initAnalytics(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  try {
    // Inject Vercel Web Analytics
    injectAnalytics({
      mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      debug: false
    });

    // Inject Vercel Speed Insights (Core Web Vitals monitoring)
    injectSpeedInsights();
  } catch (err) {
    // Graceful fallback if running offline or outside Vercel
    console.debug('[Sanctum Analytics] Telemetry initialisation bypassed:', err);
  }
}

/**
 * Custom Event Tracking for Sanctum Chess
 */
export function trackEvent(
  eventName: string,
  eventData?: Record<string, string | number | boolean | null>
): void {
  try {
    if (typeof window !== 'undefined') {
      vercelTrack(eventName, eventData);
    }
  } catch {
    // Non-blocking telemetry
  }
}

export const analytics = {
  trackGameStart: (side: 'w' | 'b') => {
    trackEvent('game_start', { side: side === 'w' ? 'white' : 'black' });
  },
  trackMove: (notation: string, turn: string, isCapture: boolean) => {
    trackEvent('chess_move', { notation, turn, isCapture });
  },
  trackCameraPreset: (preset: 'wide' | 'side' | 'top' | 'player') => {
    trackEvent('camera_preset_change', { preset });
  },
  trackSoundToggle: (isMuted: boolean) => {
    trackEvent('sound_toggle', { muted: isMuted });
  }
};
