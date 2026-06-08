// MODIFIED — JWT supports enriched payload (Option A unified auth)
const jwt = require('jsonwebtoken');

const signToken = (payload) => {
  const data =
    typeof payload === 'string' || typeof payload === 'number'
      ? { id: String(payload), accountType: 'user' }
      : payload;
  return jwt.sign(data, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

module.exports = { signToken, verifyToken };
