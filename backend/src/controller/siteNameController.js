const siteNameModel = require('../models/siteNameModel');
const { scopeAdminId, toId, findAccessibleCustomer, sendDbError } = require('../utils/access');

// POST /Site/sitename  { customer_id }   (admin_id is taken from the customer's owner)
const createSiteName = (req, res) => {
    const customer_id = toId(req.body && req.body.customer_id);
    if (!customer_id) return res.status(400).json({ success: false, message: 'Customer ID is required' });
    findAccessibleCustomer(req, customer_id, (err, customer) => {
        if (err) return sendDbError(res, err);
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
        siteNameModel.createSiteName(customer_id, customer.admin_id, (err, result) => {
            if (err) return sendDbError(res, err, 'Failed to create site entry');
            return res.status(201).json({
                success: true,
                message: 'Site entry created successfully',
                data: { id: result.insertId, customer_id, admin_id: customer.admin_id }
            });
        });
    });
};

// GET /Site/sitenames
const getSiteNames = (req, res) => {
    siteNameModel.getSiteNames(scopeAdminId(req), (err, rows) => {
        if (err) return sendDbError(res, err);
        return res.status(200).json({ success: true, sites: rows });
    });
};

module.exports = { createSiteName, getSiteNames };
