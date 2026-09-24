const { z } = require('zod');

const createClientSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Client company name is required'),
    code: z.string().min(1, 'Client code is required'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().optional(),
    address: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional()
  })
});

const updateClientSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional()
  })
});

module.exports = {
  createClientSchema,
  updateClientSchema
};
