const { formatResponse } = require('../utils/responseFormatter');

exports.getCoupons = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Coupons fetched', []);
    } catch (error) {
        next(error);
    }
};

exports.createCoupon = async (req, res, next) => {
    try {
        formatResponse(res, 201, true, 'Coupon created');
    } catch (error) {
        next(error);
    }
};

exports.updateCoupon = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Coupon updated');
    } catch (error) {
        next(error);
    }
};

exports.deleteCoupon = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Coupon deleted');
    } catch (error) {
        next(error);
    }
};

exports.validateCoupon = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Coupon valid', { discount: 10 });
    } catch (error) {
        next(error);
    }
};
