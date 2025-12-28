import { apiClient } from './api';

// Usage: call trackAnalytics('page_view', { path: '/discover' })
// Fire and forget, don't block UI
export function trackAnalytics(eventType: string, eventData?: any) {
  apiClient.trackEvent(eventType, eventData).catch(() => {});
}
