// MODIFIED — POS seller login (raw SQL)
const bcrypt = require('bcryptjs');
const posDb = require('../../lib/posDb');
const { formatResponse } = require('../../utils/responseFormatter');
const { signToken } = require('../../utils/jwt');

exports.posLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const profile = await posDb.findProfileByEmail(email);
    if (!profile || !(await bcrypt.compare(password, profile.password_hash))) {
      return formatResponse(res, 401, false, 'Invalid email or password');
    }
    if (!profile.is_active) {
      return formatResponse(res, 403, false, 'Account deactivated');
    }
    if (profile.role !== 'SELLER') {
      return formatResponse(res, 403, false, 'Use staff login for admin access');
    }

    const token = signToken({
      id: profile.id,
      role: profile.role,
      fullName: profile.full_name,
      accountType: 'pos',
    });

    formatResponse(res, 200, true, 'POS login successful', {
      token,
      user: {
        id: profile.id,
        fullName: profile.full_name,
        email: profile.email,
        role: profile.role,
      },
    });
  } catch (error) {
    next(error);
  }
};
