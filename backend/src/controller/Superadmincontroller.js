const jwt = require('jsonwebtoken');
const {isSuperAdmin,registerSuperAdmin, checksuperAdminExists, CheckSuperAdmin, CreateSuperAdmin} = require("../models/Superadminmodel");

const Superadmincontroller = (req,res)=>{
    try{
       const {name,email,password} = req.body;
   
       if(!name || !email || !password){
        console.log(`Please fill all given information`);
        return res.status(400).json({message:'Not filled all fields'});
       }
      
      checksuperAdminExists((err,result)=>{
        if(err){
            console.log('something went wrong',err);
            return res.status(500).json({message:'something went wrong',err});
        }
        if(result.length > 0 ){
          console.log('Admin already exist');
          return res.status(409).json({message:'Only one Super admin can being',success:false})
        }
            registerSuperAdmin(name,email,password,(err,result)=>{
        if(err){
            console.log(`something went wrong ${err}`);
            return res.status(500).json({message:'something went wrong',success:false}); 
        }
          return res.status(201).json({
            message: 'SuperAdmin registration successful',
            success: true,
            Admin:{name,email}
        });
       })
      })
    
    }catch(err){
         console.log(`Internal server error ${err}`);
         return res.status(500).json({message:'Internal server error',success:false})
    }
}

const SuperAdminlogin = (req,res)=>{
    try{
        const {email,password} = req.body;
        if(!email || !password){
            console.log('Email or Password are required');
            return res.status(400).json({message:'Please Enter Email or password',success:false});
        }
       isSuperAdmin(email,(err,result)=>{
        if(err){
            console.log('something went wrong',err);
            return res.status(500).json({message:'something went wrong',success:false});
        }
        if(result.length === 0){
            return res.status(404).json({message:'user not found',success:false});
        }

         const Superadmin = result[0];

         if(Superadmin.password !== password){
            return res.status(500).json({message:'Password incorrect',success:false});
            
         }

          const token = jwt.sign(
                      {
                      id: Superadmin.id,
                      email: Superadmin.email,
                      role: 'SuperAdmin'
                      },
                      process.env.JWT_SECRET,
                      {
                      expiresIn: '7d'
                     }
         );
         return res.status(200).json({message:'Login Successfully',success:true,token, Superadmin:{
            id: Superadmin.id,
            name: Superadmin.name,
            email: Superadmin.email}
         });
       })

    }catch(err){
        console.log(err)
         return res.status(500).json({message:'internal server error',success:false,err})
    }
}

const CreateFirstSuperAdmin = (req, res) => {
    const { name, email, password, setupKey } = req.body;

    if (setupKey !== process.env.SUPERADMIN_SETUP_KEY) {
        return res.status(403).json({
            message: 'Invalid setup key'
        });
    }

    if (!name || !email || !password) {
        return res.status(400).json({
            message: 'Name, email and password required'
        });
    }

    CheckSuperAdmin((err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: 'Database error',
                error: err.message
            });
        }

        if (rows.length > 0) {
            return res.status(403).json({
                message: 'SuperAdmin already exists'
            });
        }

        CreateSuperAdmin(name, email, password, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: 'SuperAdmin creation failed',
                    error: err.message
                });
            }

            return res.status(201).json({
                message: 'First SuperAdmin created successfully'
            });
        });
    });
};
module.exports = {
    Superadmincontroller,
    SuperAdminlogin,
    CreateFirstSuperAdmin,
    
};