#!/usr/bin/env bash
set -euo pipefail

ORIGIN="${1:-https://peterbrave.github.io}"
EXISTING="$(launchctl getenv OLLAMA_ORIGINS 2>/dev/null || true)"

if [[ -z "$EXISTING" ]]; then
  ALLOWED="$ORIGIN"
elif [[ "$EXISTING" == *"$ORIGIN"* ]]; then
  ALLOWED="$EXISTING"
else
  ALLOWED="$EXISTING,$ORIGIN"
fi

launchctl setenv OLLAMA_ORIGINS "$ALLOWED"
echo "OLLAMA_ORIGINS=$ALLOWED"

killall Ollama 2>/dev/null || true
sleep 1
open -a Ollama

echo "Done. Keep endpoint at http://localhost:11434 in Settings."
