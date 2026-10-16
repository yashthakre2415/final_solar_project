const express = require('express');
const {CreateExpense,GetExpensesByEmployee,GetExpensesByUserAndStatus,GetPendingExpenseCount,ApproveExpense,RejectExpense,GetTotalExpenses} = require('../controller/Expensecontroller');
const authMiddleware = require('../middleware/authMiddleware');
const expencerouter = express.Router();

expencerouter.post('/expenses',authMiddleware,CreateExpense);
expencerouter.get('/expenses/pending-count',authMiddleware,GetPendingExpenseCount);
expencerouter.get('/expenses/:employee_id',authMiddleware,GetExpensesByEmployee);
expencerouter.get('/expenses',authMiddleware,GetExpensesByUserAndStatus);
expencerouter.patch('/expenses/:id/approve',authMiddleware,ApproveExpense);
expencerouter.patch('/expenses/:id/reject',authMiddleware,RejectExpense);
expencerouter.get('/expenses/:employee_id/total',authMiddleware,GetTotalExpenses);


module.exports = expencerouter;