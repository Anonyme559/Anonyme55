# Journal des modifications (Changelog) — Budget Manager

Toutes les modifications notables apportées à ce projet sont documentées dans ce fichier en suivant le versioning sémantique et la chronologie des versions.

---

## [5.0.1] - 2026-11-10

### 🐛 Correctifs
- **Virements** : le badge « Virement », la flèche ➔ et les montants des virements s'affichaient sans couleur (variables CSS `--primary` / `--primary-subtle` inexistantes).
- **Suppression de compte** : les objectifs d'épargne liés au compte supprimé étaient déliés à l'écran mais ce changement n'était pas enregistré.
- **Import JSON** : des objectifs ou des récurrences portant le même identifiant recevaient désormais un identifiant unique (modifier ou supprimer l'un affectait aussi l'autre).
- **Comptes** : le solde initial est arrondi au centime et le type de compte est vérifié.
- **Filtre par compte** : la liste déroulante suit l'état de l'application (plus de désynchronisation après un import ou une suppression de compte).
- **Formulaires** : les dates saisies (ajout et édition) sont validées au même format que les dates importées.

### 📁 Fichiers modifiés
- `index.html`, `css/style.css`, `js/app.js`, `sw.js`, `CHANGELOG.md`

---

## [5.0.0] - 2026-11-10

### 🚀 Nouvelles fonctionnalités
- **Prévision du solde de fin de mois** : nouvelle carte « Prévision au JJ/MM/AAAA » = solde actuel + échéances récurrentes du mois pas encore enregistrées. Alerte visuelle si un compte passe sous zéro. Suit le filtre de compte actif.
- **Pagination de la liste des transactions** : 10 / 25 / 50 / 100 lignes par page (choix mémorisé), navigation par numéros de page, retour en page 1 à chaque changement de filtre ou de recherche.
- **Catégories personnalisées** (bouton « Gérer les catégories ») :
  - création de catégories de dépenses et de revenus avec couleur au choix (utilisée dans les graphiques) ;
  - renommage répercuté sur tout l'historique, les récurrences et les plafonds budgétaires ;
  - suppression avec réaffectation vers la catégorie par défaut (« Autre dépense » / « Autre revenu », non supprimable) ;
  - les catégories inconnues d'un import CSV/JSON sont ajoutées automatiquement.
