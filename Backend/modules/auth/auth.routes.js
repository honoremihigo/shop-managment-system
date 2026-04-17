const { protect } = require("../../middleware/auth.middleware")
const {loginUser,registerAdmin,logout , getProfile } = require("./auth.controller")
const router = require("express").Router()


//register new admin
router.post('/admin-register', registerAdmin)
//login of a user or admin
router.post('/login', loginUser)
//logout
router.post('/logout', logout)
//get profile
router.get('/profile',protect, getProfile)

module.exports = router;