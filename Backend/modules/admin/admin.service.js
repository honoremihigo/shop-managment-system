const User = require("../../models/User");
const { isValidEmail, isValidPassword } = require("../../utils/validator");
const bcrypt = require("bcrypt");


const createUser = async (email, password) => {
    if(!email && !password){
        throw new Error("Email and password are required");
    }

    if(!isValidEmail(email)){
        throw new Error("Invalid email format");
    }

    if(!isValidPassword(password)){
        throw new Error("Password must be at least 6 characters long");
    }

    try {
        const existingUser = await User.findOne({ where: { email } });
        if(existingUser){
            throw new Error("Email already in use");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ email, password: hashedPassword, role: 'USER' });
        return newUser;
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }

}


const getAllUsers = async () => {
    return await User.findAll();
}


const getUserById = async (id) => {
    const user = await User.findByPk(id);   
    if(!user){
        throw new Error("User not found");
    }
    return user;
}


const deleteUser = async (id) => {
    const user = await getUserById(id); 
    if(!user){
        throw new Error("User not found");
    }
    await user.destroy();
    return;
}

module.exports = {
    createUser,
    getAllUsers,
    getUserById,
    deleteUser
};
