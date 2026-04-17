const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');

const User = sequelize.define("User", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('ADMIN', 'USER'),
        defaultValue: 'USER',
    }
},{
    tableName: "users"
}
)
module.exports = User;


// Instance methods
User.prototype.comparePassword = async function (password){
    return await bcrypt.compare(password, this.password);
}

User.prototype.isAdmin = function (){
    return this.role === 'ADMIN';
}