#!/bin/bash
# SSH / SCP helper for Cursor agent — uses workspace key (not ~/.ssh).
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
AGENT_KEY="${AGENT_SSH_KEY:-$ROOT_DIR/.cursor/ssh/prince_agent_ed25519}"
HOST="${SSH_HOST:-root@161.35.58.181}"

if [[ ! -f "$AGENT_KEY" ]]; then
  echo "Agent key missing: $AGENT_KEY" >&2
  echo "Run: bash scripts/install-cursor-agent-ssh.sh" >&2
  exit 1
fi

cmd="${1:-}"
shift || true

case "$cmd" in
  ssh)
    exec ssh -i "$AGENT_KEY" -o BatchMode=yes -o IdentitiesOnly=yes "$HOST" "$@"
    ;;
  scp)
    exec scp -i "$AGENT_KEY" -o BatchMode=yes -o IdentitiesOnly=yes "$@"
    ;;
  test)
    ssh -i "$AGENT_KEY" -o BatchMode=yes -o IdentitiesOnly=yes "$HOST" 'echo AGENT_SSH_OK; hostname'
    ;;
  *)
    echo "Usage: $0 {test|ssh|scp} [args...]"
    echo "  $0 test"
    echo "  $0 ssh 'pm2 list'"
    echo "  $0 scp local.js $HOST:/var/www/Prince-Esquare/..."
    exit 1
    ;;
esac
