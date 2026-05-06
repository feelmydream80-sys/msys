



function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}


function isValidPassword(password) {

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
}


function isValidUserId(userId) {

    const userIdRegex = /^[a-zA-Z0-9_]{4,20}$/;
    return userIdRegex.test(userId);
}


function isValidPhone(phone) {

    const phoneRegex = /^0\d{1,2}-\d{3,4}-\d{4}$/;
    return phoneRegex.test(phone);
}


function isValidNumber(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}

export { 
    isValidEmail, 
    isValidPassword, 
    isValidUserId, 
    isValidPhone, 
    isValidNumber 
};