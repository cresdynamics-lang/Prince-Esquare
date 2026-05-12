const { formatResponse } = require('../utils/responseFormatter');

exports.getCustomers = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'All customers fetched', []);
    } catch (error) {
        next(error);
    }
};

exports.getCustomerDetail = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Customer details fetched', {});
    } catch (error) {
        next(error);
    }
};

exports.updateCustomerStatus = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Customer status updated');
    } catch (error) {
        next(error);
    }
};
