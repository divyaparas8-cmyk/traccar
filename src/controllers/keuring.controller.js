const keuringService = require('../services/keuring.service');
const { sendSuccess } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

class KeuringController {
  getKeuringRecords = asyncHandler(async (req, res) => {
    const records = await keuringService.getKeuringRecords(req.user, req.query);
    return sendSuccess(res, 200, 'Keuring inspection records retrieved', records);
  });

  createKeuringRecord = asyncHandler(async (req, res) => {
    const record = await keuringService.createKeuringRecord(req.user, req.body);
    return sendSuccess(res, 201, 'Keuring inspection certificate registered', record);
  });

  updateKeuringRecord = asyncHandler(async (req, res) => {
    const record = await keuringService.updateKeuringRecord(req.user, req.params.id, req.body);
    return sendSuccess(res, 200, 'Keuring certificate updated', record);
  });

  deleteKeuringRecord = asyncHandler(async (req, res) => {
    await keuringService.deleteKeuringRecord(req.user, req.params.id);
    return sendSuccess(res, 200, 'Keuring certificate removed', null);
  });
}

module.exports = new KeuringController();
