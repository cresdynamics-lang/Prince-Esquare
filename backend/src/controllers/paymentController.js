const { formatResponse } = require('../utils/responseFormatter');
const mpesaService = require('../services/mpesaService');

exports.stkPush = async (req, res, next) => {
    try {
        const { amount, phoneNumber } = req.body;
        const result = await mpesaService.stkPush(amount, phoneNumber);
        formatResponse(res, 200, true, 'STK push initiated', result);
    } catch (error) {
        next(error);
    }
};

exports.callback = async (req, res, next) => {
    try {
        console.log('M-Pesa Callback received:', req.body);
        res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
    } catch (error) {
        next(error);
    }
};

exports.status = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Payment status fetched', { status: 'Success' });
    } catch (error) {
        next(error);
    }
};

exports.history = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Payment history fetched', []);
    } catch (error) {
        next(error);
    }
};

exports.refund = async (req, res, next) => {
    try {
        formatResponse(res, 200, true, 'Refund processed');
    } catch (error) {
        next(error);
    }
};
