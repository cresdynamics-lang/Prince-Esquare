#!/bin/bash
# Run THIS on the production server (as root) to authorize the Cursor agent SSH key.
# Safe to re-run — it will not duplicate the key.
set -euo pipefail

AGENT_PUBKEY='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILgfgCIzYKF2n3j6QkvfjXiBErHrgOSJnVMbdAHNEDWX cursor-agent@prince-esquire'
AUTH_FILE="${HOME}/.ssh/authorized_keys"

mkdir -p "${HOME}/.ssh"
chmod 700 "${HOME}/.ssh"
touch "$AUTH_FILE"
chmod 600 "$AUTH_FILE"

if grep -qF 'cursor-agent@prince-esquire' "$AUTH_FILE" 2>/dev/null; then
  echo "Agent key already present in $AUTH_FILE"
else
  printf '\n%s\n' "$AGENT_PUBKEY" >> "$AUTH_FILE"
  echo "Added Cursor agent key to $AUTH_FILE"
fi

echo
echo "Done. The Cursor agent can now SSH as: $(whoami)@$(hostname -I 2>/dev/null | awk '{print $1}' || hostname)"
echo "Fingerprint comment: cursor-agent@prince-esquire"
