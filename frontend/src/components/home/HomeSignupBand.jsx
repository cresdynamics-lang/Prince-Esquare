import { useState } from 'react';
import { motion } from 'framer-motion';
import { HOME_SIGNUP } from '../../data/homepageContent';
import API from '../../services/api';

/**
 * Section 10 — static Join The List band (email or WhatsApp contact).
 */
export default function HomeSignupBand() {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState(''); // '', 'ok', 'err'
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const raw = value.trim();
    if (!raw) return;
    setBusy(true);
    setStatus('');
    try {
      const isEmail = raw.includes('@');
      const email = isEmail
        ? raw
        : `wa.${raw.replace(/\D/g, '') || 'guest'}@prince-esquire.list`;
      await API.post('/newsletter/subscribe', { email });
      setStatus('ok');
      setValue('');
    } catch {
      setStatus('err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border-t border-gold-600/10 bg-navy-950 py-20 md:py-28">
      <div className="container mx-auto max-w-2xl px-5 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <h2 className="font-serif text-3xl leading-tight text-white md:text-4xl">{HOME_SIGNUP.title}</h2>
          <p className="text-[15px] font-light leading-relaxed text-navy-300">{HOME_SIGNUP.body}</p>
          <form onSubmit={submit} className="mx-auto flex max-w-lg flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="prince-list-contact">
              Email or WhatsApp
            </label>
            <input
              id="prince-list-contact"
              type="text"
              inputMode="email"
              autoComplete="email"
              placeholder="Email or WhatsApp"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="flex-1 border border-gold-500/20 bg-navy-900/60 px-5 py-4 text-sm text-white outline-none placeholder:text-navy-400 focus:border-gold-500/50"
              required
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-gold-600 px-8 py-4 text-[10px] font-bold uppercase tracking-[0.28em] text-navy-950 transition-colors hover:bg-gold-500 disabled:opacity-60"
            >
              {busy ? 'Joining…' : HOME_SIGNUP.cta}
            </button>
          </form>
          {status === 'ok' ? (
            <p className="text-[11px] uppercase tracking-[0.2em] text-gold-400">You&apos;re on the list.</p>
          ) : null}
          {status === 'err' ? (
            <p className="text-[11px] uppercase tracking-[0.2em] text-red-400/80">Couldn&apos;t join — try again.</p>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
