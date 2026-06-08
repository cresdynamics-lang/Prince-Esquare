#!/usr/bin/env node
/**
 * Quick API smoke test — run with backend up: node scripts/smoke-test.js
 */
const base = process.env.API_URL || 'http://localhost:8000/api';

const checks = [];

async function get(path, label) {
  try {
    const res = await fetch(`${base}${path}`);
    const ok = res.ok;
    checks.push({ label, ok, status: res.status });
    return ok;
  } catch (e) {
    checks.push({ label, ok: false, error: e.message });
    return false;
  }
}

async function main() {
  try {
    const root = await fetch((process.env.API_URL || 'http://localhost:8000').replace(/\/api\/?$/, ''));
    checks.push({ label: 'API root', ok: root.ok, status: root.status });
  } catch (e) {
    checks.push({ label: 'API root', ok: false, error: e.message });
  }
  await get('/products?limit=1', 'Products list');
  await get('/catalogue', 'Catalogue');
  await get('/products/featured', 'Featured products');

  try {
    const hp = await fetch(`${base}/homepage`);
    const json = await hp.json();
    const slides = json?.data?.heroSlides?.length || 0;
    const products = json?.data?.newArrivals?.length || 0;
    const ok = hp.ok && slides > 0 && products > 0;
    checks.push({ label: `Homepage (${slides} slides, ${products} products)`, ok, status: hp.status });
  } catch (e) {
    checks.push({ label: 'Homepage', ok: false, error: e.message });
  }

  const failed = checks.filter((c) => !c.ok);
  checks.forEach((c) => {
    const mark = c.ok ? 'OK' : 'FAIL';
    console.log(`${mark}  ${c.label}${c.status ? ` (${c.status})` : ''}${c.error ? ` — ${c.error}` : ''}`);
  });

  if (failed.length) {
    console.error(`\n${failed.length} check(s) failed. Is the backend running on ${base}?`);
    process.exit(1);
  }
  console.log('\nAll smoke checks passed.');
}

main();
