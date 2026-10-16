const express = require('express');
const {UpdateMonthlySalary,GetMonthlySalary, CalculateMonthlySalary} = require('../controller/Salarycontroller');
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdminPanelRole, guardEmployee } = require('../utils/access');
const salaryrouter = express.Router();

const auth = [authMiddleware, requireAdminPanelRole];
const emp = guardEmployee((req) => req.params.userId);

salaryrouter.put('/salary/:userId', auth, emp, UpdateMonthlySalary);
salaryrouter.get('/salary/:userId', auth, emp, GetMonthlySalary);
salaryrouter.get('/salary/:userId/calculate', auth, emp, CalculateMonthlySalary);

module.exports = salaryrouter;
