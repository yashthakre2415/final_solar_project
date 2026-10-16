const db = require('../db/db');

const isSuperAdmin = (email,callback)=>{
    const check = `SELECT * FROM superadmins WHERE email = ?`;
    db.query(check,[email],callback);
};

const checksuperAdminExists = (callback) => {
    const sql = `SELECT * FROM superadmins LIMIT 1`;
    db.query(sql, callback);
};

const registerSuperAdmin = (name,email,password,callback)=>{
    const sql =  `INSERT INTO superadmins (name, email, password)VALUES (?, ?, ?)`;

    db.query(sql,[name,email,password],callback);
};

const CheckSuperAdmin = (callback) => {
    const sql = 'SELECT * FROM superadmins LIMIT 1';
    db.query(sql, callback);
};

const CreateSuperAdmin = (name, email, password, callback) => {
    const sql = `
        INSERT INTO superadmins (name, email, password)
        VALUES (?, ?, ?)
    `;

    db.query(sql, [name, email, password], callback);
};
module.exports = {isSuperAdmin,registerSuperAdmin,checksuperAdminExists, CheckSuperAdmin,
    CreateSuperAdmin};