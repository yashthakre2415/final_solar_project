// Shared helpers for tenant (admin) scoping.
// JWT payloads issued by this backend:
//   SuperAdmin   -> { id, email, role: 'SuperAdmin' }
//   Junior Admin -> { id, role: 'junior_admin' }
const db = require('../db/db');

const isSuper = (req) => req.user && req.user.role === 'SuperAdmin';
const isJunior = (req) => req.user && req.user.role === 'junior_admin';

// Only SuperAdmin and Junior Admin tokens may use the admin-panel APIs.
const requireAdminPanelRole = (req, res, next) => {
    if (isSuper(req) || isJunior(req)) return next();
    return res.status(403).json({ success: false, message: 'Access denied' });
};

// Junior admin -> their own id. SuperAdmin -> null (sees everything).
const scopeAdminId = (req) => (isJunior(req) ? req.user.id : null);

// Resolve the admin_id to store on a new row.
// Junior admin: always the token's id (body value is ignored).
// SuperAdmin: must pass admin_id in the body and it must be a real junior admin.
const resolveCreateAdminId = (req, callback) => {
    if (isJunior(req)) return callback(null, req.user.id);
    const adminId = Number(req.body && req.body.admin_id);
    if (!Number.isInteger(adminId) || adminId <= 0) {
        return callback({ status: 400, message: 'admin_id is required when creating as SuperAdmin' });
    }
    db.query('SELECT id FROM junior_admins WHERE id = ?', [adminId], (err, rows) => {
        if (err) return callback(err);
        if (rows.length === 0) return callback({ status: 400, message: 'admin_id does not match a Junior Admin' });
        callback(null, adminId);
    });
};

const toId = (v) => {
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : null;
};

// Calls back with the employee row if the caller may access it, else null.
const findAccessibleEmployee = (req, employeeId, callback) => {
    const scope = scopeAdminId(req);
    const sql = scope === null
        ? 'SELECT * FROM employees WHERE id = ?'
        : 'SELECT * FROM employees WHERE id = ? AND admin_id = ?';
    const params = scope === null ? [employeeId] : [employeeId, scope];
    db.query(sql, params, (err, rows) => callback(err, rows && rows[0] ? rows[0] : null));
};

// Same for customers.
const findAccessibleCustomer = (req, customerId, callback) => {
    const scope = scopeAdminId(req);
    const sql = scope === null
        ? 'SELECT * FROM customers WHERE id = ?'
        : 'SELECT * FROM customers WHERE id = ? AND admin_id = ?';
    const params = scope === null ? [customerId] : [customerId, scope];
    db.query(sql, params, (err, rows) => callback(err, rows && rows[0] ? rows[0] : null));
};

// Express guard: validates :param as an id and checks the employee is accessible.
const guardEmployee = (getRawId) => (req, res, next) => {
    const id = toId(getRawId(req));
    if (!id) return res.status(400).json({ success: false, message: 'Valid employee ID is required' });
    findAccessibleEmployee(req, id, (err, emp) => {
        if (err) {
            console.error('guardEmployee error:', err);
            return res.status(500).json({ success: false, message: 'Something went wrong' });
        }
        if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
        req.employeeRow = emp;
        next();
    });
};

const sendDbError = (res, err, fallback = 'Something went wrong') => {
    if (err && err.status) return res.status(err.status).json({ success: false, message: err.message });
    if (err && err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'A record with these details already exists' });
    }
    console.error(fallback + ':', err);
    return res.status(500).json({ success: false, message: fallback });
};

module.exports = {
    isSuper, isJunior, requireAdminPanelRole, scopeAdminId, resolveCreateAdminId,
    toId, findAccessibleEmployee, findAccessibleCustomer, guardEmployee, sendDbError
};
