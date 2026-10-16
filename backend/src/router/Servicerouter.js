const express = require('express');
const { CreateService, GetAllServices, GetServiceById, AssignEmployee, StartService, HoldService, ResumeService, CompleteService, GetHistoryByCustomerID } = require('../controller/Servicecontroller');
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdminPanelRole } = require('../utils/access');
const routerService = express.Router();
routerService.use(authMiddleware, requireAdminPanelRole);

routerService.post('/service_create',CreateService);
routerService.get('/services',GetAllServices);
routerService.get('/services/:id',GetServiceById);
routerService.put('/services/:id/Assign',AssignEmployee);
routerService.put('/services/:id/Start',StartService);
routerService.put('/services/:id/Hold',HoldService);
routerService.put('/services/:id/Resume',ResumeService);
routerService.put('/services/:id/Complete',CompleteService);
routerService.get('/services/:id/History',GetHistoryByCustomerID);
module.exports = routerService;