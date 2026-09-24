const { z } = require('zod');

const updateInsuranceDateSchema = z.object({
  body: z.object({
    insuranceExpiry: z.string().min(1, 'Insurance expiry date is required')
  })
});

module.exports = {
  updateInsuranceDateSchema
};
