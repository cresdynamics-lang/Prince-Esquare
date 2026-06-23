import { useState } from 'react';
import { ChevronDown, Check, Copy } from 'lucide-react';
import {
  MPESA_ACCOUNT,
  MPESA_PAYBILL,
  MPESA_TILL,
  getMpesaPaymentType,
} from '../lib/storeContact';

const buildSteps = () => {
  const paymentType = getMpesaPaymentType();
  if (paymentType === 'paybill') {
    return [
      'Open the M-Pesa menu on your phone',
      'Select Lipa na M-Pesa',
      'Select Pay Bill',
      `Enter business number ${MPESA_PAYBILL}`,
      `Enter account number ${MPESA_ACCOUNT}`,
      'Enter the exact order total',
      'Enter your M-Pesa PIN and confirm',
    ];
  }
  if (paymentType === 'till') {
    return [
      'Open the M-Pesa menu on your phone',
      'Select Lipa na M-Pesa',
      'Select Buy Goods and Services',
      `Enter till number ${MPESA_TILL}`,
      'Enter the exact order total',
      'Enter your M-Pesa PIN and confirm',
    ];
  }
  return [
    'Open the M-Pesa menu on your phone',
    'Select Lipa na M-Pesa',
    'Pay the exact order total shown below',
    'Enter your M-Pesa PIN and confirm',
  ];
};

const CopyBtn = ({ value, label }) => {
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
    <button type="button" onClick={copy} className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-gold-500 hover:text-gold-300">
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : label}
    </button>
  );
};

const MpesaPaymentGuide = ({ amount, orderRef }) => {
  const [instructionsOpen, setInstructionsOpen] = useState(true);
  const rounded = Math.round(Number(amount) || 0);
  const steps = buildSteps();
  const paymentType = getMpesaPaymentType();

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
              <span className="font-serif text-white">KSh {rounded.toLocaleString()}</span>
              <CopyBtn value={String(rounded)} label="Copy amount" />
            </div>
            {orderRef && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="text-navy-400">Reference:</span>
                <span className="font-mono text-white">#{orderRef}</span>
                <CopyBtn value={orderRef} label="Copy ref" />
              </div>
            )}
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
    </div>
  );
};

export default MpesaPaymentGuide;
