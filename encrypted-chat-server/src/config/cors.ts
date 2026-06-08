const DEFAULT_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];

export function getCorsOrigin(): boolean | string[] {
  const configuredOrigins = process.env.CORS_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins?.length) return configuredOrigins;

  if (process.env.NODE_ENV === 'production') {
    return true;
  }

  return DEFAULT_ORIGINS;
}
