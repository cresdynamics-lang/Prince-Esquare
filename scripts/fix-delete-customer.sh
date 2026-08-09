#!/bin/bash
set -euo pipefail
KEY="/Users/airm1/.ssh/prince_esquare_ed25519"
HOST="root@161.35.58.181"
FILE="/var/www/Prince-Esquare/backend/src/controllers/adminCustomerController.js"

ssh -i "$KEY" -o BatchMode=yes "$HOST" python3 - "$FILE" <<'PY'
import sys
from pathlib import Path
p = Path(sys.argv[1])
text = p.read_text()
old = """            await client.query('UPDATE orders SET user_id = NULL WHERE user_id = $1', [id]);
            await client.query(
                'DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = $1)',
                [id]
            );
            await client.query('DELETE FROM carts WHERE user_id = $1', [id]);"""
new = """            await client.query('UPDATE orders SET user_id = NULL WHERE user_id = $1', [id]);
            await client.query('DELETE FROM cart_items WHERE user_id = $1', [id]);
            await client.query('DELETE FROM wishlist WHERE user_id = $1', [id]);
            await client.query('DELETE FROM notifications WHERE user_id = $1', [id]);
            await client.query('UPDATE reviews SET user_id = NULL WHERE user_id = $1', [id]);"""
if old not in text:
    raise SystemExit('patch target not found in deleteCustomer')
p.write_text(text.replace(old, new))
print('deleteCustomer patched OK')
PY

ssh -i "$KEY" -o BatchMode=yes "$HOST" "pm2 restart prince-backend && sleep 2 && pm2 status prince-backend | tail -3"
