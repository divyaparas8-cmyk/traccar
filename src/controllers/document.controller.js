const documentService = require('../services/document.service');
const { sendSuccess } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

class DocumentController {
  getDocuments = asyncHandler(async (req, res) => {
    const docs = await documentService.getDocuments(req.user, req.query);
    return sendSuccess(res, 200, 'Compliance documents retrieved', docs);
  });

  uploadDocument = asyncHandler(async (req, res) => {
    const doc = await documentService.uploadDocument(req.user, req.body, req.file);
    return sendSuccess(res, 201, 'Compliance document uploaded', doc);
  });

  deleteDocument = asyncHandler(async (req, res) => {
    await documentService.deleteDocument(req.user, req.params.id);
    return sendSuccess(res, 200, 'Document removed', null);
  });
}

module.exports = new DocumentController();
