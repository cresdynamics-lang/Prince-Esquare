const { formatResponse } = require('../utils/responseFormatter');

exports.getDashboardStats = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Dashboard stats fetched', { revenue: 0, orders: 0, customers: 0 });
    } catch (error) {
        next(error);
    }
};

exports.getSalesChart = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Sales chart data fetched', []);
    } catch (error) {
        next(error);
    }
};

exports.getTopProducts = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Top products fetched', []);
    } catch (error) {
        next(error);
    }
};

exports.getLowStock = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Low stock alerts fetched', []);
    } catch (error) {
        next(error);
    }
};

exports.getOrderReport = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Order report exported');
    } catch (error) {
        next(error);
    }
};
