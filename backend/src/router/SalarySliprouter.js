const express = require('express');

const {GetSalarySlip} = require('../controller/SalarySlipcontroller');
const authMiddleware = require('../middleware/authMiddleware');
const salarysliprouter = express.Router();

salarysliprouter.get('/salary-slip/:userId',authMiddleware,GetSalarySlip);

module.exports = salarysliprouter;