const { Admin } = require("../models");
const bcrypt = require("bcrypt");

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
      req.logIn(admin, (err) => {
        if (err) {
          console.log(err);
        }
        res.redirect("/elections");
      });      //jwt,cookie will be added todo
    } catch (error) {
      return res.status().json({status:501,message:error.message});
  
    }
  };

  //login