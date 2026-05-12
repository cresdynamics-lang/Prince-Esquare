const { formatResponse } = require('../../utils/responseFormatter');

exports.login = async (req, res, next) => {
    try {
        // Placeholder for login logic
        formatResponse(res, 200, true, 'Admin logged in successfully');
    } catch (error) {
        next(error);
    }
};
