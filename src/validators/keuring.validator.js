const { z } = require('zod');

const createKeuringRecordSchema = z.object({
  body: z.object({
    vehicleId: z.union([z.number().int(), z.string()]),
    certificateId: z.string().min(1, 'Certificate ID is required'),
    lastInspectionDate: z.string().optional(),
    expiryDate: z.string().min(1, 'Expiry date is required'),
    station: z.string().min(1, 'Approved inspection station is required'),
    result: z.enum(['passed', 'conditional', 'failed']).optional(),
    notes: z.string().optional(),
    inspectorName: z.string().optional()
  })
});

module.exports = {
  createKeuringRecordSchema
};
