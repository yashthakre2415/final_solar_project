const db = require('../db/db');

const getOfficeExpenses = (callback) => {
    const sql = `
        SELECT
            id,
            title,
            amount,
            reason,
            receiptUrl,
            createdAt
        FROM office_expenses
        ORDER BY createdAt DESC
    `;
    db.query(sql, callback);
};

const createOfficeExpense = (
    title,
    amount,
    reason,
    receiptUrl,
    callback
) => {

    const sql = `
        INSERT INTO office_expenses
        (title, amount, reason, receiptUrl)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql,[title, amount, reason, receiptUrl],callback);
};

const deleteOfficeExpense = (id, callback) => {
    const sql = `
        DELETE FROM office_expenses
        WHERE id = ?
    `;
    db.query(sql, [id], callback);};

module.exports = {getOfficeExpenses,createOfficeExpense,deleteOfficeExpense};