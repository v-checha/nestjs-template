export default () => ({
  // Application
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,

  // Database
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
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
    expiration: parseInt(process.env.OTP_EXPIRATION, 10) || 5,
    step: parseInt(process.env.OTP_STEP, 10) || 30,
    digits: parseInt(process.env.OTP_DIGITS, 10) || 6,
  },
});
