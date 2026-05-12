const { formatResponse } = require('../utils/responseFormatter');

exports.getVariants = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Variants fetched', []);
    } catch (error) {
        next(error);
    }
};

exports.addVariant = async (req, res, next) => {
    try {
        formatResponse(res, 201, true, 'Variant added');
    } catch (error) {
        next(error);
    }
};

exports.updateVariant = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Variant updated');
    } catch (error) {
        next(error);
    }
};

exports.deleteVariant = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Variant deleted');
    } catch (error) {
        next(error);
    }
};
