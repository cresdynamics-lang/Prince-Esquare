const { formatResponse } = require('../utils/responseFormatter');

exports.getProfile = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Profile fetched', { user: req.user });
    } catch (error) {
        next(error);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Profile updated');
    } catch (error) {
        next(error);
    }
};

exports.updatePassword = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Password changed');
    } catch (error) {
        next(error);
    }
};

exports.uploadAvatar = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Avatar uploaded');
    } catch (error) {
        next(error);
    }
};

exports.getAddresses = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Addresses fetched', []);
    } catch (error) {
        next(error);
    }
};

exports.addAddress = async (req, res, next) => {
    try {
        formatResponse(res, 201, true, 'Address added');
    } catch (error) {
        next(error);
    }
};

exports.updateAddress = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Address updated');
    } catch (error) {
        next(error);
    }
};

exports.deleteAddress = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Address deleted');
    } catch (error) {
        next(error);
    }
};

exports.setDefaultAddress = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Default address set');
    } catch (error) {
        next(error);
    }
};
