const db = require('../db/db');

const getWeeklyLeaderboard = (callback) => {
    const sql = `
        SELECT
            e.id,
            e.name,
            e.designation,
            COUNT(s.id) AS totalTasks,
            SUM(
                CASE
                    WHEN s.status = 'COMPLETED'
                    THEN 1
                    ELSE 0
                END
            ) AS completedTasks,
            SUM(
                CASE
                    WHEN s.status IN (
                        'PENDING',
                        'ASSIGNED',
                        'IN_PROGRESS',
                        'HOLD'
                    )
                    THEN 1
                    ELSE 0
                END
            ) AS pendingTasks
        FROM employees e
        LEFT JOIN services s
            ON e.id = s.employee_id
            AND s.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            AND s.created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
        GROUP BY
            e.id,
            e.name,
            e.designation
        ORDER BY
            completedTasks DESC,
            totalTasks DESC
    `;
    db.query(sql, (err, result) => {
        if (err) {
            return callback(err, null);
        }

        const leaderboard = result.map((employee) => {

            const totalTasks =
                Number(employee.totalTasks) || 0;

            const completedTasks =
                Number(employee.completedTasks) || 0;

            const pendingTasks =
                Number(employee.pendingTasks) || 0;

            let completionRate = 0;

            if (totalTasks > 0) {

                completionRate =
                    (completedTasks / totalTasks) * 100;

            }
            return {
                id: employee.id,

                name: employee.name,

                designation: employee.designation,

                totalTasks,

                completedTasks,

                pendingTasks,

                completionRate:
                    Number(completionRate.toFixed(2))
            };
        });


        return callback(null, leaderboard);
    });
};


module.exports = {getWeeklyLeaderboard};