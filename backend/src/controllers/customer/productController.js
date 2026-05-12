const { formatResponse } = require('../../utils/responseFormatter');

exports.getProducts = async (req, res, next) => {
    try {
        // Placeholder for fetching products
        formatResponse(res, 200, true, 'Products fetched successfully', []);
    } catch (error) {
        next(error);
    }
};
