const bcrypt = require('bcryptjs');
const encryptPassword = async (password) =>{
   const salt = await bcrypt.genSalt(10);
   return await bcrypt.hash(password, salt); 
}

const compare = async(password, receivedpassword) =>{    
    return await bcrypt.compare(password,receivedpassword);       
}
module.exports = {encryptPassword, compare}