#!/bin/bash
# Run THIS on your Mac — uses your existing working key to install the Cursor agent key on the server.
# Easier than copying files onto the server by hand.
set -euo pipefail

KEY="${SSH_KEY:-$HOME/.ssh/prince_esquare_ed25519}"
HOST="${SSH_HOST:-root@161.35.58.181}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVER_SCRIPT="$ROOT_DIR/scripts/grant-cursor-agent-ssh-on-server.sh"

if [[ ! -f "$KEY" ]]; then
  echo "Your SSH key not found at: $KEY"
  echo "Set SSH_KEY=/path/to/key and re-run."
  exit 1
fi

if [[ ! -f "$SERVER_SCRIPT" ]]; then
  echo "Missing $SERVER_SCRIPT"
  exit 1
fi

echo "Installing Cursor agent SSH access on $HOST ..."
ssh -i "$KEY" -o BatchMode=yes -o IdentitiesOnly=yes "$HOST" 'bash -s' < "$SERVER_SCRIPT"

echo
echo "Testing agent key ..."
ssh -i "$ROOT_DIR/.cursor/ssh/prince_agent_ed25519" -o BatchMode=yes -o IdentitiesOnly=yes \
  -o StrictHostKeyChecking=accept-new \
  "$HOST" 'echo AGENT_SSH_OK; hostname; whoami'

echo
echo "Success. Cursor can use: .cursor/ssh/prince_agent_ed25519"
