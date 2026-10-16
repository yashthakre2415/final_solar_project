const {createExpense,getExpensesByEmployee,getExpensesByUserAndStatus,getTotalExpenses,getPendingExpenseCount,approveExpense,rejectExpense} = require('../models/Expensemodel');

const CreateExpense = (req, res) => {
    try {
        const {employee_id,expense_type,amount,description,expense_date} = req.body;
        if (!employee_id ||!expense_type ||amount === undefined ||!expense_date) {
            return res.status(400).json({
                message: 'Employee ID, expense type, amount and expense date are required',
                success: false
            });
        }
        if (amount < 0) {
            return res.status(400).json({
                message: 'Amount cannot be negative',
                success: false
            });
        }
        createExpense(employee_id,expense_type,amount,description,expense_date,(err, result) => {
                if (err) {
                    console.log('Something went wrong', err);
                    return res.status(500).json({
                        message: 'Something went wrong',
                        success: false
                    });
                }
                return res.status(201).json({
                    message: 'Expense created successfully',
                    success: true,
                    expense: {
                        id: result.insertId,
                        employee_id,
                        expense_type,
                        amount,
                        description,
                        expense_date
                    }
                });
            }
        );
    } catch (err) {
        console.log('Internal server error', err);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

const GetExpensesByEmployee = (req, res) => {
    try {
        const { employee_id } = req.params;
        if (!employee_id) {
            return res.status(400).json({
                message: 'Employee ID is required',
                success: false
            });
        }

        getExpensesByEmployee(employee_id,(err, result) => {
                if (err) {
                    console.log('Something went wrong', err);
                    return res.status(500).json({
                        message: 'Something went wrong',
                        success: false
                    });
                }
                return res.status(200).json({
                    message: 'Expenses fetched successfully',
                    success: true,
                    expenses: result
                });
            }
        );
    } catch (err) {
        console.log('Internal server error', err);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

const GetExpensesByUserAndStatus = (req, res) => {
    try {
        const { userId, status } = req.query;
        if (!userId) {
            return res.status(400).json({
                message: 'User ID is required',
                success: false
            });
        }
        const allowedStatus = ['pending','approved','rejected'];
        if (status && !allowedStatus.includes(status)) {
            return res.status(400).json({
                message: 'Status must be pending, approved or rejected',
                success: false
            });
        }

        getExpensesByUserAndStatus(userId,status,(err, result) => {
                if (err) {
                    console.log('Something went wrong', err);
                    return res.status(500).json({
                        message: 'Something went wrong',
                        success: false
                    });
                }
                return res.status(200).json({
                    message: 'Expenses fetched successfully',
                    success: true,
                    expenses: result
                });
            }
        );
    } catch (err) {
        console.log('Internal server error', err);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

const GetPendingExpenseCount = (req, res) => {
    try {
        getPendingExpenseCount(
            (err, result) => {
                if (err) {
                    console.log('Something went wrong', err);
                    return res.status(500).json({
                        message: 'Something went wrong',
                        success: false
                    });
                }
                return res.status(200).json({
                    message: 'Pending expense count fetched successfully',
                    success: true,
                    pendingCount: Number(result[0].pendingCount)
                });
            }
        );
    } catch (err) {
        console.log('Internal server error', err);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

const ApproveExpense = (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                message: 'Expense ID is required',
                success: false
            });
        }

        approveExpense(id,(err, result) => {
                if (err) {
                    console.log('Something went wrong', err);
                    return res.status(500).json({
                        message: 'Something went wrong',
                        success: false
                    });
                }

                if (result.matchedrows === 0) {
                    return res.status(404).json({
                        message: 'Expense not found',
                        success: false
                    });
                }

                return res.status(200).json({
                    message: 'Expense approved successfully',
                    success: true
                });
            }
        );
    } catch (err) {
        console.log('Internal server error', err);

        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

const RejectExpense = (req, res) => {

    try {

        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                message: 'Expense ID is required',
                success: false
            });
        }

        rejectExpense(
            id,
            (err, result) => {

                if (err) {
                    console.log('Something went wrong', err);

                    return res.status(500).json({
                        message: 'Something went wrong',
                        success: false
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        message: 'Expense not found',
                        success: false
                    });
                }

                return res.status(200).json({
                    message: 'Expense rejected successfully',
                    success: true
                });
            }
        );

    } catch (err) {

        console.log('Internal server error', err);

        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

const GetTotalExpenses = (req, res) => {

    try {

        const { employee_id } = req.params;

        if (!employee_id) {
            return res.status(400).json({
                message: 'Employee ID is required',
                success: false
            });
        }

        getTotalExpenses(
            employee_id,
            (err, result) => {

                if (err) {
                    console.log('Something went wrong', err);

                    return res.status(500).json({
                        message: 'Something went wrong',
                        success: false
                    });
                }

                return res.status(200).json({
                    message: 'Total expenses fetched successfully',
                    success: true,
                    totalExpense: Number(result[0].totalExpense)
                });
            }
        );

    } catch (err) {

        console.log('Internal server error', err);

        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};


module.exports = {CreateExpense,GetExpensesByEmployee,GetExpensesByUserAndStatus,GetPendingExpenseCount,ApproveExpense,RejectExpense,GetTotalExpenses};