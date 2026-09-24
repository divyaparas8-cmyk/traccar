const { z } = require('zod');

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long')
  })
});

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
  })
});

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Full name is required').optional(),
    email: z.string().email('Please enter a valid email address').optional(),
    avatar: z.string().optional(),
    language: z.string().optional(),
    speedThreshold: z.number().int().min(10).max(200).optional(),
    idleAlertMinutes: z.number().int().min(1).max(120).optional(),
    receivePushNotifications: z.boolean().optional(),
    receiveEmailNotifications: z.boolean().optional()
  })
});

module.exports = {
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema
};
