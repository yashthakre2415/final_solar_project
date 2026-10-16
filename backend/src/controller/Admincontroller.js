const { Adminregister, isAdmin, getAdminById } = require("../models/Adminmodel");
const jwt = require('jsonwebtoken');

const Admincontroller = (req,res)=>{
    try{
        const {name,mobile_no,email,password,City,address,subscription_title} = req.body;
        if(!name || !mobile_no|| !email || !password || !City || !address ||!subscription_title){
            console.log('please fill all requirement');
            return res.status(400).json({message:'please fill all requirement',success:false});
        }
        isAdmin(email,(err,result)=>{
            if(err){
                console.log('something went wrong');
                return res.status(400).json({message:'something went wrong',success:false});
            }
             if (result.length > 0) {
                return res.status(409).json({
                    message: 'Junior Admin already exists',
                    success: false
                });
            }
             Adminregister(name,mobile_no,email,password,City,address,subscription_title,(err,result)=>{
            if(err){
                console.log('something went wrong');
                return res.status(500).json({message:'something went wrong',success:false});
            }
           return res.status(201).json({message:'Junior admin registration successfully',success:true,junioradmin:{
            name,mobile_no,email,City,address
           }});
        })
        })
      
    }catch(err){
         console.log('internal server error',err);
         return res.status(500).json({message:'Internal server error',err});
    }
}


const AdminLogin = (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required',
                success: false
            });
        }

        isAdmin(email, (err, result) => {
            if (err) {
                console.error('Junior Admin login error:', err);
                return res.status(500).json({
                    message: 'Something went wrong',
                    success: false
                });
            }

            if (!result || result.length === 0) {
                return res.status(404).json({
                    message: 'Junior Admin not found',
                    success: false
                });
            }

            const JuniorAdmin = result[0];

            if (JuniorAdmin.password !== password) {
                return res.status(401).json({
                    message: 'Incorrect password',
                    success: false
                });
            }

            const token = jwt.sign(
                {
                    id: JuniorAdmin.id,
                    role: 'junior_admin'
                },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            return res.status(200).json({
                message: 'Junior Admin login successful',
                success: true,
                token,
                JuniorAdmin: {
                    id: JuniorAdmin.id,
                    name: JuniorAdmin.name,
                    email: JuniorAdmin.email
                }
            });
        });
    } catch (err) {
        console.error('Internal server error:', err);

        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

const GetAdminByID = (req,res)=>{
const {id} = req.params;
if(!id){
    console.log('Id is required');
    return res.status(400).json({message:'Id is required',success:false});
}
getAdminById(id,(err,result)=>{
    if(err){
        console.log('something went wrong',err);
        return res.status(500).json({message:'something went wrong',success:false});
    }
    if(!result || result.length===0){
        return res.status(404).json({message:'Admin not found',success:false});
    }
    return res.status(200).json({message:'Admin fetched ',success:true,result})
})
}
module.exports = {Admincontroller,AdminLogin,GetAdminByID};