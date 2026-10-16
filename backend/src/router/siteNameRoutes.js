const express = require('express');
const routersite = express.Router();
const siteNameController = require('../controller/siteNameController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireAdminPanelRole } = require('../utils/access');

routersite.use(authMiddleware, requireAdminPanelRole);
routersite.post('/sitename', siteNameController.createSiteName);
routersite.get('/sitenames', siteNameController.getSiteNames);

module.exports = routersite;
