const db = require('../db/db');

// One record per employee per day: updates the status if the day is already marked.
// callback(err, { id, updated })
const createAttendance = (employee_id, attendance_date, status, callback) => {
    db.query('SELECT id FROM attendance WHERE employee_id = ? AND attendance_date = ?', [employee_id, attendance_date], (err, rows) => {
        if (err) return callback(err);
        if (rows.length > 0) {
            return db.query('UPDATE attendance SET status = ? WHERE id = ?', [status, rows[0].id], (err) =>
                callback(err, { insertId: rows[0].id, updated: true }));
        }
        db.query(`INSERT INTO attendance (employee_id, attendance_date, status) VALUES (?, ?, ?)`,
            [employee_id, attendance_date, status], (err, result) =>
                callback(err, result && { insertId: result.insertId, updated: false }));
    });
};

const getAttendanceByEmployee = (employee_id, month, year, callback) => {
    const sql = `
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
    db.query(sql,[employee_id, month, year],callback);
};

const getAttendanceSummary = (employee_id, month, year, callback) => {
    const sql = `
        SELECT
            COUNT(*) AS totalDays,
            SUM(
                CASE
                    WHEN status = 'present' THEN 1
                    ELSE 0
                END
            ) AS presentCount,
            SUM(
                CASE
                    WHEN status = 'paid_leave' THEN 1
                    ELSE 0
                END
            ) AS paidLeaveCount,

            SUM(
                CASE
                    WHEN status = 'unpaid_leave' THEN 1
                    ELSE 0
                END
            ) AS unpaidLeaveCount,

            SUM(
                CASE
                    WHEN status = 'half_day' THEN 1
                    ELSE 0
                END
            ) AS halfDayCount,

            SUM(
                CASE
                    WHEN status = 'absent' THEN 1
                    ELSE 0
                END
            ) AS absentCount

        FROM attendance

        WHERE employee_id = ?
        AND MONTH(attendance_date) = ?
        AND YEAR(attendance_date) = ?
    `;
    db.query(sql,[employee_id, month, year],callback);
};

module.exports = {createAttendance,getAttendanceByEmployee,getAttendanceSummary};