const db = require('../db/db');

const getSalarySlip = (employee_id, month, year, callback) => {
    const salarySql = `
        SELECT
            e.id AS employee_id,
            e.name AS employee_name,
            e.designation,
            s.monthly_salary,
            DAY(
                LAST_DAY(
                    STR_TO_DATE(
                        CONCAT(?, '-', ?, '-01'),
                        '%Y-%m-%d'
                    )
                )
            ) AS totalDays,
            COALESCE(
                SUM(
                    CASE
                        WHEN a.status = 'present'
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS presentCount,
            COALESCE(
                SUM(
                    CASE
                        WHEN a.status = 'paid_leave'
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS paidLeaveCount,

            COALESCE(
                SUM(
                    CASE
                        WHEN a.status = 'half_day'
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS halfDayCount,

            COALESCE(
                SUM(
                    CASE
                        WHEN a.status = 'unpaid_leave'
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS unpaidLeaveCount,

            COALESCE(
                SUM(
                    CASE
                        WHEN a.status = 'absent'
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS absentCount

        FROM employees e

        JOIN employee_salary s
            ON e.id = s.employee_id

        LEFT JOIN attendance a
            ON e.id = a.employee_id
            AND MONTH(a.attendance_date) = ?
            AND YEAR(a.attendance_date) = ?

        WHERE e.id = ?

        GROUP BY
            e.id,
            e.name,
            e.designation,
            s.monthly_salary
    `;


    db.query(
        salarySql,
        [
            year,
            month,
            month,
            year,
            employee_id
        ],
        (err, salaryResult) => {

            if (err) {
                return callback(err, null);
            }

            if (salaryResult.length === 0) {
                return callback(null, []);
            }

            const expenseSql = `
                SELECT
                    id,
                    employee_id,
                    title,
                    amount,
                    reason,
                    status,
                    receiptUrl,
                    isPdf,
                    requestType,
                    adminNote,
                    created_at
                FROM employee_expenses
                WHERE employee_id = ?
                AND status = 'approved'
                ORDER BY created_at DESC
            `;


            db.query(
                expenseSql,
                [employee_id],
                (expenseErr, expenseResult) => {

                    if (expenseErr) {
                        return callback(expenseErr, null);
                    }

                    const attendanceSql = `
                        SELECT
                            id,
                            employee_id,
                            attendance_date,
                            status,
                            created_at
                        FROM attendance
                        WHERE employee_id = ?
                        AND MONTH(attendance_date) = ?
                        AND YEAR(attendance_date) = ?
                        ORDER BY attendance_date ASC
                    `;
                    db.query(
                        attendanceSql,
                        [
                            employee_id,
                            month,
                            year
                        ],
                        (attendanceErr, attendanceResult) => {

                            if (attendanceErr) {
                                return callback(
                                    attendanceErr,
                                    null
                                );
                            }

                            salaryResult[0].expenses =
                                expenseResult;

                            salaryResult[0].attendanceRecords =
                                attendanceResult;


                            return callback(
                                null,
                                salaryResult
                            );
                        }
                    );
                }
            );
        }
    );
};


module.exports = {getSalarySlip};