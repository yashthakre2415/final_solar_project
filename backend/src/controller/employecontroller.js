const { EmployeCreate, getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee } = require('../models/employemodel');
const { scopeAdminId, resolveCreateAdminId, toId, sendDbError } = require('../utils/access');

const clean = (v) => (typeof v === 'string' ? v.trim() : v);

const validateEmployee = (body) => {
    const name = clean(body.name);
    const mobile = clean(body.mobile);
    const email = clean(body.email);
    const designation = clean(body.designation);
    const address = clean(body.address);
    if (!name || !mobile || !email || !designation || !address) {
        return { error: 'Please fill all requirements (name, mobile, email, designation, address)' };
    }
    if (!/^[0-9+\-\s]{7,15}$/.test(String(mobile))) return { error: 'Mobile number is not valid' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) return { error: 'Email is not valid' };
    return { value: { name, mobile: String(mobile), email, designation, address } };
};

// POST /Employe/Employe_create
// Junior admin: admin_id comes from the JWT (body admin_id is ignored).
// SuperAdmin: must send admin_id of an existing junior admin.
const Employeecontroller = (req, res) => {
    const v = validateEmployee(req.body || {});
    if (v.error) return res.status(400).json({ message: v.error, success: false });

    resolveCreateAdminId(req, (err, admin_id) => {
        if (err) return sendDbError(res, err);
        const { name, mobile, email, designation, address } = v.value;
        EmployeCreate(admin_id, name, mobile, email, designation, address, (err, result) => {
            if (err) return sendDbError(res, err, 'Could not create employee');
            return res.status(201).json({
                message: 'Employee registration successful',
                success: true,
                Employee: { id: result.insertId, admin_id, name, mobile, email, designation, address }
            });
        });
    });
};

// GET /Employe/Employees
const GetAllEmployees = (req, res) => {
    getAllEmployees(scopeAdminId(req), (err, result) => {
        if (err) return sendDbError(res, err);
        return res.status(200).json({ message: 'Employees fetched successfully', success: true, employees: result });
    });
};

// GET /Employe/Employees/:id
const GetEmployeeById = (req, res) => {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Valid employee ID is required', success: false });
    getEmployeeById(id, scopeAdminId(req), (err, result) => {
        if (err) return sendDbError(res, err);
        if (result.length === 0) return res.status(404).json({ message: 'Employee not found', success: false });
        return res.status(200).json({ message: 'Employee found', success: true, employee: result[0] });
    });
};

// PUT /Employe/Employees/:id
const UpdateEmployee = (req, res) => {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Valid employee ID is required', success: false });
    const v = validateEmployee(req.body || {});
    if (v.error) return res.status(400).json({ message: v.error, success: false });
    const { name, mobile, email, designation, address } = v.value;
    updateEmployee(id, scopeAdminId(req), name, mobile, email, designation, address, (err, result) => {
        if (err) return sendDbError(res, err);
        // affectedRows is 1 when the row matched (mysql2 reports found rows by default).
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Employee not found', success: false });
        return res.status(200).json({ message: 'Employee updated successfully', success: true });
    });
};

// DELETE /Employe/Employees/:id
const DeleteEmployee = (req, res) => {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Valid employee ID is required', success: false });
    deleteEmployee(id, scopeAdminId(req), (err, result) => {
        if (err && err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ message: 'Employee has related records (services, attendance, ...) and cannot be deleted', success: false });
        }
        if (err) return sendDbError(res, err);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Employee not found', success: false });
        return res.status(200).json({ message: 'Employee deleted successfully', success: true });
    });
};

module.exports = { Employeecontroller, GetAllEmployees, GetEmployeeById, UpdateEmployee, DeleteEmployee };
