export default () => ({
  // Application
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  // Database
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },

  // OTP
  otp: {
    secret: process.env.OTP_SECRET,
    expiration: parseInt(process.env.OTP_EXPIRATION || '5', 10),
    step: parseInt(process.env.OTP_STEP || '30', 10),
    digits: parseInt(process.env.OTP_DIGITS || '6', 10),
  },

  // Throttler
  throttler: {
    ttl: parseInt(process.env.THROTTLER_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLER_LIMIT || '60', 10),
    ignoreUserAgents: process.env.THROTTLER_IGNORE_USER_AGENTS
      ? process.env.THROTTLER_IGNORE_USER_AGENTS.split(',')
      : [],
  },

  // i18n
  i18n: {
    defaultLocale: process.env.DEFAULT_LOCALE || 'en',
    fallbackLocale: process.env.FALLBACK_LOCALE || 'en',
    supportedLocales: process.env.SUPPORTED_LOCALES ? process.env.SUPPORTED_LOCALES.split(',') : ['en', 'ar'],
  },
});
