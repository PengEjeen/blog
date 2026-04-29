#!/usr/bin/env bash
# Orchestrator loop controller — minimal.
# Reads artifacts/state.json, decides next status.
set -euo pipefail

STATE="${STATE:-artifacts/state.json}"
[[ -f "$STATE" ]] || { echo "no state.json"; exit 1; }

read_field() { python3 -c "import json,sys;print(json.load(open('$STATE')).get('$1',''))"; }

ITER=$(read_field iteration)
MAX=$(read_field max_iterations)
STATUS=$(read_field status)
EVAL_PASS=$(python3 -c "import json;d=json.load(open('$STATE'));print(d.get('eval',{}).get('passed',False))")

if [[ "$EVAL_PASS" == "True" ]]; then
  NEW="passed"
elif (( ITER >= MAX )); then
  NEW="stopped"
else
  NEW="running"
fi

python3 - <<PY
import json
p="$STATE"
d=json.load(open(p))
d["status"]="$NEW"
d["iteration"]=$ITER+(0 if "$NEW"!="running" else 1)
json.dump(d,open(p,"w"),indent=2,ensure_ascii=False)
PY

echo "iter=$ITER status=$NEW eval_pass=$EVAL_PASS"
