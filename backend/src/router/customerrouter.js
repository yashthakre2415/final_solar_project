const express = require('express');
const { Customercontroller, GetAllCustomers, GetCustomerById, UpdateCustomer, AddCustomerAddress, DeleteCustomer } = require('../controller/customercontroller');
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdminPanelRole } = require('../utils/access');
const router1 = express.Router();
router1.use(authMiddleware, requireAdminPanelRole);

router1.post('/Customer_Create', Customercontroller);
router1.get('/Customers', GetAllCustomers);
router1.get('/Customers/:id', GetCustomerById);
router1.put('/Customers/:id', UpdateCustomer);
router1.post('/Customers/:id/addresses', AddCustomerAddress);
router1.delete('/Customers/:id', DeleteCustomer);
module.exports = router1;
