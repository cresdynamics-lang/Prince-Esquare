// NEW — POS settings (reuses existing settings table)
const Joi = require('joi');
const { formatResponse } = require('../../utils/responseFormatter');
const { getPosSettings, upsertPosSetting } = require('../../utils/posSettings');

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await getPosSettings();
    formatResponse(res, 200, true, 'POS settings fetched', settings);
  } catch (error) {
    next(error);
  }
};

exports.getTerminalSettings = async (req, res, next) => {
  try {
    const settings = await getPosSettings();
    formatResponse(res, 200, true, 'Terminal settings fetched', {
      pos_sellers_can_discount: settings.pos_sellers_can_discount ?? 'false',
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSetting = async (req, res, next) => {
  try {
    const schema = Joi.object({
      key: Joi.string().required(),
      value: Joi.string().required(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) return formatResponse(res, 400, false, error.message);
    if (!value.key.startsWith('pos_')) {
      return formatResponse(res, 400, false, 'Only pos_ prefixed keys allowed');
    }

    await upsertPosSetting(value.key, value.value);
    formatResponse(res, 200, true, 'Setting updated');
  } catch (error) {
    next(error);
  }
};
