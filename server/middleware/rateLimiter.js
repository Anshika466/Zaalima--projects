const rateLimit = require('express-rate-limit');

/**
 * Login Rate Limiter (PRD Section 9 - Rate Limiting)
 *
 * Max 10 requests per 15 minutes per IP on login endpoints
 * to prevent brute-force attacks.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 requests per window
  message: {
    success: false,
    message:
      'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * General API Rate Limiter
 *
 * Max 100 requests per 15 minutes per IP for general API routes.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter, apiLimiter };
