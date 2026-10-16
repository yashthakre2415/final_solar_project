const express = require('express');
const { Employeecontroller, GetAllEmployees, GetEmployeeById, UpdateEmployee, DeleteEmployee } = require('../controller/employecontroller');
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdminPanelRole } = require('../utils/access');
const routerEmploye = express.Router();
routerEmploye.use(authMiddleware, requireAdminPanelRole);

routerEmploye.post('/Employe_create',Employeecontroller);
routerEmploye.get('/Employees',GetAllEmployees);
routerEmploye.get('/Employees/:id',GetEmployeeById);
routerEmploye.put('/Employees/:id',UpdateEmployee);
routerEmploye.delete('/Employees/:id',DeleteEmployee);
module.exports = routerEmploye;
