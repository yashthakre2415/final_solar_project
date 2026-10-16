const { scopeAdminId, resolveCreateAdminId, toId, sendDbError } = require("../utils/access");
const {registerCustomer,getAllCustomers,getCustomerById,updateCustomer,addCustomerAddress,deleteCustomer} = require("../models/customermodel");

// 1. Register customer + multiple addresses + site entries
// POST /Customer/Customer_Create  { name, mobile, email, addresses:[{address, latitude, longitude}] }
// admin_id comes from the JWT (junior admin) or the body (SuperAdmin).
const Customercontroller = (req, res) => {
    const { name, mobile, email, addresses } = req.body || {};
    if (!name || !mobile || !email || !Array.isArray(addresses) || addresses.length === 0 ||
        addresses.some((item) => !item || !item.address || item.latitude == null || item.longitude == null ||
            Number.isNaN(Number(item.latitude)) || Number.isNaN(Number(item.longitude)))) {
        return res.status(400).json({
            message: "Customer details and valid addresses are required",
            success: false
        });
    }
    resolveCreateAdminId(req, (err, admin_id) => {
        if (err) return sendDbError(res, err);
        registerCustomer(admin_id, name, mobile, email, addresses, (err, result) => {
            if (err) {
                console.error("Customer registration error:", err);
                return res.status(500).json({ message: "Customer registration failed", success: false });
            }
            return res.status(201).json({
                message: "Customer registered successfully",
                success: true,
                customer_id: result.customerId,
                admin_id,
                addresses_added: result.addressesAdded,
                sites_added: result.sitesAdded
            });
        });
    });
};

// 2. Get all customers
const GetAllCustomers = (req, res) => {
    getAllCustomers(scopeAdminId(req), (err, result) => {
        if (err) {
            console.error("Get all customers error:", err);

            return res.status(500).json({
                message: "Could not fetch customers",
                success: false
            });
        }

        return res.status(200).json({
            message: "Customers fetched successfully",
            success: true,
            Customers: result
        });
    });
};

// 3. Get customer by ID
const GetCustomerById = (req, res) => {
    const { id } = req.params;

    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({
            message: "Valid customer ID is required",
            success: false
        });
    }

    getCustomerById(id, scopeAdminId(req), (err, result) => {
        if (err) {
            console.error("Get customer error:", err);

            return res.status(500).json({
                message: "Could not fetch customer",
                success: false
            });
        }

        if (!result || result.length === 0) {
            return res.status(404).json({
                message: "Customer not found",
                success: false
            });
        }

        return res.status(200).json({
            message: "Customer fetched successfully",
            success: true,
            customer: result
        });
    });
};

// 4. Update customer basic details
const UpdateCustomer = (req, res) => {
    const { id } = req.params;
    const { name, mobile, email } = req.body;

    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({
            message: "Valid customer ID is required",
            success: false
        });
    }

    if (!name || !mobile || !email) {
        return res.status(400).json({
            message: "Name, mobile and email are required",
            success: false
        });
    }

    updateCustomer(id, scopeAdminId(req), name, mobile, email, (err, result) => {
        if (err) {
            console.error("Update customer error:", err);

            return res.status(500).json({
                message: "Customer update failed",
                success: false
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Customer not found",
                success: false
            });
        }

        return res.status(200).json({
            message: "Customer updated successfully",
            success: true
        });
    });
};

// 5. Add another address to an existing customer
// POST /Customer/Customers/:id/addresses  { address, latitude, longitude }
const AddCustomerAddress = (req, res) => {
    const id = toId(req.params.id);
    const { address, latitude, longitude } = req.body || {};
    if (!id || !address || latitude == null || longitude == null ||
        Number.isNaN(Number(latitude)) || Number.isNaN(Number(longitude))) {
        return res.status(400).json({
            message: "Customer and valid address details are required",
            success: false
        });
    }
    addCustomerAddress(id, scopeAdminId(req), address, latitude, longitude, (err, result) => {
        if (err) return sendDbError(res, err, "Could not add customer address");
        return res.status(201).json({
            message: "Customer address added successfully",
            success: true,
            address_id: result.insertId
        });
    });
};

// 6. Delete customer
const DeleteCustomer = (req, res) => {
    const { id } = req.params;

    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({
            message: "Valid customer ID is required",
            success: false
        });
    }

    deleteCustomer(id, scopeAdminId(req), (err, result) => {
        if (err) {
            console.error("Delete customer error:", err);

            return res.status(500).json({
                message: "Customer deletion failed",
                success: false
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Customer not found",
                success: false
            });
        }

        return res.status(200).json({
            message: "Customer deleted successfully",
            success: true
        });
    });
};

module.exports = {
    Customercontroller,
    GetAllCustomers,
    GetCustomerById,
    UpdateCustomer,
    AddCustomerAddress,
    DeleteCustomer
};
