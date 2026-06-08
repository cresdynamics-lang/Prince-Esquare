// NEW — Socket.io instance (initialized in index.js)
let io = null;

const setIO = (instance) => {
  io = instance;
};

const getIO = () => io;

module.exports = { setIO, getIO };
