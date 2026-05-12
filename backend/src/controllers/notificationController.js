const { formatResponse } = require('../utils/responseFormatter');

exports.getNotifications = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Notifications fetched', []);
    } catch (error) {
        next(error);
    }
};

exports.markAsRead = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Marked as read');
    } catch (error) {
        next(error);
    }
};

exports.markAllAsRead = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'All marked as read');
    } catch (error) {
        next(error);
    }
};
