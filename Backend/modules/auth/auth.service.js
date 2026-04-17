const jwt = require("jsonwebtoken");
const { User } = require("../../models");
const bcrypt = require("bcrypt");
const { isValidPassword, isValidEmail } = require("../../utils/validator");

const AdminRegister = async (email, password) => {
  try {
    if (!email || !password) {
      const error = new Error(" email, and password are required");
      error.statusCode = 400;
      throw error;
    }

    if (!isValidEmail(email)) {
      const error = new Error("Please provide a valid email");
      error.statusCode = 400;
      throw error;
    }

    if (!isValidPassword(password)) {
      const error = new Error("Password must be at least 6 characters long");
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      const error = new Error("User already exists");
      error.statusCode = 409;
      throw error;
    }

    const hashedPass = await bcrypt.hash(password, 10);

    await User.create({
      email,
      password: hashedPass,
      role: "ADMIN",
    });
    return {
      sucess: true,
      message: "Admin registered successfully",
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const login = async (email, password) => {
  try {
    if (!email || !password) {
      const error = new Error("Email and password are required");
      error.statusCode = 400;
      throw error;
    }

    if (!isValidEmail(email)) {
      const error = new Error("Please provide a valid email");
      error.statusCode = 400;
      throw error;
    }

    if (!isValidPassword(password)) {
      const error = new Error("Password must be at least 6 characters long");
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      const error = new Error("password is incorrect");
      error.statusCode = 401;
      throw error;
    }

    const token = generateToken(user);

    return token;
  } catch (error) {
    console.log("Error in login service:", error);
    throw error;
  }
};


const userProfile = async (id) => {
  try {
    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    })
    return user
  } catch (error) {
    console.log("Error in getProfile service:", error);
    throw error;
  }
}

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    },
  );
};

module.exports = {
  AdminRegister,
  userProfile,
  login,
};
