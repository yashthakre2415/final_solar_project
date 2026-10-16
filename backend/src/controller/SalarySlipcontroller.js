const { getSalarySlip } = require('../models/SalarySlipmodel');

const GetSalarySlip = (req, res) => {
    try {
        const { userId } = req.params;
        const { month, year } = req.query;
        if (!userId || !month || !year) {
            return res.status(400).json({
                message: 'Employee ID, month and year are required',
                success: false
            });
        }
        getSalarySlip(
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
                if (result.length === 0) {
                    return res.status(404).json({
                        message: 'Salary slip data not found',
                        success: false
                    });
                }
                const data = result[0];


                const monthlySalary =
                    Number(data.monthly_salary);

                const totalDays =
                    Number(data.totalDays);

                const presentCount =
                    Number(data.presentCount) || 0;

                const paidLeaveCount =
                    Number(data.paidLeaveCount) || 0;

                const halfDayCount =
                    Number(data.halfDayCount) || 0;

                const unpaidLeaveCount =
                    Number(data.unpaidLeaveCount) || 0;

                const absentCount =
                    Number(data.absentCount) || 0;


                const perDay =
                    monthlySalary / totalDays;

                const earnedBase =
                    (presentCount * perDay) +
                    (paidLeaveCount * perDay) +
                    (halfDayCount * perDay * 0.5);


                const totalApprovedLoans = 0;

                const finalSalary =
                    earnedBase + totalApprovedLoans;

                return res.status(200).json({

                    message: 'Salary slip fetched successfully',

                    success: true,

                    user: {
                        id: data.employee_id,
                        name: data.employee_name,
                        designation: data.designation
                    },


                    calculation: {

                        month: Number(month),

                        year: Number(year),

                        monthlySalary:
                            Number(monthlySalary.toFixed(2)),

                        totalDays,

                        perDay:
                            Number(perDay.toFixed(2)),

                        presentCount,

                        paidLeaveCount,

                        halfDayCount,

                        unpaidLeaveCount,

                        absentCount,

                        earnedBase:
                            Number(earnedBase.toFixed(2)),

                        totalApprovedLoans,

                        finalSalary:
                            Number(finalSalary.toFixed(2))
                    },

                    expenses: data.expenses || [],

                    attendanceRecords:
                        data.attendanceRecords || []

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

module.exports = {GetSalarySlip};