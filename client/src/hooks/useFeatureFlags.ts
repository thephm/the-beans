/**
 * Custom hook for managing feature flags
 * Reads from environment variables prefixed with NEXT_PUBLIC_
 */
export const useFeatureFlags = () => {
  const showRatings = process.env.NEXT_PUBLIC_SHOW_RATINGS === 'true';
  
  return {
    showRatings,
  };
};
