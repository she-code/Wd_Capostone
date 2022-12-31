const { Admin } = require("../models");
const bcrypt = require("bcrypt");
const passport = require('passport')
//register admin
exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const salt = await bcrypt.genSalt(process.env.HASH_NUMBER);
    const hashedPassword = await bcrypt.hash(password, salt);
    //check empty inputs
    if (
      firstName == null ||
      lastName == null ||
      email == null ||
      password == null
    ) {
      return res.status().json({status:401,message:"Cant have empty fields"});
    }

    //search if email exists
    const emailExists = await Admin.findOne({where:{email}})
    if(emailExists){
        return res.status().json({status:409,message:"Email already exist ! LOGIN instead"});
    }
    //create admin
    const admin = Admin.create({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: hashedPassword,
    });

    if(!admin){
        return res.status().json({status:501,message:"Unable to create account. Try later"});
    }

    //jwt,cookie will be added todo
  } catch (error) {
    return res.status().json({status:501,message:error.message});

  }
};

//register admin
exports.signup = async (req, res) => {
    try {
      const { firstName, lastName, email, password } = req.body;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      //check empty inputs
      if (
        firstName == null ||
        lastName == null ||
        email == null ||
        password == null
      ) {
        return res.status().json({status:401,message:"Cant have empty fields"});
      }
  
      //search if email exists
      const emailExists = await Admin.findOne({where:{email}})
      if(emailExists){
          return res.status().json({status:409,message:"Email already exist ! LOGIN instead"});
      }
      //create admin
      const admin = Admin.create({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: hashedPassword,
      });
  
      if(!admin){
          return res.status().json({status:501,message:"Unable to create account. Try later"});
      }
      req.logIn(admin, (err) => {
        if (err) {
          console.log(err);
        }
        res.redirect("/elections");
      });     
       // todo jwt,cookie will be added 
    } catch (error) {
      console.log(error)
      return res.status(501).json({status:501,message:error.message});
  
    }
  };

 // login
  // eslint-disable-next-line no-unused-vars
  exports.login = async(request,response)=>{
   
    passport.authenticate("local", { 
    failureRedirect: "/login" ,   
    failureFlash: true,
  }),
    async (request, response) => {
      console.log(request.user);
      response.redirect("/elections");
    }
  
  }

  // get admin details
  exports.getAdminDetails = async(req,res)=>{
    const userId = req.user.id
    const admin = await Admin.findByPk({where:{id:userId}})
    if(!admin){
      res.status(404).json({status:404,message:"User not found"})
    }
   return admin
  }