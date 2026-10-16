const {getOfficeExpenses,createOfficeExpense,deleteOfficeExpense} = require('../models/OfficeExpensemodel');

const GetOfficeExpenses = (req, res) => {
    try {
        getOfficeExpenses((err, result) => {
            if (err) {
                console.log('Something went wrong', err);
                return res.status(500).json({
                    message: 'Something went wrong',
                    success: false
                });
            }
            return res.status(200).json({
                message: 'Office expenses fetched successfully',
                success: true,
                expenses: result
            });
        });
    } catch (err) {
        console.log('Internal server error', err);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};


const CreateOfficeExpense = (req, res) => {
    try {
        const {
            title,
            amount,
            reason
        } = req.body;

        if (!title || !amount) {
            return res.status(400).json({
                message: 'Title and amount are required',
                success: false
            });
        }
        const receiptUrl = req.file
            ? `/uploads/${req.file.filename}`
            : null;
        createOfficeExpense(
            title,
            amount,
            reason,
            receiptUrl,
            (err, result) => {
                if (err) {
                    console.log('Something went wrong', err);
                    return res.status(500).json({
                        message: 'Something went wrong',
                        success: false
                    });
                }
                return res.status(201).json({
                    message: 'Office expense created successfully',
                    success: true,
                    expense: {
                        id: result.insertId,
                        title,
                        amount,
                        reason,
                        receiptUrl
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

const DeleteOfficeExpense = (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                message: 'Expense ID is required',
                success: false
            });
        }
        deleteOfficeExpense(id, (err, result) => {
            if (err) {
                console.log('Something went wrong', err);

                return res.status(500).json({
                    message: 'Something went wrong',
                    success: false
                });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: 'Office expense not found',
                    success: false
                });
            }
            return res.status(200).json({
                message: 'Office expense deleted successfully',
                success: true
            });

        });
    } catch (err) {
        console.log('Internal server error', err);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};


module.exports = {GetOfficeExpenses,CreateOfficeExpense,DeleteOfficeExpense};