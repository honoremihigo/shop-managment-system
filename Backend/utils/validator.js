const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}
const isValidPassword = (password) => {
    return password && password.length >= 6;
}

module.exports = { 
    isValidEmail,
    isValidPassword
}