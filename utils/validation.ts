export const validateNationalId = (id: string): boolean => {
    return /^\d{10}$/.test(id); // Simple validation for now
};

export const validatePhoneNumber = (phone: string): boolean => {
    return /^09\d{9}$/.test(phone);
};