const db = require('../db/db');

const updateMonthlySalary = (employee_id, monthlySalary, callback) => {
    const sql = `
        INSERT INTO employee_salary
        (employee_id, monthly_salary)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
        monthly_salary = VALUES(monthly_salary)
    `;
    db.query(sql,[employee_id, monthlySalary],callback);};

const getMonthlySalary = (employee_id, callback) => {
    const sql = `
        SELECT
            id,
            employee_id,
            monthly_salary,
            created_at,
            updated_at
        FROM employee_salary
        WHERE employee_id = ?
    `;
    db.query(sql,[employee_id],callback);
};

const calculateMonthlySalary = (employee_id, month, year, callback) => {

    const sql = `
        SELECT
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
                        WHEN a.status = 'present' THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS presentCount,

            COALESCE(
                SUM(
                    CASE
                        WHEN a.status = 'paid_leave' THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS paidLeaveCount,

            COALESCE(
                SUM(
                    CASE
                        WHEN a.status = 'half_day' THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS halfDayCount,

            COALESCE(
                SUM(
                    CASE
                        WHEN a.status = 'unpaid_leave' THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS unpaidLeaveCount,

            COALESCE(
                SUM(
                    CASE
                        WHEN a.status = 'absent' THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS absentCount

        FROM employee_salary s

        LEFT JOIN attendance a
            ON s.employee_id = a.employee_id
            AND MONTH(a.attendance_date) = ?
            AND YEAR(a.attendance_date) = ?

        WHERE s.employee_id = ?

        GROUP BY s.employee_id, s.monthly_salary
    `;

    db.query(
        sql,
        [year, month, month, year, employee_id],
        (err, result) => {

            if (err) {
                return callback(err, null);
            }

            if (result.length === 0) {
                return callback(null, []);
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

            return callback(null, {
                totalDays,
                perDay: Number(perDay.toFixed(2)),
                presentCount,
                paidLeaveCount,
                halfDayCount,
                unpaidLeaveCount,
                absentCount,
                earnedBase: Number(earnedBase.toFixed(2)),
                totalApprovedExpenses: 0,
                finalSalary: Number(earnedBase.toFixed(2))
            });
        }
    );
};


module.exports = {updateMonthlySalary,getMonthlySalary,calculateMonthlySalary};