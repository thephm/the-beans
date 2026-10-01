export const isBrokenHttpStatus = (statusCode: number) => statusCode >= 400 && statusCode !== 429;
