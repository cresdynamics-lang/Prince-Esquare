import { useState } from 'react';
import { ChevronDown, Check, Copy } from 'lucide-react';
import {
  MPESA_ACCOUNT,
  MPESA_PAYBILL,
  MPESA_TILL,
  getMpesaPaymentType,
} from '../lib/storeContact';

const PAYBILL_STEPS = [
  'Open the M-Pesa menu on your phone',
  'Select Lipa na M-Pesa',
  'Select Pay Bill',
  `Enter business number ${MPESA_PAYBILL}`,
  `Enter account number ${MPESA_ACCOUNT}`,
  'Enter the exact order total',
  'Enter your M-Pesa PIN and confirm',
];

const TILL_STEPS = [
  'Open the M-Pesa menu on your phone',
  'Select Lipa na M-Pesa',
  'Select Buy Goods and Services',
  `Enter till number ${MPESA_TILL}`,
  'Enter the exact order total',
  'Enter your M-Pesa PIN and confirm',
];

const GENERIC_STEPS = [
  'Open the M-Pesa menu on your phone',
  'Select Lipa na M-Pesa',
  'Pay the exact order total shown below',
  'Enter your M-Pesa PIN and confirm',
];

const CopyBtn = ({ value, label, className = '' }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-gold-500 hover:text-gold-300 ${className}`}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : label}
    </button>
  );
};

const MpesaCheckoutSection = ({
  totals,
  mpesaConfirmed,
  onMpesaConfirmedChange,
  mpesaCode,
  onMpesaCodeChange,
  showSummary = true,
}) => {
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const paymentType = getMpesaPaymentType();
  const steps = paymentType === 'paybill' ? PAYBILL_STEPS : paymentType === 'till' ? TILL_STEPS : GENERIC_STEPS;
  const totalRounded = Math.round(totals.total);
  const deliveryLabel = totals.shipping > 0 ? `KSh ${totals.shipping.toLocaleString()}` : 'Free';

  const headerLabel = paymentType === 'paybill'
    ? `M-Pesa Pay Bill – ${MPESA_PAYBILL} (Prince Esquire)`
    : paymentType === 'till'
      ? `M-Pesa Lipa na M-Pesa (Buy Goods) – Till ${MPESA_TILL}`
      : 'Pay with M-Pesa';

  return (
    <div className="space-y-4">
      <div className="border border-gold-500/20 bg-navy-950/50 px-4 py-3">
        <p className="text-sm text-white font-medium">{headerLabel}</p>
        {paymentType === 'paybill' && (
          <p className="text-xs text-navy-400 mt-1">Account no. {MPESA_ACCOUNT}</p>
        )}
      </div>

      <div className="border border-gold-500/10">
        <button
          type="button"
          onClick={() => setInstructionsOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-sm text-navy-200 hover:bg-navy-950/40 transition-colors"
        >
          <span>M-Pesa payment instructions</span>
          <ChevronDown
            size={18}
            className={`shrink-0 text-gold-500 transition-transform ${instructionsOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {instructionsOpen && (
          <div className="px-4 pb-4 space-y-3 border-t border-gold-500/10">
            {paymentType === 'paybill' && (
              <>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-3 text-sm">
                  <span className="text-navy-400">Pay bill:</span>
                  <span className="font-bold text-gold-400">{MPESA_PAYBILL}</span>
                  <CopyBtn value={MPESA_PAYBILL} label="Copy pay bill" />
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <span className="text-navy-400">Account:</span>
                  <span className="font-bold text-gold-400">{MPESA_ACCOUNT}</span>
                  <CopyBtn value={MPESA_ACCOUNT} label="Copy account" />
                </div>
              </>
            )}
            {paymentType === 'till' && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-3 text-sm">
                <span className="text-navy-400">Till:</span>
                <span className="font-bold text-gold-400">{MPESA_TILL}</span>
                <CopyBtn value={MPESA_TILL} label="Copy till" />
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="text-navy-400">Amount:</span>
              <span className="font-serif text-white">KSh {totalRounded.toLocaleString()}</span>
              <CopyBtn value={String(totalRounded)} label="Copy amount" />
            </div>
            <ol className="space-y-2 pt-1">
              {steps.map((step, i) => (
                <li key={step} className="flex gap-2.5 text-xs sm:text-sm text-navy-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00A651] text-white text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 leading-relaxed min-w-0">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={mpesaConfirmed}
          onChange={(e) => onMpesaConfirmedChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#00A651] cursor-pointer"
        />
        <span className="text-xs sm:text-sm text-navy-300 leading-relaxed group-hover:text-navy-200">
          I will pay the order total via M-Pesa before my order is processed
          <span className="text-gold-500"> *</span>
        </span>
      </label>

      <div className="space-y-1.5">
        <label className="text-xs text-navy-400">M-Pesa confirmation code (optional)</label>
        <input
          type="text"
          value={mpesaCode}
          onChange={(e) => onMpesaCodeChange(e.target.value.toUpperCase())}
          className="w-full bg-navy-950 border border-gold-500/10 py-3 px-4 text-white text-base outline-none focus:border-gold-500 font-mono tracking-wide"
          placeholder="e.g. QHK7X2Y9AB"
          autoComplete="off"
        />
        <p className="text-[11px] text-navy-500 leading-relaxed">
          Paste the code from your M-Pesa SMS after paying — helps us confirm faster.
        </p>
      </div>

      {showSummary && (
        <div className="space-y-2 pt-2 border-t border-gold-500/10">
          <div className="flex justify-between text-sm text-navy-400">
            <span>Subtotal</span>
            <span>KSh {totals.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-navy-400">
            <span>Delivery</span>
            <span>{deliveryLabel}</span>
          </div>
          {totals.tax > 0 && (
            <div className="flex justify-between text-sm text-navy-400">
              <span>VAT (16%)</span>
              <span>KSh {totals.tax.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-base sm:text-lg font-bold text-white pt-1">
            <span>Total</span>
            <span className="text-gold-400">KSh {totalRounded.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MpesaCheckoutSection;
