const db = require('../db/db');

const Adminregister = (name,mobile_no,email,password,City,address,subscription_title,callback)=>{
    const adminregister = `
        INSERT INTO junior_admins
        (name,mobile_no, email, password,City,address,subscription_title)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(adminregister,[name,mobile_no,email,password,City,address,subscription_title],callback);
}

const isAdmin = (email,callback)=>{
const isadmin = `
        SELECT * FROM junior_admins
        WHERE email = ?
    `;
    db.query(isadmin,[email],callback);
}

const getAdminById = (id, callback) => {
  const sql = `
    SELECT id, name, mobile_no, email, City, address, subscription_title, created_at
    FROM junior_admins
    WHERE id = ?
  `;

  db.query(sql, [id], callback);
};
module.exports = {Adminregister,isAdmin,getAdminById};