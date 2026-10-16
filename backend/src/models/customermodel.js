const db = require("../db/db");

// 1. Register customer + multiple addresses + site entries

const registerCustomer = (
    admin_id,
    name,
    mobile,
    email,
    addresses,
    callback
) => {
    db.beginTransaction((err) => {
        if (err) return callback(err);

        // 1. Customer create karo
        const customerSql = `
            INSERT INTO customers
            (admin_id, name, mobile, email)
            VALUES (?, ?, ?, ?)
        `;

        db.query(
            customerSql,
            [admin_id, name, mobile, email],
            (err, customerResult) => {
                if (err) {
                    return db.rollback(() => callback(err));
                }

                const customerId = customerResult.insertId;

                // 2. Customer ke saare addresses insert karo
                const addressValues = addresses.map((item) => [
                    customerId,
                    admin_id,
                    name,
                    mobile,
                    email,
                    item.address,
                    item.latitude ?? null,
                    item.longitude ?? null
                ]);

                const addressSql = `
                    INSERT INTO customer_addresses
                    (
                        customer_id,
                        admin_id,
                        name,
                        mobile,
                        email,
                        address,
                        latitude,
                        longitude
                    )
                    VALUES ?
                `;

                db.query(
                    addressSql,
                    [addressValues],
                    (err, addressResult) => {
                        if (err) {
                            return db.rollback(() => callback(err));
                        }

                        // 3. Har address ke liye site_name entry
                        const siteValues = addresses.map(() => [
                            customerId,
                            admin_id
                        ]);

                        const siteSql = `
                            INSERT INTO site_name
                            (customer_id, admin_id)
                            VALUES ?
                        `;

                        db.query(
                            siteSql,
                            [siteValues],
                            (err, siteResult) => {
                                if (err) {
                                    return db.rollback(() =>
                                        callback(err)
                                    );
                                }

                                // 4. Sab successful ho to save karo
                                db.commit((err) => {
                                    if (err) {
                                        return db.rollback(() =>
                                            callback(err)
                                        );
                                    }

                                    callback(null, {
                                        customerId,
                                        addressesAdded: addressResult.affectedRows,
                                        sitesAdded: siteResult.affectedRows
                                    });
                                });
                            }
                        );
                    }
                );
            }
        );
    });
};


// 2. Get all customers with addresses (scopeAdminId === null -> SuperAdmin, all rows)
const CUSTOMER_COLS = `
    c.id AS customer_id, c.admin_id, c.name, c.mobile, c.email,
    ca.id AS address_id, ca.address, ca.latitude, ca.longitude`;

const getAllCustomers = (scopeAdminId, callback) => {
    const sql = `
        SELECT ${CUSTOMER_COLS}
        FROM customers c
        LEFT JOIN customer_addresses ca ON ca.customer_id = c.id
        ${scopeAdminId === null ? '' : 'WHERE c.admin_id = ?'}
        ORDER BY c.id, ca.id`;
    db.query(sql, scopeAdminId === null ? [] : [scopeAdminId], callback);
};

// 3. Get customer by ID
const getCustomerById = (id, scopeAdminId, callback) => {
    const sql = `
        SELECT ${CUSTOMER_COLS}
        FROM customers c
        LEFT JOIN customer_addresses ca ON ca.customer_id = c.id
        WHERE c.id = ? ${scopeAdminId === null ? '' : 'AND c.admin_id = ?'}
        ORDER BY ca.id`;
    db.query(sql, scopeAdminId === null ? [id] : [id, scopeAdminId], callback);
};

// 4. Update customer details
const updateCustomer = (id, scopeAdminId, name, mobile, email, callback) => {
    let sql = `UPDATE customers SET name = ?, mobile = ?, email = ? WHERE id = ?`;
    const params = [name, mobile, email, id];
    if (scopeAdminId !== null) { sql += ' AND admin_id = ?'; params.push(scopeAdminId); }
    db.query(sql, params, callback);
};

// 5. Add another address + automatic site entry
const addCustomerAddress = (customer_id, scopeAdminId, address, latitude, longitude, callback) => {
    // The customer row supplies admin_id/name/mobile/email so the address row is complete.
    let customerSql = `SELECT id, admin_id, name, mobile, email FROM customers WHERE id = ?`;
    const customerParams = [customer_id];
    if (scopeAdminId !== null) { customerSql += ' AND admin_id = ?'; customerParams.push(scopeAdminId); }

    db.query(customerSql, customerParams, (err, rows) => {
        if (err) return callback(err);
        if (rows.length === 0) return callback({ status: 404, message: 'Customer not found' });
        const c = rows[0];

        db.beginTransaction((err) => {
            if (err) return callback(err);
            const addressSql = `
                INSERT INTO customer_addresses
                (customer_id, admin_id, name, mobile, email, address, latitude, longitude)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            db.query(addressSql, [c.id, c.admin_id, c.name, c.mobile, c.email, address, latitude, longitude],
                (err, addressResult) => {
                    if (err) return db.rollback(() => callback(err));
                    db.query(`INSERT INTO site_name (customer_id, admin_id) VALUES (?, ?)`, [c.id, c.admin_id],
                        (err, siteResult) => {
                            if (err) return db.rollback(() => callback(err));
                            db.commit((err) => {
                                if (err) return db.rollback(() => callback(err));
                                callback(null, { insertId: addressResult.insertId, siteId: siteResult.insertId });
                            });
                        });
                });
        });
    });
};

// 6. Delete customer
const deleteCustomer = (id, scopeAdminId, callback) => {
    let sql = `DELETE FROM customers WHERE id = ?`;
    const params = [id];
    if (scopeAdminId !== null) { sql += ' AND admin_id = ?'; params.push(scopeAdminId); }
    db.query(sql, params, callback);
};

module.exports = {
    registerCustomer,
    getAllCustomers,
    getCustomerById,
    updateCustomer,
    addCustomerAddress,
    deleteCustomer
};
