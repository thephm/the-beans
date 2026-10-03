export function getApiErrorMessage(errorData: unknown, fallback: string): string {
  if (!errorData || typeof errorData !== 'object') return fallback;

  if ('error' in errorData && typeof errorData.error === 'string' && errorData.error) {
    return errorData.error;
  }
  if ('message' in errorData && typeof errorData.message === 'string' && errorData.message) {
    return errorData.message;
  }
  if ('errors' in errorData && Array.isArray(errorData.errors)) {
    const messages = errorData.errors.flatMap((error: unknown) => {
      if (!error || typeof error !== 'object' || !('msg' in error) || typeof error.msg !== 'string') {
        return [];
      }
      return error.msg ? [error.msg] : [];
    });
    if (messages.length > 0) return Array.from(new Set(messages)).join(' ');
  }
  return fallback;
}
