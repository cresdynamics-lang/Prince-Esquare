const { formatResponse } = require('../utils/responseFormatter');

exports.search = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Search results fetched', []);
    } catch (error) {
        next(error);
    }
};

exports.getSuggestions = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Search suggestions fetched', []);
    } catch (error) {
        next(error);
    }
};
