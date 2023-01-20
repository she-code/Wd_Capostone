const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Buffer } = require("buffer");
exports.generateHashedPassword = async (cleanPassword) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(cleanPassword, salt);
  return hashedPassword;
};

exports.generateJwtToken = (userId, userType, expiresIn = "0.5y") => {
  const token = jwt.sign(
    { id: userId, userType: userType },
    process.env.JWT_SECRET,
    {
      expiresIn,
    }
  );
  return token;
};

exports.decode = (base64data) => {
  const buff = Buffer.from(base64data, "base64");
  const decoded = buff.toString("ascii");
  return decoded.replace("votingcom", "");
};

exports.encode = (data) => {
  const addUrl = data + "votingcom";
  const buff = Buffer.from(addUrl);
  const base64data = buff.toString("base64");
  return base64data;
};
