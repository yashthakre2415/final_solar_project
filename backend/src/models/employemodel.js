const db = require('../db/db');

const EmployeCreate = (admin_id, name, mobile, email, designation, address, callback) => {
    const sql = `INSERT INTO employees (admin_id, name, mobile, email, designation, address) VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(sql, [admin_id, name, mobile, email, designation, address], callback);
};

// scopeAdminId === null -> SuperAdmin (all rows); otherwise only that admin's rows.
const getAllEmployees = (scopeAdminId, callback) => {
    if (scopeAdminId === null) {
        return db.query('SELECT * FROM employees ORDER BY id DESC', callback);
    }
    db.query('SELECT * FROM employees WHERE admin_id = ? ORDER BY id DESC', [scopeAdminId], callback);
};

const getEmployeeById = (id, scopeAdminId, callback) => {
    if (scopeAdminId === null) return db.query('SELECT * FROM employees WHERE id = ?', [id], callback);
    db.query('SELECT * FROM employees WHERE id = ? AND admin_id = ?', [id, scopeAdminId], callback);
};

const updateEmployee = (id, scopeAdminId, name, mobile, email, designation, address, callback) => {
    let sql = `UPDATE employees SET name = ?, mobile = ?, email = ?, designation = ?, address = ? WHERE id = ?`;
    const params = [name, mobile, email, designation, address, id];
    if (scopeAdminId !== null) { sql += ' AND admin_id = ?'; params.push(scopeAdminId); }
    db.query(sql, params, callback);
};

const deleteEmployee = (id, scopeAdminId, callback) => {
    let sql = `DELETE FROM employees WHERE id = ?`;
    const params = [id];
    if (scopeAdminId !== null) { sql += ' AND admin_id = ?'; params.push(scopeAdminId); }
    db.query(sql, params, callback);
};

module.exports = { EmployeCreate, getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee };
