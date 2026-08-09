#!/bin/bash
# Fix admin Products blue screen: harden ProductsView + ErrorBoundary around lazy load.
set -euo pipefail
KEY="${SSH_KEY:-$HOME/.ssh/prince_esquire_ed25519}"
HOST="root@161.35.58.181"
ROOT="/var/www/Prince-Esquare"
LOCAL="/Users/airm1/Projects/Prince-Esquare"

if [[ ! -f "$KEY" ]]; then
  echo "Missing SSH key at $KEY"
  echo "Restore ~/.ssh/prince_esquire_ed25519 (or set SSH_KEY=/path/to/key) and re-run."
  exit 1
fi

scp -i "$KEY" -o BatchMode=yes \
  "$LOCAL/frontend/src/components/admin/ProductsView.jsx" \
  "$LOCAL/frontend/src/components/admin/AdminSectionErrorBoundary.jsx" \
  "$LOCAL/frontend/src/components/admin/ConfirmDialog.jsx" \
  "$HOST:$ROOT/frontend/src/components/admin/"

ssh -i "$KEY" -o BatchMode=yes "$HOST" bash -s <<'REMOTE'
set -euo pipefail
cd /var/www/Prince-Esquare

python3 <<'PY'
from pathlib import Path

dash = Path('frontend/src/pages/AdminDashboard.jsx')
text = dash.read_text()

if "AdminSectionErrorBoundary" not in text:
    text = text.replace(
        "import { ConfirmProvider, useConfirm } from '../components/admin/ConfirmDialog';",
        "import { ConfirmProvider, useConfirm } from '../components/admin/ConfirmDialog';\n"
        "import AdminSectionErrorBoundary from '../components/admin/AdminSectionErrorBoundary';",
    )
    if "AdminSectionErrorBoundary" not in text:
        # alternate import style
        needle = "from '../components/admin/ConfirmDialog';"
        if needle in text and "AdminSectionErrorBoundary" not in text:
            text = text.replace(
                needle,
                needle + "\nimport AdminSectionErrorBoundary from '../components/admin/AdminSectionErrorBoundary';",
                1,
            )

old = """      <Suspense fallback={<SectionLoader />}>
        {(() => {
          switch (activeSection) {
            case 'products':
              return <ProductsView />;
            default:
              return null;
          }
        })()}
      </Suspense>"""

new = """      <AdminSectionErrorBoundary label="Products">
        <Suspense fallback={<SectionLoader />}>
          {(() => {
            switch (activeSection) {
              case 'products':
                return <ProductsView />;
              default:
                return null;
            }
          })()}
        </Suspense>
      </AdminSectionErrorBoundary>"""

if old in text and "AdminSectionErrorBoundary label=\"Products\"" not in text:
    text = text.replace(old, new)
    print('Patched Suspense with ErrorBoundary')
elif "AdminSectionErrorBoundary label=\"Products\"" in text:
    print('ErrorBoundary already present')
else:
    print('WARNING: Suspense block not found — check AdminDashboard manually')

dash.write_text(text)
print('AdminDashboard written')
PY

cd frontend && npm run build
echo DONE
REMOTE
