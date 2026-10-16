const express = require('express');
const multer = require('multer');
const {GetOfficeExpenses,CreateOfficeExpense, DeleteOfficeExpense} = require('../controller/OfficeExpensecontroller');
const authMiddleware = require('../middleware/authMiddleware');
const officerouter = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/uploads/');
    },
    filename: (req, file, cb) => {
        const fileName = Date.now() + '-' + file.originalname;
        cb(null, fileName);
    }
});
const upload = multer({
    storage: storage
});


officerouter.get('/office-expense',authMiddleware,GetOfficeExpenses);
officerouter.post('/office-expense',authMiddleware,upload.single('receipt'),CreateOfficeExpense);
officerouter.delete('/office-expense/:id',authMiddleware,DeleteOfficeExpense);

module.exports = officerouter;