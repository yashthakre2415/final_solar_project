const express = require('express');
const {CreateAttendance,GetAttendanceByEmployee,GetAttendanceSummary} = require('../controller/Attendancecontroller');
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdminPanelRole, guardEmployee } = require('../utils/access');
const Attendencerouter = express.Router();

const auth = [authMiddleware, requireAdminPanelRole];

Attendencerouter.post('/attendance', auth, guardEmployee((req) => req.body && req.body.employee_id), CreateAttendance);
Attendencerouter.get('/attendance/:employee_id', auth, guardEmployee((req) => req.params.employee_id), GetAttendanceByEmployee);
Attendencerouter.get('/attendance/:employee_id/summary', auth, guardEmployee((req) => req.params.employee_id), GetAttendanceSummary);

module.exports = Attendencerouter;
