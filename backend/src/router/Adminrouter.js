const express = require('express');
const {Admincontroller,AdminLogin,GetAdminByID} = require('../controller/Admincontroller');
const superMiddleware = require('../middleware/superMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const { SuperAdminlogin } = require('../controller/Superadmincontroller');

const router2 = express.Router();

// SuperAdmin login — token ki zaroorat nahi
router2.post('/superadmin-login', SuperAdminlogin);

// Sirf SuperAdmin JuniorAdmin create karega
router2.post('/Junior_Admin_register',authMiddleware,superMiddleware('SuperAdmin'),Admincontroller);

// JuniorAdmin login — login par token nahi chahiye
router2.post('/junior_Admin_Login', AdminLogin);

// Sirf SuperAdmin JuniorAdmin ki details dekh sakta hai
router2.get('/junior_Admin/:id',authMiddleware,superMiddleware('SuperAdmin'),GetAdminByID);

module.exports = router2;
