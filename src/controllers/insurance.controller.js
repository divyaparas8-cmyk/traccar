const insuranceService = require('../services/insurance.service');
const { sendSuccess } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

class InsuranceController {
  getInsuranceOverview = asyncHandler(async (req, res) => {
    const data = await insuranceService.getInsuranceOverview(req.user, req.query);
    return sendSuccess(res, 200, 'Insurance policies retrieved successfully', data);
  });

  updateInsuranceDate = asyncHandler(async (req, res) => {
    const { insuranceExpiry } = req.body;
    const vehicle = await insuranceService.updateInsuranceDate(req.user, req.params.vehicleId, insuranceExpiry);
    return sendSuccess(res, 200, 'Insurance policy date updated', vehicle);
  });

  renewInsurance = asyncHandler(async (req, res) => {
    const result = await insuranceService.renewInsurance(req.user, req.params.vehicleId);
    return sendSuccess(res, 200, 'Insurance policy renewed for 1 year', result);
  });
}

module.exports = new InsuranceController();
