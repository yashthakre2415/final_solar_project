const db = require('../db/db');

// scopeAdminId === null -> SuperAdmin (no filter). Otherwise a service is visible only
// if its customer belongs to that junior admin (services has no admin_id of its own).
const COLS = `
    services.id, services.customer_id, customers.name AS customer_name, customers.admin_id,
    services.service_type, services.problem, services.status, services.hold_reason,
    services.employee_id, employees.name AS employee_name,
    services.created_at, services.completed_at`;
const FROM = `
    FROM services
    JOIN customers ON services.customer_id = customers.id
    LEFT JOIN employees ON services.employee_id = employees.id`;

const scopeSql = (scope) => (scope === null ? '' : ' AND customers.admin_id = ?');
const scopeParams = (scope) => (scope === null ? [] : [scope]);

const createService = (customer_id, service_type, problem, callback) => {
    const sql = `INSERT INTO services(customer_id, service_type, problem) VALUES (?, ?, ?)`;
    db.query(sql, [customer_id, service_type, problem], callback);
};

const getAllServices = (scope, callback) => {
    db.query(`SELECT ${COLS} ${FROM} WHERE 1=1 ${scopeSql(scope)} ORDER BY services.id DESC`, scopeParams(scope), callback);
};

const getServiceById = (id, scope, callback) => {
    db.query(`SELECT ${COLS} ${FROM} WHERE services.id = ? ${scopeSql(scope)}`, [id, ...scopeParams(scope)], callback);
};

// Generic guarded transition: only updates when the current status is one of `fromStatuses`
// and the service belongs to the caller. affectedRows === 0 -> not found / wrong state.
const transition = (id, scope, fromStatuses, setSql, setParams, callback) => {
    const placeholders = fromStatuses.map(() => '?').join(',');
    const sql = `
        UPDATE services
        JOIN customers ON services.customer_id = customers.id
        SET ${setSql}
        WHERE services.id = ? AND services.status IN (${placeholders}) ${scopeSql(scope)}`;
    db.query(sql, [...setParams, id, ...fromStatuses, ...scopeParams(scope)], callback);
};

const assignEmployee = (employee_id, id, scope, callback) =>
    transition(id, scope, ['PENDING', 'ASSIGNED'], `services.employee_id = ?, services.status = 'ASSIGNED'`, [employee_id], callback);

const startService = (id, scope, callback) =>
    transition(id, scope, ['ASSIGNED'], `services.status = 'IN_PROGRESS'`, [], callback);

const holdService = (id, scope, hold_reason, callback) =>
    transition(id, scope, ['IN_PROGRESS'], `services.status = 'HOLD', services.hold_reason = ?`, [hold_reason], callback);

const resumeService = (id, scope, callback) =>
    transition(id, scope, ['HOLD'], `services.status = 'IN_PROGRESS', services.hold_reason = NULL`, [], callback);

const completeService = (id, scope, callback) =>
    transition(id, scope, ['IN_PROGRESS'], `services.status = 'COMPLETED', services.completed_at = CURRENT_TIMESTAMP`, [], callback);

const getServiceHistoryByCustomerId = (customerId, scope, callback) => {
    db.query(`SELECT ${COLS} ${FROM} WHERE services.customer_id = ? ${scopeSql(scope)} ORDER BY services.created_at DESC`,
        [customerId, ...scopeParams(scope)], callback);
};

module.exports = { createService, getAllServices, getServiceById, assignEmployee, startService, holdService, resumeService, completeService, getServiceHistoryByCustomerId };
