const express = require('express');
const {
    SuperAdminlogin,
    CreateFirstSuperAdmin
} = require('../controller/Superadmincontroller');
const router = express.Router();

// Sirf pehla SuperAdmin create karne ke liye
router.post('/setup-first-superadmin', CreateFirstSuperAdmin);

// Existing SuperAdmin login
router.post('/SuperAdmin_Login', SuperAdminlogin);

module.exports = router;
