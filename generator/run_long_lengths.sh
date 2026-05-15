#!/usr/bin/env bash
# Sequential build of {13,14,15}tile.db.  Logs each length to its own file.
# Usage:  ./run_long_lengths.sh [start_length] [end_length] [workers]
set -eu
cd "$(dirname "$0")"

START="${1:-13}"
END="${2:-15}"
WORKERS="${3:-7}"

for L in $(seq "$START" "$END"); do
  log="/tmp/len${L}.log"
  echo "════════════════════════════════════════"
  echo " Building length=$L  (logs → $log)"
  echo "════════════════════════════════════════"
  time python3 amath_bingo_exhaustive.py --lengths "$L" --workers "$WORKERS" > "$log" 2>&1
  tail -5 "$log"
done

echo "All lengths $START..$END complete."
