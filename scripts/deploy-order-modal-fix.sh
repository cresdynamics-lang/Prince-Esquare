#!/bin/bash
set -euo pipefail
KEY="/Users/airm1/.ssh/prince_esquare_ed25519"
HOST="root@161.35.58.181"
ROOT="/var/www/Prince-Esquare"
LOCAL="/Users/airm1/Projects/Prince-Esquare"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/frontend/src/lib/adminOrderHelpers.js" \
  "$HOST:$ROOT/frontend/src/lib/"

ssh -i "$KEY" -o BatchMode=yes "$HOST" bash -s <<'REMOTE'
set -euo pipefail
ROOT=/var/www/Prince-Esquare
cd "$ROOT"

python3 <<'PY'
from pathlib import Path
p = Path("frontend/src/pages/AdminDashboard.jsx")
text = p.read_text()

# Import order status constants
if "ORDER_STATUSES" not in text or "from '../lib/adminOrderHelpers'" not in text:
    text = text.replace(
        "import { formatPaymentLabel, parseOrderAddress } from '../lib/adminOrderHelpers';",
        "import { formatPaymentLabel, parseOrderAddress, ORDER_STATUSES, PAYMENT_STATUSES } from '../lib/adminOrderHelpers';",
    )
elif "ORDER_STATUSES, PAYMENT_STATUSES" not in text:
    text = text.replace(
        "import { formatPaymentLabel, parseOrderAddress } from '../lib/adminOrderHelpers';",
        "import { formatPaymentLabel, parseOrderAddress, ORDER_STATUSES, PAYMENT_STATUSES } from '../lib/adminOrderHelpers';",
    )

# Safe address block in order detail modal
old_addr = """                <div className="bg-navy-950/60 border border-gold-500/10 rounded-xl p-4 text-sm">
                  <p className="text-[10px]   text-gold-500/40 mb-2">Shipping</p>
                  <p className="text-gold-100">
                    {[detailAddress.first_name, detailAddress.last_name].filter(Boolean).join(' ')}
                  </p>
                  <p className="text-gold-500/70 text-xs mt-1">{detailAddress.line1}</p>
                  <p className="text-gold-500/70 text-xs">{detailAddress.city}, {detailAddress.country || 'Kenya'}</p>
                  <p className="text-gold-500/70 text-xs mt-1">{detailAddress.phone}</p>
                  <p className="text-gold-500/70 text-xs">{detailAddress.email}</p>
                </div>"""

new_addr = """                <div className="bg-navy-950/60 border border-gold-500/10 rounded-xl p-4 text-sm">
                  <p className="text-[10px]   text-gold-500/40 mb-2">Shipping</p>
                  {detailAddress ? (
                    <>
                      <p className="text-gold-100">
                        {[detailAddress.first_name, detailAddress.last_name].filter(Boolean).join(' ')}
                      </p>
                      <p className="text-gold-500/70 text-xs mt-1">{detailAddress.line1 || '—'}</p>
                      <p className="text-gold-500/70 text-xs">{detailAddress.city || '—'}, {detailAddress.country || 'Kenya'}</p>
                      <p className="text-gold-500/70 text-xs mt-1">{detailAddress.phone || '—'}</p>
                      <p className="text-gold-500/70 text-xs">{detailAddress.email || '—'}</p>
                    </>
                  ) : (
                    <p className="text-gold-500/50 text-xs">No shipping address on file.</p>
                  )}
                </div>"""
if old_addr in text:
    text = text.replace(old_addr, new_addr)

# Better modals: backdrop click + row click opens detail
old_modal = """      {(detailLoading || detailOrder || actionError) && !editOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-900 border border-gold-500/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">"""

new_modal = """      {(detailLoading || detailOrder || actionError) && !editOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close order details"
            className="absolute inset-0 bg-navy-950/85 backdrop-blur-sm"
            onClick={closeDetail}
          />
          <div
            className="relative bg-navy-900 border border-gold-500/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >"""
if old_modal in text:
    text = text.replace(old_modal, new_modal)

old_edit_modal = """      {editOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-900 border border-gold-500/20 rounded-2xl p-6 max-w-md w-full">"""

new_edit_modal = """      {editOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close edit order"
            className="absolute inset-0 bg-navy-950/85 backdrop-blur-sm"
            onClick={closeEdit}
          />
          <div
            className="relative bg-navy-900 border border-gold-500/20 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >"""
if old_edit_modal in text:
    text = text.replace(old_edit_modal, new_edit_modal)

# Click row to view order
old_tr = '<tr key={o.id} className="hover:bg-navy-800/30 transition-colors">'
new_tr = '<tr key={o.id} className="hover:bg-navy-800/30 transition-colors cursor-pointer" onClick={() => openOrderDetail(o.id)}>'
if old_tr in text:
    text = text.replace(old_tr, new_tr, 1)

# Stop row click from bubbling when using action buttons
old_eye = """                      <button
                        type="button"
                        onClick={() => openOrderDetail(o.id)}
                        className="p-2 text-gold-500/60 hover:text-gold-500 hover:bg-navy-800 rounded-lg transition-all"
                        title="View Details"
                      >"""
new_eye = """                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openOrderDetail(o.id); }}
                        className="p-2 text-gold-500/60 hover:text-gold-500 hover:bg-navy-800 rounded-lg transition-all"
                        title="View Details"
                      >"""
if old_eye in text:
    text = text.replace(old_eye, new_eye, 1)

old_edit_btn = """                        <button
                          type="button"
                          onClick={() => openOrderEdit(o)}
                          className="p-2 text-gold-500/60 hover:text-gold-500 hover:bg-navy-800 rounded-lg transition-all"
                          title="Edit Order"
                        >"""
new_edit_btn = """                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openOrderEdit(o); }}
                          className="p-2 text-gold-500/60 hover:text-gold-500 hover:bg-navy-800 rounded-lg transition-all"
                          title="Edit Order"
                        >"""
if old_edit_btn in text:
    text = text.replace(old_edit_btn, new_edit_btn, 1)

p.write_text(text)
print("AdminDashboard.jsx patched")
PY

cd frontend
npm run build 2>&1 | tail -5
echo "Live bundle: $(grep -o 'index-[^.]*\\.js' dist/index.html)"
REMOTE

echo "Order modal fix deployed."
