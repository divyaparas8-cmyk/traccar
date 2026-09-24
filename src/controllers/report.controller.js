const reportService = require('../services/report.service');
const { sendSuccess } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

class ReportController {
  getSummary = asyncHandler(async (req, res) => {
    const data = await reportService.getReportSummary(req.user, req.query);
    return sendSuccess(res, 200, 'Report summary generated', data);
  });

  generateExport = asyncHandler(async (req, res) => {
    const { content, filename, mimeType } = await reportService.generateExport(req.user, req.body);
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(content);
  });
}

module.exports = new ReportController();
