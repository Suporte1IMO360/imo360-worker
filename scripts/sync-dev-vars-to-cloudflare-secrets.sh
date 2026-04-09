#!/usr/bin/env bash
set -euo pipefail

DEV_VARS_FILE="${1:-.dev.vars}"
WRANGLER_ENV="${2:-}"

if [[ ! -f "$DEV_VARS_FILE" ]]; then
  echo "Erro: ficheiro nao encontrado: $DEV_VARS_FILE" >&2
  exit 1
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "Erro: npx nao encontrado no PATH." >&2
  exit 1
fi

put_secret() {
  local key="$1"
  local value="$2"

  if [[ -n "$WRANGLER_ENV" ]]; then
    printf '%s' "$value" | npx wrangler secret put "$key" --env "$WRANGLER_ENV"
  else
    printf '%s' "$value" | npx wrangler secret put "$key"
  fi
}

echo "A sincronizar secrets a partir de: $DEV_VARS_FILE"
if [[ -n "$WRANGLER_ENV" ]]; then
  echo "Ambiente Wrangler: $WRANGLER_ENV"
fi

count=0
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%$'\r'}"

  [[ -z "$line" ]] && continue
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ "$line" != *=* ]] && continue

  key="${line%%=*}"
  value="${line#*=}"

  key="$(echo "$key" | tr -d '[:space:]')"
  [[ -z "$key" ]] && continue

  put_secret "$key" "$value"
  count=$((count + 1))
  echo "OK: $key"
done < "$DEV_VARS_FILE"

echo "Concluido. Total de secrets atualizados: $count"
