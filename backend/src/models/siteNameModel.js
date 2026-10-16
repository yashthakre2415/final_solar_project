const db = require('../db/db');

const createSiteName = (customer_id, admin_id, callback) => {
    db.query('INSERT INTO site_name (customer_id, admin_id) VALUES (?, ?)', [customer_id, admin_id], callback);
};

const getSiteNames = (scopeAdminId, callback) => {
    const where = scopeAdminId === null ? '' : 'WHERE s.admin_id = ?';
    db.query(`
        SELECT s.id, s.customer_id, s.admin_id, c.name AS customer_name
        FROM site_name s
        JOIN customers c ON c.id = s.customer_id
        ${where}
        ORDER BY s.id DESC`, scopeAdminId === null ? [] : [scopeAdminId], callback);
};

module.exports = { createSiteName, getSiteNames };