- **Récurrences avancées** :
  - fréquences hebdomadaire, mensuelle, trimestrielle et annuelle à partir d'une date de première échéance ;
  - affichage du calendrier (« Chaque lundi », « Chaque année, le 15 mars »…), de la prochaine échéance et de l'équivalent mensuel ;
  - **application automatique** à l'ouverture des échéances passées (interrupteur « Application auto ») ; une transaction générée puis supprimée n'est pas recréée ;
  - détection des doublons par échéance (date d'origine mémorisée), même si la transaction est ensuite modifiée.
- **Épargne liée aux comptes** : un objectif peut être associé à un compte. Chaque versement / retrait crée un vrai virement (ex. Compte Courant ➔ Livret A). La progression de l'objectif est calculée à partir de ces virements : supprimer un virement met l'objectif à jour.
- **Rappel de sauvegarde** : bandeau affiché si aucun export JSON depuis 30 jours (bouton « Exporter maintenant » ou report de 7 jours) ; date de la dernière sauvegarde dans le pied de page.

### ✨ Améliorations
- Sélecteur Dépense / Revenu / Virement sur une seule ligne.
- Icônes dans le tableau pour les transactions issues d'une récurrence (↻) ou d'un objectif d'épargne (◎).
- L'export JSON inclut les catégories ; migration automatique des récurrences v4 (champ « jour » ➔ date de première échéance).

### 📁 Fichiers modifiés
- `index.html`, `css/style.css`, `js/app.js`, `sw.js`, `CHANGELOG.md`

---

## [4.1.0] - 2026-11-10

### 🐛 Correctifs
- **Statistiques** : les barres « Détail par catégorie » et les légendes des graphiques en anneau ne s'affichaient pas (classes JS ≠ classes CSS).
- **Sécurité / intégrité des données** : validation et normalisation de toutes les données chargées et importées (montants texte qui faussaient les totaux par concaténation, dates invalides, identifiants en double, champ `day` des récurrences injecté sans échappement → faille XSS via un fichier importé).
- **Migration v1/v2** : le solde initial des anciennes versions était ignoré et remplacé par des comptes de démonstration (+4 350 €). Il est désormais repris sur un compte unique.
- **Données de démo** : elles n'apparaissent plus qu'à la toute première visite (plus de réinjection si une seule clé du stockage manque).
- **Récurrences** : détection des opérations déjà appliquées via un identifiant (`recurringId`) au lieu de l'intitulé et du montant, ce qui évite les doublons après une modification.
- **Suppression de compte** : les virements devenus « compte → même compte » sont retirés au lieu d'être redirigés vers un autre compte (ce qui faussait son solde).
- **Réinitialisation** : les comptes repartent à 0 € (et les constantes par défaut ne sont plus modifiées par référence).
- **Édition** : les catégories personnalisées (import CSV) sont conservées ; date obligatoire.
- **Objectifs** : calcul de l'échéance sans décalage de fuseau horaire ; mention « Échéance dépassée ».
- **Budgets** : message clair quand toutes les catégories ont déjà un plafond.
- **Formulaire** : synchronisation du type sélectionné quand le navigateur restaure le formulaire au rechargement.
- **PWA** : `respondWith` renvoie toujours une `Response`, mise en cache limitée à la même origine, tailles d'icônes correctes dans le manifeste.

### ✨ Améliorations
- Total affiché au centre des graphiques en anneau et pourcentage dans la légende.
- Badge « ✓ Appliquée ce mois » / « en attente » sur chaque récurrence.
- Budget : reste disponible par jour jusqu'à la fin du mois.
- Confirmation avant un import JSON qui remplace les données ; import des sauvegardes v1/v2.
- Export CSV compatible Excel FR (virgule décimale, échappement des champs) ; import CSV acceptant les dates `JJ/MM/AAAA`.
- Recherche par montant au format français (`12,50`).
- Thème système respecté par défaut, sans flash blanc au chargement.
- Modales défilables sur petits écrans, focus clavier visible, cartes de comptes utilisables au clavier, prise en compte de `prefers-reduced-motion`.

### 📁 Fichiers modifiés
- `index.html`, `css/style.css`, `js/app.js`, `manifest.json`, `sw.js`, `CHANGELOG.md`

---

## [4.0.0] - 2026-09-15

### 🚀 Nouveautés & Fonctionnalités ajoutées
- **Module complet de Virements internes entre comptes** :
  - Transfert direct de fonds d'un compte source (débit) vers un compte cible (crédit) (ex. *Compte Courant ➔ Livret A* ou *Espèces*).
  - Préservation rigoureuse de l'intégrité des flux : les transferts ne faussent ni les statistiques de revenus réels, ni celles des dépenses, ni les plafonds budgétaires consommés.
  - Option `Virement` intégrée dans le formulaire principal d'ajout et dans la boîte de dialogue d'édition avec sélection des deux comptes.
  - Badge visuel distinctif bleu (`Virement`), affichage du flux compte source ➔ compte destination et montant coloré/adapté selon le compte filtré.
  - Nouveau filtre dédié `Virements uniquement` dans la barre de recherche et filtres de transactions.
- **Transformation en Progressive Web App (PWA) & Fonctionnement Hors-ligne** :
  - Création du fichier de configuration `manifest.json` avec icônes multi-résolutions, thème et mode standalone.
  - Mise en place du Service Worker `sw.js` avec mise en cache des assets pour un fonctionnement autonome 100% hors-ligne.
  - Possibilité d'installer l'application sur smartphone (iOS / Android) comme une application native et sur ordinateur (Chrome / Edge).
- **Mise à niveau des Données & Exports/Imports** :
  - Mise à jour des formats d'export/import JSON et CSV pour intégrer les comptes de destination des virements tout en garantissant une rétrocompatibilité complète avec les anciennes sauvegardes.
  - Incrémentation officielle de version vers `v4.0.0`.

### 📁 Fichiers créés / modifiés
- `manifest.json` : Manifeste PWA pour l'installation native et la configuration de l'application.
- `sw.js` : Service Worker pour la mise en cache et le mode hors-ligne.
- `index.html` : Liens manifest/meta PWA, champs de virement (compte source / destination) et filtres.
- `css/style.css` : Styles des badges de virements, flèches de flux et adaptations graphiques.
- `js/app.js` : Gestion d'état des virements, calculs de solde multi-comptes, gestionnaires de formulaires et enregistrement du Service Worker.
- `CHANGELOG.md` : Documentation officielle de la version 4.0.0.

---

## [3.0.0] - 2026-09-15

### 🚀 Nouveautés & Fonctionnalités ajoutées
- **Module Multi-comptes / Portefeuilles** :
  - Création, édition et suppression de comptes personnalisés (Compte Courant, Livret Épargne, Espèces, etc.).
  - Calcul et affichage en temps réel du solde individuel par compte et du patrimoine global cumulé.
  - Attribution d'un compte pour chaque dépense et revenu lors de la création ou modification.
  - Nouveau filtre instantané par compte dans la liste chronologique des transactions et affichage d'un badge compte dans le tableau.
- **Module Objectifs d'Épargne & Cagnottes** :
  - Création de projets d'épargne avec montant cible et date d'échéance facultative.
  - Jauges de progression dynamiques (% atteint, code couleur d'accomplissement).
  - Actions rapides de versement (`+ Verser`) et de retrait (`- Retirer`) via boîte de dialogue dédiée.
  - Calcul automatique de l'effort d'épargne mensuel recommandé pour atteindre l'objectif dans les délais.
  - Synthèse globale du montant total épargné et du taux d'avancement global.
- **Module Transactions Récurrentes & Abonnements** :
  - Suivi des charges fixes mensuelles (loyer, assurances, abonnements) et revenus réguliers (salaires).
  - Synthèse de l'impact net mensuel des charges et rentrées automatiques.
  - Bouton intelligent `⚡ Appliquer ce mois-ci` générant en un clic les transactions dues pour le mois en cours sans doublon.
- **Améliorations techniques & Évolution des données** :
  - Mise à jour de l'exportation et de l'importation JSON pour sauvegarder et restaurer l'intégralité des comptes, cagnottes et récurrences.
  - Rétrocompatibilité totale avec les sauvegardes des versions précédentes (`v1.0.0`, `v2.0.0`).
  - Navigation enrichie avec accès direct aux sections Épargne et Récurrents.
  - Mise à jour des badges de version et de la modale Changelog vers la version `v3.0.0`.

### 📁 Fichiers modifiés
- `index.html` : Intégration des modules Comptes, Épargne, Récurrents, des filtres, colonnes et modales associées.
- `css/style.css` : Design responsive et styles dark/light pour les cartes de comptes, d'épargne et de récurrences.
- `js/app.js` : Implémentation complète de la gestion d'état, des calculs de solde, des versements, de l'application des récurrences et du versioning.
- `CHANGELOG.md` : Documentation détaillée de la version 3.0.0.

---

## [2.0.0] - 2026-09-15

### 🚀 Nouveautés & Fonctionnalités ajoutées
- **Module complet de gestion des plafonds budgétaires (Budgets mensuels par catégorie)** :
  - Définition d'un montant mensuel maximum par catégorie de dépense.
  - Jauges de consommation dynamiques avec statuts visuels (vert pour normal, orange d'avertissement à partir de 80%, rouge d'alerte en cas de dépassement).
  - Synthèse globale du mois (Budget total alloué, Total dépensé dans les catégories budgétées, Reste disponible).
  - Modale interactive pour créer, modifier ou supprimer un plafond budgétaire.
- **Système officiel de Versioning & Journal des modifications (Changelog)** :
  - Badge de version interactif (`v2.0.0`) intégré dans la barre de navigation et le pied de page.
  - Modale dédiée « Journal des versions » accessible d'un simple clic affichant l'historique complet et les fichiers modifiés.
  - Sauvegarde locale automatique des plafonds budgétaires dans le `localStorage`.
  - Intégration des données de budgets dans l'export et l'import de données au format JSON.

### 📁 Fichiers modifiés / créés
- `index.html` : Ajout du lien de navigation Budgets, du badge de version, de la section `#budgets`, de la modale de configuration des budgets et de la modale Changelog.
- `css/style.css` : Styles complets des cartes budgétaires, barres de progression, alertes visuelles, badges de version et de la modale Changelog.
- `js/app.js` : Logique de calcul des consommations budgétaires du mois, gestion du stockage local des budgets, gestionnaires de modales et historique des versions.
- `CHANGELOG.md` : Création du fichier de suivi officiel des versions du projet.

---

## [1.1.0] - 2026-09-15

### 🐛 Correctifs & Améliorations visuelles
- **Correction du mode sombre sur la carte de solde** :
  - Résolution du problème d'arrière-plan blanc persistant sur la carte « Solde total disponible » (`.primary-card`) lors du passage en thème sombre.
  - Adaptation des variables d'arrière-plan du formulaire de solde initial (`.initial-balance-form input`) pour un rendu fluide et sans éblouissement en mode nuit.

### 📁 Fichiers modifiés
- `css/style.css` : Ajout de la règle `[data-theme="dark"] .primary-card` avec dégradé sombre et harmonisation des couleurs des champs de saisie.

---

## [1.0.0] - 2026-09-15

### 🚀 Version Initiale de l'application
- **Gestion du solde et des liquidités** :
  - Configuration du solde initial et calcul en temps réel du solde total disponible.
  - Récapitulatifs visuels des revenus et des dépenses.
- **Gestion des transactions** :
  - Formulaire d'ajout rapide (Dépense / Revenu, montant, catégorie, date, description).
  - Tableau chronologique des transactions avec indicateurs visuels.
  - Modification via boîte de dialogue (modale) et suppression avec notification Toast d'annulation (Undo).
- **Filtres & Recherche** :
  - Filtrage par période temporelle (Toutes, Ce mois-ci, Mois dernier, Cette année).
  - Filtrage par type d'opération (Revenus / Dépenses).
  - Barre de recherche textuelle instantanée.
- **Statistiques & Visualisation** :
  - Indicateurs clés (moyenne de dépenses, solde net des flux, taux d'épargne).
  - Graphiques interactifs en anneau SVG (Donut charts) pour la répartition des dépenses et des revenus.
  - Barres de répartition détaillées par catégorie.
- **Fonctionnalités avancées** :
  - Thème sombre / clair avec bascule instantanée et persistance locale.
  - Export et import complet des données au format JSON et CSV.
  - Réinitialisation complète des données.
  - Stockage 100% sécurisé et local (localStorage, aucune donnée transmise à des tiers).

### 📁 Fichiers créés
- `index.html` : Structure HTML5 accessible et responsive.
- `css/style.css` : Design system moderne en CSS pur (variables, flexbox, grid, animations, mode sombre).
- `js/app.js` : Architecture JavaScript modulaire, robuste et réactive.
- `favicon.ico`, `icon.svg`, `icon.png` : Identité visuelle et icônes du projet.
