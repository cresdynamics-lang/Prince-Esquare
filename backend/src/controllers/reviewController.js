const { formatResponse } = require('../utils/responseFormatter');

exports.getProductReviews = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Product reviews fetched', []);
    } catch (error) {
        next(error);
    }
};

exports.createReview = async (req, res, next) => {
    try {
        formatResponse(res, 201, true, 'Review created');
    } catch (error) {
        next(error);
    }
};

exports.updateReview = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Review updated');
    } catch (error) {
        next(error);
    }
};

exports.deleteReview = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Review deleted');
    } catch (error) {
        next(error);
    }
};

exports.adminGetReviews = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'All reviews fetched', []);
    } catch (error) {
        next(error);
    }
};

exports.approveReview = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Review approved');
    } catch (error) {
        next(error);
    }
};

exports.adminDeleteReview = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Review deleted');
    } catch (error) {
        next(error);
    }
};
