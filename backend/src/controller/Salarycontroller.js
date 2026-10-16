const {updateMonthlySalary,getMonthlySalary, calculateMonthlySalary} = require('../models/Salarymodel');

const UpdateMonthlySalary = (req, res) => {
    try {
        const { userId } = req.params;
        const { monthlySalary } = req.body;
        if (!userId || monthlySalary === undefined) {
            return res.status(400).json({
                message: 'Employee ID and monthly salary are required',
                success: false
            });
        }
        if (monthlySalary < 0) {
            return res.status(400).json({
                message: 'Monthly salary cannot be negative',
                success: false
            });
        }
        updateMonthlySalary(userId,monthlySalary,(err, result) => {
               if (err) {
                console.log('Something went wrong', err);

                 return res.status(500).json({
                        message: 'Something went wrong',
                        success: false
                    });
                }

                return res.status(200).json({
                    message: 'Monthly salary updated successfully',
                    success: true,
                    salary: {
                        employee_id: userId,
                        monthlySalary: monthlySalary
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

const GetMonthlySalary = (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({
                message: 'Employee ID is required',
                success: false
            });
        }
        getMonthlySalary(userId,(err, result) => {

                if (err) {
                    console.log('Something went wrong', err);

                    return res.status(500).json({
                        message: 'Something went wrong',
                        success: false
                    });
                }

                if (result.length === 0) {
                    return res.status(404).json({
                        message: 'Salary not found',
                        success: false
                    });
                }

                return res.status(200).json({
                    message: 'Salary fetched successfully',
                    success: true,
                    salary: result[0]
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


const CalculateMonthlySalary = (req, res) => {
    try {

        const { userId } = req.params;
        const { month, year } = req.query;

        if (!userId || !month || !year) {
            return res.status(400).json({
                message: 'Employee ID, month and year are required',
                success: false
            });
        }

        calculateMonthlySalary(
            userId,
            month,
            year,
            (err, result) => {

                if (err) {
                    console.log('Something went wrong', err);

                    return res.status(500).json({
                        message: 'Something went wrong',
                        success: false
                    });
                }

                if (!result) {
                    return res.status(404).json({
                        message: 'Salary calculation data not found',
                        success: false
                    });
                }

                return res.status(200).json({
                    message: 'Salary calculated successfully',
                    success: true,
                    salary: result
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
module.exports = {UpdateMonthlySalary,GetMonthlySalary,CalculateMonthlySalary};