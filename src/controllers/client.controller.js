const clientService = require('../services/client.service');
const { sendSuccess } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

class ClientController {
  getClients = asyncHandler(async (req, res) => {
    const clients = await clientService.getClients(req.query);
    return sendSuccess(res, 200, 'Clients retrieved successfully', clients);
  });

  getClientById = asyncHandler(async (req, res) => {
    const client = await clientService.getClientById(req.params.id);
    return sendSuccess(res, 200, 'Client details retrieved', client);
  });

  createClient = asyncHandler(async (req, res) => {
    const client = await clientService.createClient(req.body);
    return sendSuccess(res, 201, `Client organization ${client.name} registered`, client);
  });

  updateClient = asyncHandler(async (req, res) => {
    const client = await clientService.updateClient(req.params.id, req.body);
    return sendSuccess(res, 200, `Client ${client.name} profile updated`, client);
  });

  deleteClient = asyncHandler(async (req, res) => {
    await clientService.deleteClient(req.params.id);
    return sendSuccess(res, 200, 'Client organization deregistered', null);
  });
}

module.exports = new ClientController();
