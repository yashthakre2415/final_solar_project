const express = require('express');
const {UpdateEmployeeLocation, GetCurrentEmployeeLocation, GetEmployeeLocationHistory} = require('../controller/LiveLocationcontroller');
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdminPanelRole, guardEmployee } = require('../utils/access');
const liverouter = express.Router();

const auth = [authMiddleware, requireAdminPanelRole];

liverouter.post('/live-user', auth, guardEmployee((req) => req.body && req.body.employee_id), UpdateEmployeeLocation);
liverouter.get('/live-user/history/:userId', auth, guardEmployee((req) => req.params.userId), GetEmployeeLocationHistory);
liverouter.get('/live-user/:userId', auth, guardEmployee((req) => req.params.userId), GetCurrentEmployeeLocation);
module.exports = liverouter;
