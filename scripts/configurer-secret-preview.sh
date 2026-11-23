#!/usr/bin/env bash
set -euo pipefail

# À lancer manuellement depuis le dépôt après authentification Wrangler.
# La valeur du secret est saisie directement dans Wrangler : ne jamais
# la passer en argument, dans Git, dans un journal CI ni dans un chat.
# Ce script cible UNIQUEMENT la Preview migration-cloudflare, jamais la prod.

if [[ ! -f wrangler.jsonc ]]; then
  echo "Lancez ce script depuis la racine du dépôt Trade-In Pro."
  exit 1
fi

echo "Cible : Worker trade-in-pro / Preview migration-cloudflare uniquement."
echo "Récupérez la clé privée du projet Supabase autonome xuvaihwygkcwriqfnkbg."
echo "Ne saisissez jamais une clé d'un autre projet ou une clé publique."
echo "Wrangler demandera la valeur du secret via son invite sécurisée."

bunx wrangler preview secret put SUPABASE_SERVICE_ROLE_KEY \
  --worker-name trade-in-pro \
  --name migration-cloudflare

echo "Secret transmis à Cloudflare Preview. Vérifiez les bindings et testez les flux Auth."
