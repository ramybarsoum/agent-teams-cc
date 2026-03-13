# Phase Argument Parsing

Parse and normalize phase arguments for commands that operate on phases.

## Extraction

From `$ARGUMENTS`:
- Extract phase number (first numeric argument)
- Extract flags (prefixed with `--`)
- Remaining text is description (for insert/add commands)

## Normalization

Zero-pad integer phases to 2 digits. Preserve decimal suffixes.

```bash
# Normalize phase number
if [[ "$PHASE" =~ ^[0-9]+$ ]]; then
  # Integer: 8 → 08
  PHASE=$(printf "%02d" "$PHASE")
elif [[ "$PHASE" =~ ^([0-9]+)\.([0-9]+)$ ]]; then
  # Decimal: 2.1 → 02.1
  PHASE=$(printf "%02d.%s" "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}")
fi
```

## Validation

Validate phase exists by checking the roadmap:

```bash
# Check if phase directory exists
PHASE_DIR=$(ls -d .planning/phases/${PHASE}-* 2>/dev/null | head -1)
if [ -z "$PHASE_DIR" ]; then
  echo "ERROR: Phase ${PHASE} not found"
  exit 1
fi
```

## Directory Lookup

Find the phase directory by number:

```bash
# Find phase directory matching the number
PHASE_DIR=$(ls -d .planning/phases/${PHASE}-* 2>/dev/null | head -1)
PHASE_NAME=$(basename "$PHASE_DIR" | sed "s/^${PHASE}-//")
```
