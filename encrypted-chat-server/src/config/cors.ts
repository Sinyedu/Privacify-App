const DEFAULT_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];

export function getCorsOrigins(): string[] {
  const configuredOrigins = process.env.CORS_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configuredOrigins?.length ? configuredOrigins : DEFAULT_ORIGINS;
}
