/**
 * Auto close stock day at store midnight and roll opening qty to the next day.
 */
const db = require('../config/db');
const logger = require('../utils/logger');
const {
  toDateStr,
  prevDateStr,
  nextDateStr,
  parseLocalDate,
  closeDayAndRollover,
} = require('./dailyStockSnapshot');

const STORE_TZ = process.env.STORE_TIMEZONE || 'Africa/Nairobi';
const CHECK_MS = 60 * 1000;

const getStoreNow = () =>
  new Date(new Date().toLocaleString('en-US', { timeZone: STORE_TZ }));

const isDayClosed = async (dateStr) => {
  const r = await db.query(
    `SELECT 1 FROM pos_audit_logs
     WHERE action = 'CLOSE_DAY' AND details->>'date' = $1
     LIMIT 1`,
    [dateStr]
  );
  return r.rows.length > 0;
};

const getLastCloseDate = async () => {
  const r = await db.query(
    `SELECT details->>'date' AS d
     FROM pos_audit_logs
     WHERE action = 'CLOSE_DAY'
     ORDER BY created_at DESC
     LIMIT 1`
  );
  return r.rows[0]?.d || null;
};

/** Close yesterday if we are in a new calendar day and it has not been closed yet. */
const ensureDayRollover = async () => {
  const todayStr = toDateStr(getStoreNow());
  const yesterdayStr = prevDateStr(todayStr);

  if (await isDayClosed(yesterdayStr)) {
    return { skipped: true, date: yesterdayStr, reason: 'already_closed' };
  }

  const result = await closeDayAndRollover(parseLocalDate(yesterdayStr), null);
  logger.info({ msg: 'Stock day auto-closed', ...result, timezone: STORE_TZ });
  return { skipped: false, ...result };
};

/** After downtime, close any missed days up to yesterday. */
const catchUpMissedCloses = async () => {
  const yesterdayStr = prevDateStr(toDateStr(getStoreNow()));
  const lastClose = await getLastCloseDate();
  let cursor = lastClose ? nextDateStr(lastClose) : yesterdayStr;

  const closed = [];
  while (cursor <= yesterdayStr) {
    if (!(await isDayClosed(cursor))) {
      const result = await closeDayAndRollover(parseLocalDate(cursor), null);
      closed.push(result);
      logger.info({ msg: 'Stock day catch-up close', ...result, timezone: STORE_TZ });
    }
    cursor = nextDateStr(cursor);
  }
  return closed;
};

let timer = null;
let runningCheck = false;

const tick = async () => {
  if (runningCheck) return;
  runningCheck = true;
  try {
    const now = getStoreNow();
    if (now.getHours() === 0 && now.getMinutes() <= 1) {
      await ensureDayRollover();
    }
  } catch (err) {
    logger.warn({ err, msg: 'Stock day scheduler tick failed' });
  } finally {
    runningCheck = false;
  }
};

const startStockDayScheduler = async () => {
  if (process.env.STOCK_AUTO_CLOSE === 'false') {
    logger.info({ msg: 'STOCK_AUTO_CLOSE disabled — midnight rollover skipped' });
    return;
  }

  try {
    await catchUpMissedCloses();
    await ensureDayRollover();
  } catch (err) {
    logger.warn({ err, msg: 'Stock day startup rollover failed' });
  }

  timer = setInterval(tick, CHECK_MS);
  timer.unref();
  logger.info({ msg: 'Stock day scheduler started', timezone: STORE_TZ });
};

const stopStockDayScheduler = () => {
  if (timer) clearInterval(timer);
  timer = null;
};

module.exports = {
  ensureDayRollover,
  catchUpMissedCloses,
  startStockDayScheduler,
  stopStockDayScheduler,
  getStoreNow,
};
