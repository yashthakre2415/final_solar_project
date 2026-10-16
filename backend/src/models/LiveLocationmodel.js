const db = require('../db/db');

const updateEmployeeLocation = (employee_id, latitude, longitude, callback) => {
    const sql = `
        INSERT INTO employee_locations
        (employee_id, latitude, longitude)
        VALUES (?, ?, ?)
    `;
    db.query(sql,[employee_id, latitude, longitude],callback);
};

const getCurrentEmployeeLocation = (employee_id, callback) => {
    const sql = `
        SELECT
            employee_id,
            latitude,
            longitude,
            created_at
        FROM employee_locations
        WHERE employee_id = ?
        ORDER BY created_at DESC
        LIMIT 1
    `;

    db.query(sql, [employee_id], callback);
};

const getEmployeeLocationHistory = (employee_id, callback) => {
    const sql = `
        SELECT
            employee_id,
            latitude,
            longitude,
            created_at
        FROM employee_locations
        WHERE employee_id = ?
        ORDER BY created_at DESC
    `;

    db.query(sql, [employee_id], callback);
};


module.exports = {updateEmployeeLocation,getCurrentEmployeeLocation,getEmployeeLocationHistory};