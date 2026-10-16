const db = require('../db/db');

const createExpense = (employee_id,expense_type,amount,description,
    expense_date,
    callback
) => {
    const sql = `
        INSERT INTO employee_expenses
        (employee_id, expense_type, amount, description, expense_date)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [employee_id, expense_type, amount, description, expense_date],
        callback
    );
};

// Existing employee expense list
const getExpensesByEmployee = (employee_id, callback) => {
    const sql = `
        SELECT *
        FROM employee_expenses
        WHERE employee_id = ?
        ORDER BY expense_date DESC
    `;

    db.query(sql, [employee_id], callback);
};

// API 31: Filter expenses by userId and status
const getExpensesByUserAndStatus = (userId, status, callback) => {
    let sql = `
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
            created_at AS createdAt
        FROM employee_expenses
        WHERE employee_id = ?
    `;

    const values = [userId];

    if (status) {
        sql += ` AND status = ?`;
        values.push(status);
    }

    sql += ` ORDER BY created_at DESC`;

    db.query(sql, values, callback);
};

// API 32: Count pending expense requests
const getPendingExpenseCount = (callback) => {
    const sql = `
        SELECT
            COUNT(*) AS count
        FROM employee_expenses
        WHERE status = 'pending'
    `;

    db.query(sql, callback);
};

// API 33: Approve a pending expense
const approveExpense = (id, callback) => {
    const sql = `
        UPDATE employee_expenses
        SET status = 'approved'
        WHERE id = ?
          AND status = 'pending'
    `;

    db.query(sql, [id], callback);
};

// API 33: Reject a pending expense
const rejectExpense = (id, callback) => {
    const sql = `
        UPDATE employee_expenses
        SET status = 'rejected'
        WHERE id = ?
          AND status = 'pending'
    `;

    db.query(sql, [id], callback);
};

// Existing function preserved
const getTotalExpenses = (employee_id, callback) => {
    const sql = `
        SELECT COALESCE(SUM(amount), 0) AS totalExpense
        FROM employee_expenses
        WHERE employee_id = ?
    `;

    db.query(sql, [employee_id], callback);
};

module.exports = {
    createExpense,
    getExpensesByEmployee,
    getExpensesByUserAndStatus,
    getPendingExpenseCount,
    approveExpense,
    rejectExpense,
    getTotalExpenses
};

