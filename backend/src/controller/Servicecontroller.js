const M = require('../models/Servicemodel');
const { scopeAdminId, toId, findAccessibleCustomer, findAccessibleEmployee, sendDbError } = require('../utils/access');

const bad = (res, message) => res.status(400).json({ message, success: false });

// POST /Service/service_create  { customer_id, service_type, problem? }
const CreateService = (req, res) => {
    const customer_id = toId(req.body && req.body.customer_id);
    const service_type = req.body && typeof req.body.service_type === 'string' ? req.body.service_type.trim() : '';
    const problem = req.body && req.body.problem ? req.body.problem : null;
    if (!customer_id || !service_type) return bad(res, 'Customer ID and service type are required');

    findAccessibleCustomer(req, customer_id, (err, customer) => {
        if (err) return sendDbError(res, err);
        if (!customer) return res.status(404).json({ message: 'Customer not found', success: false });
        M.createService(customer_id, service_type, problem, (err, result) => {
            if (err) return sendDbError(res, err);
            return res.status(201).json({
                message: 'Service created successfully',
                success: true,
                service: { id: result.insertId, customer_id, service_type, problem, status: 'PENDING' }
            });
        });
    });
};

const GetAllServices = (req, res) => {
    M.getAllServices(scopeAdminId(req), (err, result) => {
        if (err) return sendDbError(res, err);
        return res.status(200).json({ message: 'Services fetched successfully', success: true, services: result });
    });
};

const GetServiceById = (req, res) => {
    const id = toId(req.params.id);
    if (!id) return bad(res, 'Valid service ID is required');
    M.getServiceById(id, scopeAdminId(req), (err, result) => {
        if (err) return sendDbError(res, err);
        if (result.length === 0) return res.status(404).json({ message: 'Service not found', success: false });
        return res.status(200).json({ message: 'Service found', success: true, service: result[0] });
    });
};

// PUT /Service/services/:id/Assign  { employee_id }
const AssignEmployee = (req, res) => {
    const id = toId(req.params.id);
    const employee_id = toId(req.body && req.body.employee_id);
    if (!id || !employee_id) return bad(res, 'Employee ID and Service ID are required');

    M.getServiceById(id, scopeAdminId(req), (err, rows) => {
        if (err) return sendDbError(res, err);
        if (rows.length === 0) return res.status(404).json({ message: 'Service not found', success: false });
        findAccessibleEmployee(req, employee_id, (err, emp) => {
            if (err) return sendDbError(res, err);
            if (!emp) return res.status(404).json({ message: 'Employee not found', success: false });
            // The employee must belong to the same admin as the customer.
            if (emp.admin_id !== rows[0].admin_id) {
                return bad(res, 'Employee does not belong to the same admin as the customer');
            }
            M.assignEmployee(employee_id, id, scopeAdminId(req), (err, result) => {
                if (err) return sendDbError(res, err);
                if (result.affectedRows === 0) return res.status(409).json({ message: 'Service can only be (re)assigned while PENDING or ASSIGNED', success: false });
                return res.status(200).json({ message: 'Employee assigned successfully', success: true });
            });
        });
    });
};

const stateAction = (fn, okMessage, conflictMessage, needsReason) => (req, res) => {
    const id = toId(req.params.id);
    if (!id) return bad(res, 'Valid service ID is required');
    const args = [id, scopeAdminId(req)];
    if (needsReason) {
        const reason = req.body && typeof req.body.hold_reason === 'string' ? req.body.hold_reason.trim() : '';
        if (!reason) return bad(res, 'Service ID and hold reason are required');
        args.push(reason);
    }
    fn(...args, (err, result) => {
        if (err) return sendDbError(res, err);
        if (result.affectedRows === 0) {
            // Distinguish "does not exist / not yours" from "wrong state".
            return M.getServiceById(id, scopeAdminId(req), (e, rows) => {
                if (e) return sendDbError(res, e);
                if (rows.length === 0) return res.status(404).json({ message: 'Service not found', success: false });
                return res.status(409).json({ message: `${conflictMessage} (current status: ${rows[0].status})`, success: false });
            });
        }
        return res.status(200).json({ message: okMessage, success: true });
    });
};

const StartService = stateAction(M.startService, 'Service started successfully', 'Only an ASSIGNED service can be started');
const HoldService = stateAction(M.holdService, 'Service put on hold successfully', 'Only an IN_PROGRESS service can be put on hold', true);
const ResumeService = stateAction(M.resumeService, 'Service resumed successfully', 'Only a HOLD service can be resumed');
const CompleteService = stateAction(M.completeService, 'Service completed successfully', 'Only an IN_PROGRESS service can be completed');

// GET /Service/services/:id/History   (:id is the CUSTOMER id)
const GetHistoryByCustomerID = (req, res) => {
    const id = toId(req.params.id);
    if (!id) return bad(res, 'Customer ID is required');
    M.getServiceHistoryByCustomerId(id, scopeAdminId(req), (err, result) => {
        if (err) return sendDbError(res, err);
        if (result.length === 0) return res.status(404).json({ message: 'No history', success: false });
        return res.status(200).json({ message: 'History here', success: true, History: result });
    });
};

module.exports = { CreateService, GetAllServices, GetServiceById, AssignEmployee, StartService, HoldService, ResumeService, CompleteService, GetHistoryByCustomerID };
