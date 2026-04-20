const {  createUser,  } = require('./admin.service')
/**
 * Create a new user (Admin only)
 * POST /api/users
 */
const createNewUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await this.createUser(email, password);
        
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role
                }
            }
        });
        
    } catch (error) {
        if (error.message === 'Email and password are required') {
            return res.status(400).json({ success: false, message: error.message });
        }
        if (error.message === 'Invalid email format') {
            return res.status(400).json({ success: false, message: error.message });
        }
        if (error.message === 'Password must be at least 6 characters long') {
            return res.status(400).json({ success: false, message: error.message });
        }
        if (error.message === 'Email already in use') {
            return res.status(409).json({ success: false, message: error.message });
        }
        
        console.error('Error in createUser:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get all users (Admin only)
 * GET /api/users
 */
const getAllUsers = async (req, res) => {
    try {
        const users = await getAllUsers();
        
        // Remove passwords from response
        const safeUsers = users.map(user => ({
            id: user.id,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }));
        
        res.status(200).json({
            success: true,
            data: { users: safeUsers }
        });
        
    } catch (error) {
        console.error('Error in getAllUsers:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get single user by ID (Admin only)
 * GET /api/users/:id
 */
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await getUserById(id);
        
        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            }
        });
        
    } catch (error) {
        if (error.message === 'User not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        
        console.error('Error in getUserById:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Delete user (Admin only)
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        await deleteUser(id);
        
        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
        
    } catch (error) {
        if (error.message === 'User not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        
        console.error('Error in deleteUser:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
   createNewUser,
    getAllUsers,
    getUserById,
    deleteUser
};