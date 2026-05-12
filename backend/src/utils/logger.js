const logger = {
    info: (message) => {
        console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
    },
    error: (message, stack) => {
        console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
        if (stack) console.error(stack);
    },
    warn: (message) => {
        console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
    }
};

module.exports = logger;
