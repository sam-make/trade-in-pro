# Architecture cible et état opérationnel de Trade-In Pro

## Source de code : GitHub

Dépôt actuel : `sam-make/trade-in-pro`, branche de travail `migration-cloudflare`, pull request [#1](https://github.com/sam-make/trade-in-pro/pull/1) **en brouillon**. Pas de modification de `main` ni de fusion avant décision explicite.

## Application : Cloudflare Workers

Le code TanStack Start / React fonctionne indépendamment de Lovable ; il est compilé avec Vite et hébergé dans Cloudflare Workers. La préproduction de la branche est accessible sur :

https://migration-cloudflare-trade-in-pro.samysamsung695.workers.dev

Les contrôles CI et les tests navigateur Chrome PC/mobile sans identifiants vérifient les pages publiques et la redirection des pages protégées. Une CI verte ne valide **pas** toutes les écritures Auth, métier ou paiement.

## Données et Auth : projet Supabase autonome

**Projet cible unique** : `xuvaihwygkcwriqfnkbg` (`eu-west-3`). Les comptes Auth et les tables métier restaurés restent à comparer à la source lors de la bascule. Ce projet autonome est déjà peuplé de données réelles : ne pas y ajouter de comptes ou dossiers fictifs sans environnement isolé et autorisation appropriée.

Le projet staging historiquement abandonné **ne doit jamais être utilisé**. La source Lovable Cloud reste la source de vérité pour les données tant que la bascule n'est pas validée.

### Bindings Cloudflare

- `SUPABASE_URL` : URL du projet cible, publique dans les métadonnées HTML SSR.
- `SUPABASE_PUBLISHABLE_KEY` : clé publiable, autorisée côté navigateur.
- `SUPABASE_SERVICE_ROLE_KEY` : **clé privée exclusivement serveur**, jamais dans les bundles, métadonnées HTML, journaux, commits ou messages. À ce stade son binding manque en préproduction : les opérations utilisant le client privilégié restent bloquées.

Suivre [ACTIVER_PREPROD_CLOUDFLARE.md](ACTIVER_PREPROD_CLOUDFLARE.md) pour l'activation ponctuelle et sécurisée de ce secret **uniquement dans la Preview**. Ne jamais réduire les politiques RLS pour contourner une clé absente.

## Sécurité et exploitation

- Les politiques RLS doivent cloisonner toutes les données de boutiques ; revues JWT réelles, tests multi-boutiques et des fonctions `SECURITY DEFINER` requis.
- Les règles d'Auth, les redirections e-mail, le suivi de réparation, les factures, les photos, le super-admin et les parcours mobiles doivent être testés avant l'ouverture publique.
- Le système de paiement, les tarifs, l'identité du propriétaire et Lovable en production sont conservés sans modification.
- Hébergement à coût zéro supplémentaire visé, **sous réserve des quotas réels** des offres gratuites ; pas de dépense ou souscription automatique.
- Sauvegardes restaurables, comparaison finale de la source Lovable après arrêt contrôlé des écritures, plan de retour arrière et autorisation explicite constituent des conditions de GO.

Voir [NOTES.md](../NOTES.md), [AGENTS_PRODUCTION.md](AGENTS_PRODUCTION.md) et [MIGRATION_PRODUCTION.md](MIGRATION_PRODUCTION.md) pour les preuves d'audit et les conditions de mise en production.
