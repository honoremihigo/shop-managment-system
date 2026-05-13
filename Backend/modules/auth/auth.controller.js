const { AdminRegister, login, userProfile } = require("./auth.service");

const registerAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await AdminRegister(email, password);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
    console.error("Error in registerAdmin:", error);
  }
};

const loginUser = async (req, res) => {
  console.log("Request body:", req.body);
  try {
    const { email, password } = req.body;
    const token = await login(email, password);
    res.cookie("token", token, {
      httpOnly: true, // JavaScript cannot access
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: process.env.NODE_ENV === "production" ? "None" : "strict", // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.status(200).json({
      success: true,
      message: "Login successful",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
    console.error("Error in loginUser:", error);
  }
};

const logout = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: process.env.NODE_ENV === "production" ? "None" : "strict", // CSRF protection
    expires: new Date(0), // Expire immediately,
    path:"/"
  });
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

const getProfile = async (req, res) => {
  const { id } = req.user;
  try {
    const user = await userProfile(id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
    console.error("Error in getProfile:", error);
  }
};
module.exports = {
  registerAdmin,
  loginUser,
  getProfile,
  logout,
};
