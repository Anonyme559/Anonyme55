/**
 * Budget Manager — Application JavaScript
 * Gestion de budget simple, moderne, 100% locale avec multi-comptes, objectifs d'épargne, transactions récurrentes, plafonds budgétaires, graphiques, mode sombre, édition et imports/exports
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. Constantes & Catégories par défaut
  // ==========================================================================

  const APP_VERSION = '5.0.1';

  const STORAGE_KEY_TRANSACTIONS = 'budget_manager_transactions';
  const STORAGE_KEY_INITIAL_BALANCE = 'budget_manager_initial_balance';
  const STORAGE_KEY_THEME = 'budget_manager_theme';
  const STORAGE_KEY_BUDGETS = 'budget_manager_budgets';
  const STORAGE_KEY_ACCOUNTS = 'budget_manager_accounts';
  const STORAGE_KEY_ACTIVE_ACCOUNT = 'budget_manager_active_account';
  const STORAGE_KEY_GOALS = 'budget_manager_goals';
  const STORAGE_KEY_RECURRING = 'budget_manager_recurring';
  const STORAGE_KEY_CATEGORIES = 'budget_manager_categories';
  const STORAGE_KEY_SETTINGS = 'budget_manager_settings';

  const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
  const BACKUP_REMINDER_DAYS = 30;
  const BACKUP_SNOOZE_DAYS = 7;
  const DAY_MS = 86400000;

  // Fréquences des opérations récurrentes (perMonth = équivalent mensuel)
  const FREQUENCIES = {
    weekly: { label: 'Hebdomadaire', perMonth: 52 / 12 },
    monthly: { label: 'Mensuel', perMonth: 1 },
    quarterly: { label: 'Trimestriel', perMonth: 1 / 3 },
    yearly: { label: 'Annuel', perMonth: 1 / 12 }
  };

  // Catégories « de repli » qui ne peuvent pas être supprimées
  const PROTECTED_CATEGORY_IDS = { expense: 'autre_depense', income: 'autre_revenu' };

  // Historique des versions (Changelog officiel)
  const CHANGELOG_HISTORY = [
    {
      version: '5.0.1',
      date: '2026-11-10',
      title: 'Correctifs : couleurs des virements, suppression de compte & imports',
      changes: [
        'Badge « Virement », flèche et montants des virements à nouveau colorés (variables CSS manquantes)',
        'Suppression d\'un compte : le détachement des objectifs d\'épargne liés est désormais enregistré',
        'Import JSON : identifiants uniques garantis pour les objectifs et les récurrences',
        'Solde initial des comptes arrondi au centime et type de compte vérifié',
        'Filtre par compte toujours synchronisé avec l\'état de l\'application',
        'Validation des dates saisies dans les formulaires d\'ajout et d\'édition'
      ],
      files: ['index.html', 'css/style.css', 'js/app.js', 'sw.js', 'CHANGELOG.md']
    },
    {
      version: '5.0.0',
      date: '2026-11-10',
      title: 'Prévision, pagination, catégories personnalisées, récurrences avancées & épargne liée',
      changes: [
        'Prévision du solde de fin de mois (solde actuel + opérations récurrentes à venir) avec alerte si un compte passe en négatif',
        'Pagination de la liste des transactions (10, 25, 50 ou 100 par page) avec navigation entre les pages',
        'Catégories personnalisées : création, renommage (répercuté sur l\'historique, les budgets et les récurrences), couleur et suppression',
        'Récurrences avancées : fréquences hebdomadaire, mensuelle, trimestrielle et annuelle, date de première échéance et prochaine échéance affichée',
        'Application automatique des récurrences échues à l\'ouverture de l\'application (désactivable)',
        'Objectifs d\'épargne liés à un compte : chaque versement ou retrait crée un vrai virement entre comptes',
        'Rappel de sauvegarde si aucun export JSON n\'a été fait depuis 30 jours',
        'Sélecteur de type (Dépense / Revenu / Virement) affiché sur une seule ligne'
      ],
      files: ['index.html', 'css/style.css', 'js/app.js', 'sw.js', 'CHANGELOG.md']
    },
    {
      version: '4.1.0',
      date: '2026-11-10',
      title: 'Correctifs de fiabilité, sécurité des imports & améliorations',
      changes: [
        'Correction des barres de répartition par catégorie et des légendes des graphiques qui ne s\'affichaient pas (classes CSS non concordantes)',
        'Total affiché au centre des graphiques en anneau',
        'Validation et nettoyage complet des données chargées et importées (montants, dates, identifiants) : corrige les calculs faussés par des montants texte et une faille XSS possible via un fichier importé',
        'Migration des anciennes sauvegardes v1/v2 : le solde initial est conservé au lieu d\'être remplacé par des comptes de démonstration',
        'Confirmation avant un import JSON qui remplace les données existantes',
        'Récurrences : détection fiable des opérations déjà appliquées (même après modification du montant ou de la description) et badge « Appliquée ce mois »',
        'Suppression d\'un compte : les virements devenus internes au compte de repli sont supprimés au lieu de fausser un autre compte',
        'Réinitialisation : les comptes repartent avec un solde à 0 €',
        'Modale d\'édition : conservation des catégories personnalisées (CSV) et vérification de la date',
        'Export CSV compatible Excel FR (virgule décimale, champs échappés) ; import CSV acceptant les dates JJ/MM/AAAA',
        'Budgets : indication du reste disponible par jour jusqu\'à la fin du mois',
        'Thème : respect du thème système par défaut et suppression du flash blanc au chargement',
        'Modales défilables sur petits écrans, recherche par montant au format français, correctifs PWA (manifeste, Service Worker)'
      ],
      files: ['index.html', 'css/style.css', 'js/app.js', 'manifest.json', 'sw.js', 'CHANGELOG.md']
    },
    {
      version: '4.0.0',
      date: '2026-09-15',
      title: 'Virements internes entre comptes & Application PWA Hors-ligne',
      changes: [
        'Module complet de Virements internes : transferts d\'argent fluides entre comptes (ex. Compte Courant ➔ Livret A ou Espèces) sans fausser les revenus ou dépenses réels',
        'Support des transferts dans le formulaire d\'ajout, la modale d\'édition, les badges et le tableau chronologique',
        'Nouveau filtre « Virements uniquement » dans la barre de recherche et de filtres',
        'Transformation en Progressive Web App (PWA) : installable sur smartphone (iOS/Android) et PC',
        'Fonctionnement autonome 100% hors-ligne grâce au Service Worker et au manifeste PWA',
        'Mise à jour des exports/imports JSON et CSV pour intégrer les flux inter-comptes'
      ],
      files: ['index.html', 'css/style.css', 'js/app.js', 'manifest.json', 'sw.js', 'CHANGELOG.md']
    },
    {
      version: '3.0.0',
      date: '2026-09-15',
      title: 'Multi-comptes, Objectifs d\'épargne & Transactions récurrentes',
      changes: [
        'Gestion multi-comptes / portefeuilles (Compte Courant, Livret A / Épargne, Espèces...) avec soldes individuels et calcul du patrimoine global',
        'Attribution de compte par transaction et filtrage dédié dans le tableau de bord',
        'Module complet d\'Objectifs d\'épargne (cagnottes) avec jauges de progression, versements, retraits et calcul de l\'effort mensuel',
        'Module de Transactions récurrentes (abonnements et revenus périodiques) avec synthèse de l\'impact net et bouton d\'application mensuelle en un clic',
        'Boîtes de dialogue interactives pour gérer les comptes, projets d\'épargne et récurrences',
        'Mise à jour complète des exports et imports JSON pour prendre en charge l\'ensemble des nouvelles données',
        'Incrémentation officielle de version vers la v3.0.0'
      ],
      files: ['index.html', 'css/style.css', 'js/app.js', 'CHANGELOG.md']
    },
    {
      version: '2.0.0',
      date: '2026-09-15',
      title: 'Plafonds budgétaires par catégorie & Système de versions',
      changes: [
        'Nouveau module complet de gestion des plafonds budgétaires mensuels par catégorie',
        'Jauges visuelles dynamiques avec codes couleur (vert, alerte orange à 80%, alerte rouge en cas de dépassement)',
        'Synthèse budgétaire globale (alloué, consommé, reste disponible)',
        'Modale de configuration et modification rapide des plafonds par catégorie',
        'Intégration du système de suivi des versions et journal des modifications interactif (Changelog)',
        'Badges de version cliquables dans l\'en-tête et le pied de page',
        'Persistance locale automatique des budgets dans le localStorage et support dans l\'export/import JSON'
      ],
      files: ['index.html', 'css/style.css', 'js/app.js', 'CHANGELOG.md']
    },
    {
      version: '1.1.0',
      date: '2026-09-15',
      title: 'Correctif du mode sombre pour le solde disponible',
      changes: [
        'Correction du fond blanc persistant sur la carte du Solde total disponible en mode sombre',
        'Harmonisation des variables de couleurs et arrière-plans pour tous les thèmes'
      ],
      files: ['css/style.css']
    },
    {
      version: '1.0.0',
      date: '2026-09-15',
      title: 'Version initiale de Budget Manager',
      changes: [
        'Gestion du solde initial et calcul du solde disponible en temps réel',
        'Ajout, modification et suppression de transactions (dépenses et revenus)',
        'Filtres avancés par période (ce mois-ci, mois dernier, cette année) et recherche textuelle',
        'Statistiques synthétiques et graphiques en anneau (Donut SVG) interactifs',
        'Support du thème clair et sombre avec mémorisation',
        'Exportation et importation des données au format JSON et CSV'
      ],
      files: ['index.html', 'css/style.css', 'js/app.js']
    }
  ];

  const DEFAULT_ACCOUNTS = [
    { id: 'courant', name: 'Compte Courant', type: 'checking', initialBalance: 1200 },
    { id: 'livret-a', name: 'Livret A / Épargne', type: 'savings', initialBalance: 3000 },
    { id: 'especes', name: 'Espèces / Portefeuille', type: 'cash', initialBalance: 150 }
  ];

  const DEFAULT_GOALS = [
    {
      id: 'goal-1',
      name: 'Vacances d\'été',
      targetAmount: 1500,
      currentAmount: 650,
      targetDate: '2027-07-01'
    },
    {
      id: 'goal-2',
      name: 'Fonds d\'urgence',
      targetAmount: 3000,
      currentAmount: 1800,
      targetDate: ''
    }
  ];

  const DEFAULT_RECURRING = [
    {
      id: 'rec-1',
      type: 'expense',
      name: 'Loyer et charges',
      amount: 650.00,
      accountId: 'courant',
      category: 'Logement & Factures',
      day: 5
    },
    {
      id: 'rec-2',
      type: 'income',
      name: 'Salaire mensuel',
      amount: 2400.00,
      accountId: 'courant',
      category: 'Salaire & Rémunération',
      day: 28
    },
    {
      id: 'rec-3',
      type: 'expense',
      name: 'Abonnement Netflix & Musique',
      amount: 22.98,
      accountId: 'courant',
      category: 'Loisirs & Sorties',
      day: 12
    }
  ];

  const EXPENSE_COLORS = ['#ef4444', '#f97316', '#eab308', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b', '#3b82f6'];
  const INCOME_COLORS = ['#22c55e', '#10b981', '#14b8a6', '#0ea5e9', '#6366f1', '#a855f7', '#84cc16'];
  const CATEGORY_PALETTES = { expense: EXPENSE_COLORS, income: INCOME_COLORS };

  // Catégories par défaut (personnalisables par l'utilisateur, voir state.categories)
  const DEFAULT_CATEGORIES = {
    expense: [
      { id: 'alimentation', label: 'Alimentation & Courses', color: '#ef4444' },
      { id: 'logement', label: 'Logement & Factures', color: '#f97316' },
      { id: 'transport', label: 'Transport & Carburant', color: '#eab308' },
      { id: 'loisirs', label: 'Loisirs & Sorties', color: '#8b5cf6' },
      { id: 'shopping', label: 'Achats & Shopping', color: '#ec4899' },
      { id: 'sante', label: 'Santé & Soins', color: '#06b6d4' },
      { id: 'autre_depense', label: 'Autre dépense', color: '#64748b' }
    ],
    income: [
      { id: 'salaire', label: 'Salaire & Rémunération', color: '#22c55e' },
      { id: 'investissements', label: 'Investissements & Dividendes', color: '#0ea5e9' },
      { id: 'primes', label: 'Primes & Cadeaux', color: '#a855f7' },
      { id: 'ventes', label: 'Ventes & Remboursements', color: '#14b8a6' },
      { id: 'autre_revenu', label: 'Autre revenu', color: '#84cc16' }
    ]
  };

  // Données de démonstration initiales si l'utilisateur découvre le site
  const INITIAL_DEMO_DATA = {
    initialBalance: 1200,
    budgets: {
      'Alimentation & Courses': 450,
      'Logement & Factures': 700,
      'Transport & Carburant': 80,
      'Loisirs & Sorties': 120
    },
    transactions: [
      {
        id: 'tx-demo-1',
        type: 'income',
        amount: 2400.00,
        accountId: 'courant',
        category: 'Salaire & Rémunération',
        description: 'Salaire mensuel',
        date: getFormattedDateOffset(-5),
        createdAt: Date.now() - 500000
      },
      {
        id: 'tx-demo-2',
        type: 'expense',
        amount: 650.00,
        accountId: 'courant',
        category: 'Logement & Factures',
        description: 'Loyer et charges',
        date: getFormattedDateOffset(-4),
        createdAt: Date.now() - 400000
      },
      {
        id: 'tx-demo-3',
        type: 'expense',
        amount: 142.50,
        accountId: 'courant',
        category: 'Alimentation & Courses',
        description: 'Supermarché',
        date: getFormattedDateOffset(-2),
        createdAt: Date.now() - 300000
      },
      {
        id: 'tx-demo-4',
        type: 'expense',
        amount: 45.00,
        accountId: 'courant',
        category: 'Transport & Carburant',
        description: 'Recharge carte de transport',
        date: getFormattedDateOffset(-1),
        createdAt: Date.now() - 200000
      },
      {
        id: 'tx-demo-5',
        type: 'transfer',
        amount: 200.00,
        accountId: 'courant',
        toAccountId: 'livret-a',
        category: 'Virement interne',
        description: 'Épargne mensuelle vers Livret A',
        date: getFormattedDateOffset(-1),
        createdAt: Date.now() - 100000
      }
    ]
  };

  // ==========================================================================
  // 2. État de l'application (State)
  // ==========================================================================

  const state = {
    initialBalance: 0,
    accounts: [],
    activeAccountId: 'all',
    goals: [],
    recurring: [],
    transactions: [],
    budgets: {},
    categories: { expense: [], income: [] },
    settings: {
      pageSize: 10,
      autoApplyRecurring: true,
      lastExportAt: null,
      backupSnoozeUntil: null,
      firstUseAt: null
    },
    currentPage: 1,
    categoriesModalType: 'expense',
    filterAccount: 'all',
    filterType: 'all',
    filterPeriod: 'all',
    searchQuery: '',
    currentTheme: 'light',
    lastDeletedTx: null
  };

  // ==========================================================================
  // 3. Éléments DOM
  // ==========================================================================

  const dom = {
    // Thème & Version
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    iconSun: document.querySelector('.icon-sun'),
    iconMoon: document.querySelector('.icon-moon'),
    versionBadgeBtn: document.getElementById('versionBadgeBtn'),
    footerVersionBtn: document.getElementById('footerVersionBtn'),

    // Solde actuel & Comptes
    currentBalanceDisplay: document.getElementById('currentBalanceDisplay'),
    balanceSubtext: document.getElementById('balanceSubtext'),
    quickIncomeDisplay: document.getElementById('quickIncomeDisplay'),
    quickIncomeCount: document.getElementById('quickIncomeCount'),
    quickExpenseDisplay: document.getElementById('quickExpenseDisplay'),
    quickExpenseCount: document.getElementById('quickExpenseCount'),
    accountsGrid: document.getElementById('accountsGrid'),
    openAddAccountBtn: document.getElementById('openAddAccountBtn'),

    // Prévision de fin de mois
    forecastCard: document.getElementById('forecastCard'),
    forecastCaption: document.getElementById('forecastCaption'),
    forecastDisplay: document.getElementById('forecastDisplay'),
    forecastDetail: document.getElementById('forecastDetail'),
    forecastAlert: document.getElementById('forecastAlert'),

    // Rappel de sauvegarde
    backupReminder: document.getElementById('backupReminder'),
    backupReminderText: document.getElementById('backupReminderText'),
    backupNowBtn: document.getElementById('backupNowBtn'),
    backupLaterBtn: document.getElementById('backupLaterBtn'),
    lastBackupInfo: document.getElementById('lastBackupInfo'),

    // Pagination des transactions
    transactionsPagination: document.getElementById('transactionsPagination'),
    transactionsTable: document.getElementById('transactionsTable'),

    // Gestion des catégories
    openCategoriesBtn: document.getElementById('openCategoriesBtn'),
    categoriesModal: document.getElementById('categoriesModal'),
    closeCategoriesModalBtn: document.getElementById('closeCategoriesModalBtn'),
    closeCategoriesFooterBtn: document.getElementById('closeCategoriesFooterBtn'),
    categoriesTabExpense: document.getElementById('categoriesTabExpense'),
    categoriesTabIncome: document.getElementById('categoriesTabIncome'),
    categoriesList: document.getElementById('categoriesList'),
    addCategoryForm: document.getElementById('addCategoryForm'),
    newCategoryName: document.getElementById('newCategoryName'),
    newCategoryColor: document.getElementById('newCategoryColor'),

    // Formulaire d'ajout
    transactionForm: document.getElementById('transactionForm'),
    typeExpenseRadio: document.getElementById('typeExpense'),
    typeIncomeRadio: document.getElementById('typeIncome'),
    typeTransferRadio: document.getElementById('typeTransfer'),
    labelTypeExpense: document.getElementById('labelTypeExpense'),
    labelTypeIncome: document.getElementById('labelTypeIncome'),
    labelTypeTransfer: document.getElementById('labelTypeTransfer'),
    labelTxAccount: document.getElementById('labelTxAccount'),
    txAmountInput: document.getElementById('txAmount'),
    txAccountSelect: document.getElementById('txAccount'),
    txTargetAccountGroup: document.getElementById('txTargetAccountGroup'),
    txTargetAccountSelect: document.getElementById('txTargetAccount'),
    txCategoryGroup: document.getElementById('txCategoryGroup'),
    txCategorySelect: document.getElementById('txCategory'),
    txDateInput: document.getElementById('txDate'),
    txDescriptionInput: document.getElementById('txDescription'),

    // Modale d'édition de transaction
    editModal: document.getElementById('editModal'),
    editTransactionForm: document.getElementById('editTransactionForm'),
    editTxId: document.getElementById('editTxId'),
    editTypeExpenseRadio: document.getElementById('editTypeExpense'),
    editTypeIncomeRadio: document.getElementById('editTypeIncome'),
    editTypeTransferRadio: document.getElementById('editTypeTransfer'),
    labelEditTypeExpense: document.getElementById('labelEditTypeExpense'),
    labelEditTypeIncome: document.getElementById('labelEditTypeIncome'),
    labelEditTypeTransfer: document.getElementById('labelEditTypeTransfer'),
    labelEditTxAccount: document.getElementById('labelEditTxAccount'),
    editTxAmountInput: document.getElementById('editTxAmount'),
    editTxAccountSelect: document.getElementById('editTxAccount'),
    editTxTargetAccountGroup: document.getElementById('editTxTargetAccountGroup'),
    editTxTargetAccountSelect: document.getElementById('editTxTargetAccount'),
    editTxCategoryGroup: document.getElementById('editTxCategoryGroup'),
    editTxCategorySelect: document.getElementById('editTxCategory'),
    editTxDateInput: document.getElementById('editTxDate'),
    editTxDescriptionInput: document.getElementById('editTxDescription'),
    closeEditModalBtn: document.getElementById('closeEditModalBtn'),
    cancelEditModalBtn: document.getElementById('cancelEditModalBtn'),

    // Module Budgets
    budgetsGlobalSummary: document.getElementById('budgetsGlobalSummary'),
    budgetTotalAllocated: document.getElementById('budgetTotalAllocated'),
    budgetTotalSpent: document.getElementById('budgetTotalSpent'),
    budgetTotalRemaining: document.getElementById('budgetTotalRemaining'),
    budgetsGrid: document.getElementById('budgetsGrid'),
    emptyBudgets: document.getElementById('emptyBudgets'),
    openAddBudgetBtn: document.getElementById('openAddBudgetBtn'),
    budgetModal: document.getElementById('budgetModal'),
    budgetModalTitle: document.getElementById('budgetModalTitle'),
    closeBudgetModalBtn: document.getElementById('closeBudgetModalBtn'),
    cancelBudgetModalBtn: document.getElementById('cancelBudgetModalBtn'),
    budgetForm: document.getElementById('budgetForm'),
    budgetCategorySelect: document.getElementById('budgetCategorySelect'),
    budgetLimitInput: document.getElementById('budgetLimitInput'),
    budgetOriginalCategory: document.getElementById('budgetOriginalCategory'),

    // Module Objectifs d'épargne
    goalsGlobalSummary: document.getElementById('goalsGlobalSummary'),
    goalTotalSaved: document.getElementById('goalTotalSaved'),
    goalTotalTarget: document.getElementById('goalTotalTarget'),
    goalGlobalRate: document.getElementById('goalGlobalRate'),
    goalsGrid: document.getElementById('goalsGrid'),
    emptyGoals: document.getElementById('emptyGoals'),
    openAddGoalBtn: document.getElementById('openAddGoalBtn'),
    goalModal: document.getElementById('goalModal'),
    goalModalTitle: document.getElementById('goalModalTitle'),
    closeGoalModalBtn: document.getElementById('closeGoalModalBtn'),
    cancelGoalModalBtn: document.getElementById('cancelGoalModalBtn'),
    goalForm: document.getElementById('goalForm'),
    goalEditId: document.getElementById('goalEditId'),
    goalNameInput: document.getElementById('goalNameInput'),
    goalTargetInput: document.getElementById('goalTargetInput'),
    goalCurrentInput: document.getElementById('goalCurrentInput'),
    goalDateInput: document.getElementById('goalDateInput'),
    goalAccountSelect: document.getElementById('goalAccountSelect'),

    // Modale Versement/Retrait Épargne
    goalTransferModal: document.getElementById('goalTransferModal'),
    goalTransferTitle: document.getElementById('goalTransferTitle'),
    goalTransferDesc: document.getElementById('goalTransferDesc'),
    closeGoalTransferModalBtn: document.getElementById('closeGoalTransferModalBtn'),
    cancelGoalTransferModalBtn: document.getElementById('cancelGoalTransferModalBtn'),
    goalTransferForm: document.getElementById('goalTransferForm'),
    goalTransferId: document.getElementById('goalTransferId'),
    goalTransferType: document.getElementById('goalTransferType'),
    goalTransferAmountInput: document.getElementById('goalTransferAmountInput'),
    submitGoalTransferBtn: document.getElementById('submitGoalTransferBtn'),
    goalTransferAccountGroup: document.getElementById('goalTransferAccountGroup'),
    goalTransferAccountLabel: document.getElementById('goalTransferAccountLabel'),
    goalTransferAccountSelect: document.getElementById('goalTransferAccountSelect'),

    // Module Transactions Récurrentes
    recurringGlobalSummary: document.getElementById('recurringGlobalSummary'),
    recSummaryExpenses: document.getElementById('recSummaryExpenses'),
    recSummaryIncome: document.getElementById('recSummaryIncome'),
    recSummaryNet: document.getElementById('recSummaryNet'),
    recurringGrid: document.getElementById('recurringGrid'),
    emptyRecurring: document.getElementById('emptyRecurring'),
    openAddRecurringBtn: document.getElementById('openAddRecurringBtn'),
    applyRecurringBtn: document.getElementById('applyRecurringBtn'),
    recurringModal: document.getElementById('recurringModal'),
    recurringModalTitle: document.getElementById('recurringModalTitle'),
    closeRecurringModalBtn: document.getElementById('closeRecurringModalBtn'),
    cancelRecurringModalBtn: document.getElementById('cancelRecurringModalBtn'),
    recurringForm: document.getElementById('recurringForm'),
    recurringEditId: document.getElementById('recurringEditId'),
    labelRecTypeExpense: document.getElementById('labelRecTypeExpense'),
    labelRecTypeIncome: document.getElementById('labelRecTypeIncome'),
    recTypeExpense: document.getElementById('recTypeExpense'),
    recTypeIncome: document.getElementById('recTypeIncome'),
    recNameInput: document.getElementById('recNameInput'),
    recAmountInput: document.getElementById('recAmountInput'),
    recAccountSelect: document.getElementById('recAccountSelect'),
    recCategorySelect: document.getElementById('recCategorySelect'),
    recFrequencySelect: document.getElementById('recFrequencySelect'),
    recStartDateInput: document.getElementById('recStartDateInput'),
    autoApplyToggle: document.getElementById('autoApplyToggle'),

    // Modale Gestion de Compte
    accountModal: document.getElementById('accountModal'),
    accountModalTitle: document.getElementById('accountModalTitle'),
    closeAccountModalBtn: document.getElementById('closeAccountModalBtn'),
    cancelAccountModalBtn: document.getElementById('cancelAccountModalBtn'),
    accountForm: document.getElementById('accountForm'),
    accountEditId: document.getElementById('accountEditId'),
    accountNameInput: document.getElementById('accountNameInput'),
    accountTypeSelect: document.getElementById('accountTypeSelect'),
    accountInitialBalanceInput: document.getElementById('accountInitialBalanceInput'),

    // Modale Changelog
    changelogModal: document.getElementById('changelogModal'),
    closeChangelogModalBtn: document.getElementById('closeChangelogModalBtn'),
    closeChangelogFooterBtn: document.getElementById('closeChangelogFooterBtn'),
    changelogContainer: document.getElementById('changelogContainer'),

    // Liste des transactions & filtres
    filterAccountSelect: document.getElementById('filterAccount'),
    filterPeriodSelect: document.getElementById('filterPeriod'),
    filterTypeSelect: document.getElementById('filterType'),
    filterSearchInput: document.getElementById('filterSearch'),
    transactionsTableBody: document.getElementById('transactionsTableBody'),
    emptyState: document.getElementById('emptyState'),

    // Statistiques & Graphiques
    statTotalIncome: document.getElementById('statTotalIncome'),
    statIncomeCount: document.getElementById('statIncomeCount'),
    statTotalExpense: document.getElementById('statTotalExpense'),
    statExpenseCount: document.getElementById('statExpenseCount'),
    statAverageExpense: document.getElementById('statAverageExpense'),
    statNetFlow: document.getElementById('statNetFlow'),
    statSavingsRate: document.getElementById('statSavingsRate'),
    expenseDonutContainer: document.getElementById('expenseDonutContainer'),
    incomeDonutContainer: document.getElementById('incomeDonutContainer'),
    expenseCategoryBreakdown: document.getElementById('expenseCategoryBreakdown'),
    incomeCategoryBreakdown: document.getElementById('incomeCategoryBreakdown'),

    // Footer & Actions
    exportDataBtn: document.getElementById('exportDataBtn'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),
    importFileInput: document.getElementById('importFileInput'),
    resetDataBtn: document.getElementById('resetDataBtn'),

    // Toast
    toast: document.getElementById('toastNotification'),
    toastMessage: document.getElementById('toastMessage'),
    toastActionBtn: document.getElementById('toastActionBtn'),

    // Navigation
    navLinks: document.querySelectorAll('.nav-link')
  };

  let toastTimeoutId = null;

  // ==========================================================================
  // 4. Utilitaires de formatage et dates
  // ==========================================================================

  /**
   * Formate un nombre en montant monétaire avec la devise €
   * @param {number} amount
   * @returns {string}
   */
  function formatCurrency(amount) {
    const validAmount = Number.isFinite(amount) ? amount : 0;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(validAmount);
  }

  /**
   * Retourne la date du jour au format YYYY-MM-DD
   * @returns {string}
   */
  function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Calcule une date décalée de N jours pour les données de démo
   * @param {number} offsetDays
   * @returns {string}
   */
  function getFormattedDateOffset(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Formate une date ISO YYYY-MM-DD en format lisible JJ/MM/AAAA
   * @param {string} dateStr
   * @returns {string}
   */
  function formatDateFr(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  /**
   * Échappe le HTML pour prévenir les failles XSS
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Génère un identifiant unique robuste
   * @returns {string}
   */
  function generateId() {
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
  }

  /**
   * Parse une date au format YYYY-MM-DD de façon neutre (sans décalage de fuseau horaire)
   * @param {string} dateStr
   * @returns {{year: number, month: number, day: number}}
   */
  function parseDateParts(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return { year: 0, month: 0, day: 0 };
    const parts = dateStr.split('-');
    return {
      year: parseInt(parts[0], 10) || 0,
      month: (parseInt(parts[1], 10) || 1) - 1,
      day: parseInt(parts[2], 10) || 1
    };
  }

  /**
   * Découpe proprement une ligne CSV en respectant les délimiteurs et guillemets
   * @param {string} line
   * @param {string} delimiter
   * @returns {string[]}
   */
  function splitCsvLine(line, delimiter) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result.map(s => s.trim().replace(/^"|"$/g, ''));
  }

  /**
   * Prépare une cellule CSV (guillemets échappés)
   * @param {*} value
   * @returns {string}
   */
  function csvCell(value) {
    return `"${String(value === undefined || value === null ? '' : value).replace(/"/g, '""')}"`;
  }

  /**
   * Copie profonde d'une structure de données simple (JSON)
   */
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // ==========================================================================
  // 4 bis. Validation & normalisation des données (stockage et imports)
  // ==========================================================================

  const VALID_TX_TYPES = ['income', 'expense', 'transfer'];
  const VALID_ACCOUNT_TYPES = ['checking', 'savings', 'cash', 'other'];

  /**
   * Convertit une valeur quelconque en montant numérique arrondi au centime
   * (accepte "12,50", "12.5", 12.5)
   * @returns {number} NaN si la valeur n'est pas exploitable
   */
  function toAmount(value) {
    const n = typeof value === 'number'
      ? value
      : parseFloat(String(value === undefined || value === null ? '' : value).replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
  }

  /**
   * Normalise une date en YYYY-MM-DD (accepte aussi JJ/MM/AAAA et JJ-MM-AAAA)
   * @returns {string} chaîne vide si invalide
   */
  function normalizeDateString(value) {
    if (typeof value !== 'string') return '';
    const str = value.trim();
    let y, m, d;
    let match = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) {
      [, y, m, d] = match;
    } else {
      match = str.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
      if (!match) return '';
      [, d, m, y] = match;
    }
    const year = parseInt(y, 10);
    const month = parseInt(m, 10);
    const day = parseInt(d, 10);
    const check = new Date(year, month - 1, day);
    if (check.getFullYear() !== year || check.getMonth() !== month - 1 || check.getDate() !== day) return '';
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function sanitizeText(value, maxLength) {
    if (value === undefined || value === null) return '';
    return String(value).trim().slice(0, maxLength);
  }

  function sanitizeAccounts(list) {
    if (!Array.isArray(list)) return [];
    const seen = new Set();
    return list
      .filter(a => a && typeof a === 'object')
      .map(a => {
        let id = sanitizeText(a.id, 80) || generateId();
        while (seen.has(id)) id = generateId();
        seen.add(id);
        const balance = toAmount(a.initialBalance);
        return {
          id,
          name: sanitizeText(a.name, 40) || 'Compte',
          type: VALID_ACCOUNT_TYPES.includes(a.type) ? a.type : 'other',
          initialBalance: Number.isFinite(balance) ? balance : 0
        };
      });
  }

  function sanitizeTransactions(list, fallbackAccountId) {
    if (!Array.isArray(list)) return [];
    const seen = new Set();
    const result = [];
    list.forEach((tx, idx) => {
      if (!tx || typeof tx !== 'object') return;
      const amount = toAmount(tx.amount);
      if (!Number.isFinite(amount) || amount <= 0) return;

      let id = sanitizeText(tx.id, 80) || generateId();
      while (seen.has(id)) id = generateId();
      seen.add(id);

      const type = VALID_TX_TYPES.includes(tx.type) ? tx.type : 'expense';
      const item = {
        id,
        type,
        amount,
        accountId: sanitizeText(tx.accountId, 80) || fallbackAccountId,
        category: sanitizeText(tx.category, 80) || (type === 'transfer' ? 'Virement interne' : getFallbackCategoryLabel(type)),
        description: sanitizeText(tx.description, 120),
        date: normalizeDateString(tx.date) || getTodayDateString(),
        createdAt: Number.isFinite(Number(tx.createdAt)) ? Number(tx.createdAt) : Date.now() - idx
      };
      if (type === 'transfer') {
        item.toAccountId = sanitizeText(tx.toAccountId, 80);
      }
      if (tx.recurringId) {
        item.recurringId = sanitizeText(tx.recurringId, 80);
        const recDate = normalizeDateString(tx.recurringDate);
        if (recDate) item.recurringDate = recDate;
      }
      if (tx.goalId) {
        item.goalId = sanitizeText(tx.goalId, 80);
        item.goalAction = tx.goalAction === 'withdraw' ? 'withdraw' : 'deposit';
      }
      result.push(item);
    });
    return result;
  }

  function sanitizeBudgets(obj) {
    const result = {};
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return result;
    Object.entries(obj).forEach(([category, limit]) => {
      const val = toAmount(limit);
      const cat = sanitizeText(category, 80);
      if (cat && Number.isFinite(val) && val > 0) result[cat] = val;
    });
    return result;
  }

  /** Identifiant unique : un doublon (import) ferait modifier/supprimer deux éléments à la fois */
  function uniqueId(rawId, seen) {
    let id = sanitizeText(rawId, 80) || generateId();
    while (seen.has(id)) id = generateId();
    seen.add(id);
    return id;
  }

  function sanitizeGoals(list) {
    if (!Array.isArray(list)) return [];
    const seen = new Set();
    return list
      .filter(g => g && typeof g === 'object')
      .map(g => {
        const target = toAmount(g.targetAmount);
        // currentAmount = part « manuelle » de l'épargne (peut être négative si des
        // virements liés ont été corrigés) ; le total affiché inclut les virements liés.
        const current = toAmount(g.currentAmount);
        return {
          id: uniqueId(g.id, seen),
          name: sanitizeText(g.name, 50) || 'Objectif',
          targetAmount: Number.isFinite(target) && target > 0 ? target : 1,
          currentAmount: Number.isFinite(current) ? current : 0,
          targetDate: normalizeDateString(g.targetDate),
          accountId: sanitizeText(g.accountId, 80)
        };
      });
  }

  function sanitizeRecurring(list, fallbackAccountId) {
    if (!Array.isArray(list)) return [];
    const now = new Date();
    const seen = new Set();
    return list
      .filter(r => r && typeof r === 'object')
      .map(r => {
        const amount = toAmount(r.amount);
        const type = r.type === 'income' ? 'income' : 'expense';
        const frequency = FREQUENCIES[r.frequency] ? r.frequency : 'monthly';
        // Migration v4.x : l'ancien champ "day" devient la date de première échéance du mois en cours
        let startDate = normalizeDateString(r.startDate);
        if (!startDate) {
          const day = Math.min(31, Math.max(1, parseInt(r.day, 10) || 1));
          startDate = addMonthsClamped(now.getFullYear(), now.getMonth(), day, 0);
        }
        return {
          id: uniqueId(r.id, seen),
          type,
          name: sanitizeText(r.name, 60) || 'Opération récurrente',
          amount: Number.isFinite(amount) && amount > 0 ? amount : 0,
          accountId: sanitizeText(r.accountId, 80) || fallbackAccountId,
          category: sanitizeText(r.category, 80) || getFallbackCategoryLabel(type),
          frequency,
          startDate,
          appliedUntil: normalizeDateString(r.appliedUntil) || getDefaultAppliedUntil(startDate)
        };
      })
      .filter(r => r.amount > 0);
  }

  function sanitizeCategories(obj) {
    const result = { expense: [], income: [] };
    ['expense', 'income'].forEach(type => {
      const list = obj && Array.isArray(obj[type]) ? obj[type] : DEFAULT_CATEGORIES[type];
      const seenLabels = new Set();
      const seenIds = new Set();
      list.forEach(cat => {
        if (!cat || typeof cat !== 'object') return;
        const label = sanitizeText(cat.label, 80);
        if (!label || seenLabels.has(label.toLowerCase())) return;
        let id = sanitizeText(cat.id, 80) || ('cat-' + generateId());
        while (seenIds.has(id)) id = 'cat-' + generateId();
        seenLabels.add(label.toLowerCase());
        seenIds.add(id);
        result[type].push({
          id,
          label,
          color: isValidHexColor(cat.color) ? cat.color.toLowerCase() : pickCategoryColor(type, result[type].length)
        });
      });
      // La catégorie de repli doit toujours exister
      const protectedId = PROTECTED_CATEGORY_IDS[type];
      if (!result[type].some(c => c.id === protectedId)) {
        const def = DEFAULT_CATEGORIES[type].find(c => c.id === protectedId);
        let label = def.label;
        if (seenLabels.has(label.toLowerCase())) {
          // Une catégorie personnalisée porte déjà ce nom : elle devient la catégorie de repli
          result[type].find(c => c.label.toLowerCase() === label.toLowerCase()).id = protectedId;
        } else {
          result[type].push({ ...def });
        }
      }
    });
    return result;
  }

  function sanitizeSettings(obj) {
    const s = obj && typeof obj === 'object' ? obj : {};
    const num = v => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Number(v) : null);
    return {
      pageSize: PAGE_SIZE_OPTIONS.includes(Number(s.pageSize)) ? Number(s.pageSize) : 10,
      autoApplyRecurring: s.autoApplyRecurring !== false,
      lastExportAt: num(s.lastExportAt),
      backupSnoozeUntil: num(s.backupSnoozeUntil),
      firstUseAt: num(s.firstUseAt)
    };
  }

  function isValidHexColor(value) {
    return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
  }

  function pickCategoryColor(type, index) {
    const palette = CATEGORY_PALETTES[type] || EXPENSE_COLORS;
    return palette[index % palette.length];
  }

  // ==========================================================================
  // 4 ter. Utilitaires de dates (récurrences, prévisions)
  // ==========================================================================

  function dateToString(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function stringToDate(str) {
    const p = parseDateParts(str);
    return new Date(p.year, p.month, p.day);
  }

  function addDays(dateStr, days) {
    const d = stringToDate(dateStr);
    d.setDate(d.getDate() + days);
    return dateToString(d);
  }

  /**
   * Ajoute N mois à une date (année, mois 0-11, jour) en ramenant le jour
   * au dernier jour du mois si nécessaire (ex. 31 janvier + 1 mois = 28/29 février)
   */
  function addMonthsClamped(year, month, day, monthsToAdd) {
    const total = month + monthsToAdd;
    const y = year + Math.floor(total / 12);
    const m = ((total % 12) + 12) % 12;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    return dateToString(new Date(y, m, Math.min(day, daysInMonth)));
  }

  function getCurrentMonthBounds() {
    const now = new Date();
    return {
      start: dateToString(new Date(now.getFullYear(), now.getMonth(), 1)),
      end: dateToString(new Date(now.getFullYear(), now.getMonth() + 1, 0))
    };
  }

  function maxDateString(a, b) {
    if (!a) return b;
    if (!b) return a;
    return a > b ? a : b;
  }

  /**
   * Date jusqu'à laquelle une nouvelle récurrence est considérée comme « traitée » :
   * la veille de sa première échéance, sans remonter avant le début du mois en cours
   * (évite de générer un historique entier pour une date de départ ancienne).
   */
  function getDefaultAppliedUntil(startDate) {
    return addDays(maxDateString(startDate, getCurrentMonthBounds().start), -1);
  }

  /**
   * Répare les références vers des comptes inexistants (après import ou suppression)
   */
  function repairAccountReferences() {
    if (state.accounts.length === 0) {
      state.accounts = deepClone(DEFAULT_ACCOUNTS).map(a => ({ ...a, initialBalance: 0 }));
    }
    const ids = new Set(state.accounts.map(a => a.id));
    const fallbackId = state.accounts[0].id;

    state.transactions = state.transactions.filter(t => {
      if (!ids.has(t.accountId)) t.accountId = fallbackId;
      if (t.type === 'transfer') {
        if (!ids.has(t.toAccountId)) {
          const other = state.accounts.find(a => a.id !== t.accountId);
          if (!other) {
            // Un seul compte : le virement n'a plus de sens, il devient une dépense
            t.type = 'expense';
            t.category = getFallbackCategoryLabel('expense');
            delete t.toAccountId;
            return true;
          }
          t.toAccountId = other.id;
        }
        // Un virement d'un compte vers lui-même n'a aucun effet : on le retire
        if (t.toAccountId === t.accountId) return false;
      } else {
        delete t.toAccountId;
      }
      return true;
    });

    state.recurring.forEach(r => {
      if (!ids.has(r.accountId)) r.accountId = fallbackId;
    });

    // Un objectif lié à un compte supprimé redevient un simple compteur
    state.goals.forEach(g => {
      if (g.accountId && !ids.has(g.accountId)) g.accountId = '';
    });

    if (state.filterAccount !== 'all' && !ids.has(state.filterAccount)) {
      state.filterAccount = 'all';
    }
  }

  /**
   * Sélectionne une valeur dans un <select>, en ajoutant l'option si elle n'existe pas
   * (ex. catégorie personnalisée importée depuis un CSV)
   */
  function setSelectValue(selectElement, value) {
    if (!selectElement || !value) return;
    const exists = Array.from(selectElement.options).some(o => o.value === value);
    if (!exists) {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = value;
      selectElement.appendChild(opt);
    }
    selectElement.value = value;
  }

  /**
   * Clé de mois "YYYY-MM" pour une date donnée
   */
  function getMonthKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  // ==========================================================================
  // 5. Gestion de la persistance (LocalStorage)
  // ==========================================================================

  function loadJsonFromStorage(key) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.warn(`Erreur lecture ${key}:`, e);
      return null;
    }
  }

  function saveJsonToStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Erreur sauvegarde ${key}:`, e);
    }
  }

  function saveCategoriesToStorage() {
    saveJsonToStorage(STORAGE_KEY_CATEGORIES, state.categories);
  }

  function saveSettingsToStorage() {
    saveJsonToStorage(STORAGE_KEY_SETTINGS, state.settings);
  }

  function loadInitialBalanceFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_INITIAL_BALANCE);
      if (stored !== null) {
        const val = parseFloat(stored);
        return Number.isFinite(val) ? val : 0;
      }
    } catch (e) {
      console.warn('Erreur lecture solde initial:', e);
    }
    return null;
  }

  function saveInitialBalanceToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_INITIAL_BALANCE, state.initialBalance.toString());
    } catch (e) {
      console.warn('Erreur sauvegarde solde initial:', e);
    }
  }

  function loadAccountsFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erreur lecture comptes:', e);
    }
    return null;
  }

  function saveAccountsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(state.accounts));
    } catch (e) {
      console.warn('Erreur sauvegarde comptes:', e);
    }
  }

  function loadGoalsFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_GOALS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erreur lecture objectifs:', e);
    }
    return null;
  }

  function saveGoalsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(state.goals));
    } catch (e) {
      console.warn('Erreur sauvegarde objectifs:', e);
    }
  }

  function loadRecurringFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_RECURRING);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erreur lecture récurrences:', e);
    }
    return null;
  }

  function saveRecurringToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_RECURRING, JSON.stringify(state.recurring));
    } catch (e) {
      console.warn('Erreur sauvegarde récurrences:', e);
    }
  }

  function loadTransactionsFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map(tx => ({
            ...tx,
            accountId: tx.accountId || 'courant'
          }));
        }
      }
    } catch (e) {
      console.warn('Erreur lecture transactions:', e);
    }
    return null;
  }

  function saveTransactionsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(state.transactions));
    } catch (e) {
      console.warn('Erreur sauvegarde transactions:', e);
    }
  }

  function loadBudgetsFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_BUDGETS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erreur lecture budgets:', e);
    }
    return null;
  }

  function saveBudgetsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(state.budgets));
    } catch (e) {
      console.warn('Erreur sauvegarde budgets:', e);
    }
  }

  function getSystemTheme() {
    try {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (e) {
      return 'light';
    }
  }

  function loadThemeFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_THEME);
      return stored === 'dark' || stored === 'light' ? stored : null;
    } catch (e) {
      return null;
    }
  }

  function saveThemeToStorage(theme) {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch (e) {
      console.warn('Erreur sauvegarde theme:', e);
    }
  }

  // ==========================================================================
  // 6. Gestion du Thème (Clair / Sombre)
  // ==========================================================================

  function applyTheme(theme, persist = true) {
    state.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', theme === 'dark' ? '#151c2c' : '#2563eb');

    if (theme === 'dark') {
      if (dom.iconSun) dom.iconSun.classList.add('hidden');
      if (dom.iconMoon) dom.iconMoon.classList.remove('hidden');
    } else {
      if (dom.iconSun) dom.iconSun.classList.remove('hidden');
      if (dom.iconMoon) dom.iconMoon.classList.add('hidden');
    }
    if (persist) saveThemeToStorage(theme);
  }

  function toggleTheme() {
    const nextTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  }

  // ==========================================================================
  // 7. Modale Changelog (Journal des versions)
  // ==========================================================================

  function renderChangelogList() {
    if (!dom.changelogContainer) return;

    dom.changelogContainer.innerHTML = CHANGELOG_HISTORY.map(item => `
      <div class="changelog-version-card">
        <div class="changelog-card-header">
          <span class="changelog-v-badge">v${escapeHtml(item.version)}</span>
          <span class="changelog-date">${formatDateFr(item.date)}</span>
        </div>
        <h4 class="changelog-title">${escapeHtml(item.title)}</h4>
        <ul class="changelog-list">
          ${item.changes.map(ch => `<li>${escapeHtml(ch)}</li>`).join('')}
        </ul>
        <div class="changelog-files">
          <strong>Fichiers modifiés :</strong>
          ${item.files.map(f => `<span class="changelog-file-tag">${escapeHtml(f)}</span>`).join('')}
        </div>
      </div>
    `).join('');
  }

  function openChangelogModal() {
    renderChangelogList();
    if (dom.changelogModal) {
      dom.changelogModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeChangelogModal() {
    if (dom.changelogModal) {
      dom.changelogModal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  // ==========================================================================
  // 8. Gestion des Comptes & Portefeuilles
  // ==========================================================================

  function getAccountById(id) {
    return state.accounts.find(acc => acc.id === id) || null;
  }

  function getAccountName(id) {
    const acc = getAccountById(id);
    return acc ? acc.name : 'Compte Courant';
  }

  function getAccountTypeLabel(type) {
    switch (type) {
      case 'savings': return 'Épargne';
      case 'cash': return 'Espèces';
      case 'other': return 'Autre';
      case 'checking':
      default: return 'Courant';
    }
  }

  function calculateAccountBalance(accountId) {
    const acc = getAccountById(accountId);
    if (!acc) return 0;
    const initial = Number(acc.initialBalance) || 0;
    const income = state.transactions
      .filter(t => t.type === 'income' && t.accountId === accountId)
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = state.transactions
      .filter(t => t.type === 'expense' && t.accountId === accountId)
      .reduce((sum, t) => sum + t.amount, 0);
    const transfersIn = state.transactions
      .filter(t => t.type === 'transfer' && t.toAccountId === accountId)
      .reduce((sum, t) => sum + t.amount, 0);
    const transfersOut = state.transactions
      .filter(t => t.type === 'transfer' && t.accountId === accountId)
      .reduce((sum, t) => sum + t.amount, 0);

    return initial + income - expense + transfersIn - transfersOut;
  }

  function calculateTotalWealth() {
    return state.accounts.reduce((total, acc) => total + calculateAccountBalance(acc.id), 0);
  }

  function populateAccountSelect(selectElement, selectedId) {
    if (!selectElement) return;
    selectElement.innerHTML = state.accounts.map(acc => `
      <option value="${escapeHtml(acc.id)}" ${acc.id === selectedId ? 'selected' : ''}>
        ${escapeHtml(acc.name)} (${getAccountTypeLabel(acc.type)})
      </option>
    `).join('');
  }

  function populateAccountFilter() {
    if (!dom.filterAccountSelect) return;
    // L'état fait foi (le <select> peut contenir un compte supprimé ou un import obsolète)
    const currentVal = state.filterAccount || 'all';
    dom.filterAccountSelect.innerHTML = `
      <option value="all" ${currentVal === 'all' ? 'selected' : ''}>Tous les comptes</option>
      ${state.accounts.map(acc => `
        <option value="${escapeHtml(acc.id)}" ${acc.id === currentVal ? 'selected' : ''}>
          ${escapeHtml(acc.name)}
        </option>
      `).join('')}
    `;
  }

  function renderAccounts() {
    if (!dom.accountsGrid) return;

    dom.accountsGrid.innerHTML = state.accounts.map(acc => {
      const balance = calculateAccountBalance(acc.id);
      const isSelected = state.filterAccount === acc.id;
      const txCount = state.transactions.filter(t => t.accountId === acc.id || (t.type === 'transfer' && t.toAccountId === acc.id)).length;

      return `
        <div class="account-card ${isSelected ? 'active' : ''}" data-account-id="${escapeHtml(acc.id)}" tabindex="0" role="button" aria-pressed="${isSelected}" title="${isSelected ? 'Afficher tous les comptes' : 'Filtrer sur ce compte'}">
          <div class="account-card-header">
            <span class="account-card-name">${escapeHtml(acc.name)}</span>
            <span class="account-type-badge">${escapeHtml(getAccountTypeLabel(acc.type))}</span>
          </div>
          <div class="account-card-balance ${balance >= 0 ? 'income-text' : 'expense-text'}">
            ${formatCurrency(balance)}
          </div>
          <div class="account-card-footer">
            <span>${txCount} opération(s)</span>
            <div class="account-card-actions">
              <button type="button" class="btn-edit-icon edit-account-btn" data-id="${escapeHtml(acc.id)}" title="Modifier le compte" aria-label="Modifier le compte">
                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                </svg>
              </button>
              ${state.accounts.length > 1 ? `
                <button type="button" class="btn-danger-icon delete-account-btn" data-id="${escapeHtml(acc.id)}" title="Supprimer le compte" aria-label="Supprimer le compte">
                  <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    const currentTxSource = dom.txAccountSelect ? dom.txAccountSelect.value : null;
    const currentTxTarget = dom.txTargetAccountSelect ? dom.txTargetAccountSelect.value : null;
    const currentEditSource = dom.editTxAccountSelect ? dom.editTxAccountSelect.value : null;
    const currentEditTarget = dom.editTxTargetAccountSelect ? dom.editTxTargetAccountSelect.value : null;
    const currentRecSource = dom.recAccountSelect ? dom.recAccountSelect.value : null;

    const defaultSourceId = (currentTxSource && state.accounts.some(a => a.id === currentTxSource))
      ? currentTxSource
      : (state.filterAccount !== 'all' ? state.filterAccount : (state.accounts[0]?.id || 'courant'));

    const defaultTargetId = (currentTxTarget && state.accounts.some(a => a.id === currentTxTarget) && currentTxTarget !== defaultSourceId)
      ? currentTxTarget
      : (state.accounts.find(a => a.id !== defaultSourceId)?.id || state.accounts[0]?.id || 'courant');

    populateAccountSelect(dom.txAccountSelect, defaultSourceId);
    populateAccountSelect(dom.txTargetAccountSelect, defaultTargetId);
    populateAccountSelect(dom.editTxAccountSelect, currentEditSource && state.accounts.some(a => a.id === currentEditSource) ? currentEditSource : defaultSourceId);
    populateAccountSelect(dom.editTxTargetAccountSelect, currentEditTarget && state.accounts.some(a => a.id === currentEditTarget) ? currentEditTarget : defaultTargetId);
    populateAccountSelect(dom.recAccountSelect, currentRecSource && state.accounts.some(a => a.id === currentRecSource) ? currentRecSource : defaultSourceId);
    populateAccountFilter();
  }

  function openAccountModal(id = null) {
    if (!dom.accountModal) return;
    if (id) {
      const acc = getAccountById(id);
      if (!acc) return;
      dom.accountModalTitle.textContent = 'Modifier le compte';
      dom.accountEditId.value = acc.id;
      dom.accountNameInput.value = acc.name;
      dom.accountTypeSelect.value = acc.type;
      dom.accountInitialBalanceInput.value = acc.initialBalance;
    } else {
      dom.accountModalTitle.textContent = 'Nouveau compte / portefeuille';
      dom.accountEditId.value = '';
      dom.accountNameInput.value = '';
      dom.accountTypeSelect.value = 'checking';
      dom.accountInitialBalanceInput.value = '0.00';
    }
    dom.accountModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    dom.accountNameInput.focus();
  }

  function closeAccountModal() {
    if (dom.accountModal) {
      dom.accountModal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  function saveAccount(id, name, type, initialBalance) {
    if (!name.trim()) {
      showToast('Veuillez spécifier un nom de compte valide');
      return;
    }
    const rounded = toAmount(initialBalance);
    const balanceVal = Number.isFinite(rounded) ? rounded : 0;
    const accountType = VALID_ACCOUNT_TYPES.includes(type) ? type : 'other';

    if (id) {
      const acc = getAccountById(id);
      if (acc) {
        acc.name = name.trim();
        acc.type = accountType;
        acc.initialBalance = balanceVal;
        showToast(`Compte « ${acc.name} » mis à jour`);
      }
    } else {
      const newAcc = {
        id: 'acc-' + generateId(),
        name: name.trim(),
        type: accountType,
        initialBalance: balanceVal
      };
      state.accounts.push(newAcc);
      showToast(`Compte « ${newAcc.name} » créé avec succès`);
    }

    saveAccountsToStorage();
    closeAccountModal();
    updateUI();
  }

  function deleteAccount(id) {
    const acc = getAccountById(id);
    if (!acc) return;
    if (state.accounts.length <= 1) {
      showToast('Impossible de supprimer le dernier compte.');
      return;
    }

    const confirmDel = window.confirm(`Supprimer le compte « ${acc.name} » ? Les transactions associées seront réassignées au compte principal.`);
    if (!confirmDel) return;

    state.accounts = state.accounts.filter(a => a.id !== id);
    const fallbackId = state.accounts[0].id;

    // Réassigner les transactions au compte de repli.
    // Un virement entre le compte supprimé et le compte de repli devient un virement
    // d'un compte vers lui-même (sans effet) : il est retiré par repairAccountReferences().
    state.transactions.forEach(t => {
      if (t.accountId === id) t.accountId = fallbackId;
      if (t.toAccountId === id) t.toAccountId = fallbackId;
    });
    state.recurring.forEach(r => {
      if (r.accountId === id) r.accountId = fallbackId;
    });
    repairAccountReferences();

    saveRecurringToStorage();
    saveAccountsToStorage();
    saveTransactionsToStorage();
    // repairAccountReferences() délie les objectifs associés au compte supprimé
    saveGoalsToStorage();
    updateUI();
    showToast(`Compte « ${acc.name} » supprimé`);
  }

  // ==========================================================================
  // 9. Module Objectifs d'Épargne & Cagnottes
  // ==========================================================================

  /**
   * Somme des virements réels liés à un objectif (versements - retraits).
   * Calculée à partir de l'historique : supprimer ou modifier un virement lié
   * met donc automatiquement à jour la progression de l'objectif.
   */
  function getGoalLinkedSum(goal) {
    return state.transactions.reduce((sum, t) => {
      if (t.goalId !== goal.id || t.type !== 'transfer') return sum;
      return sum + (t.goalAction === 'withdraw' ? -t.amount : t.amount);
    }, 0);
  }

  /** Montant épargné affiché = part manuelle + virements liés */
  function getGoalCurrentAmount(goal) {
    const total = (Number(goal.currentAmount) || 0) + getGoalLinkedSum(goal);
    return Math.max(0, Math.round(total * 100) / 100);
  }

  function isGoalLinked(goal) {
    return !!(goal.accountId && getAccountById(goal.accountId));
  }

  function renderGoals() {
    if (!dom.goalsGrid) return;

    if (!state.goals || state.goals.length === 0) {
      if (dom.emptyGoals) dom.emptyGoals.classList.remove('hidden');
      dom.goalsGrid.innerHTML = '';
      if (dom.goalTotalSaved) dom.goalTotalSaved.textContent = formatCurrency(0);
      if (dom.goalTotalTarget) dom.goalTotalTarget.textContent = formatCurrency(0);
      if (dom.goalGlobalRate) dom.goalGlobalRate.textContent = '0 %';
      return;
    }

    if (dom.emptyGoals) dom.emptyGoals.classList.add('hidden');

    const totalSaved = state.goals.reduce((sum, g) => sum + getGoalCurrentAmount(g), 0);
    const totalTarget = state.goals.reduce((sum, g) => sum + (Number(g.targetAmount) || 0), 0);
    const globalRate = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

    if (dom.goalTotalSaved) dom.goalTotalSaved.textContent = formatCurrency(totalSaved);
    if (dom.goalTotalTarget) dom.goalTotalTarget.textContent = formatCurrency(totalTarget);
    if (dom.goalGlobalRate) dom.goalGlobalRate.textContent = `${globalRate} %`;

    dom.goalsGrid.innerHTML = state.goals.map(goal => {
      const current = getGoalCurrentAmount(goal);
      const linked = isGoalLinked(goal);
      const target = Number(goal.targetAmount) || 1;
      const rate = Math.min(100, Math.round((current / target) * 100));
      const isComplete = current >= target;
      const remaining = Math.max(0, target - current);

      let targetDateInfo = '';
      if (goal.targetDate) {
        const targetParts = parseDateParts(goal.targetDate);
        const now = new Date();
        const isPast = goal.targetDate < getTodayDateString();
        const diffMonths = Math.max(1, (targetParts.year - now.getFullYear()) * 12 + (targetParts.month - now.getMonth()));
        const monthlyNeeded = remaining / diffMonths;
        let effortHtml = '';
        if (remaining > 0) {
          effortHtml = isPast
            ? `<span class="expense-text">Échéance dépassée</span>`
            : `<span>Effort recommandé : <strong>${formatCurrency(monthlyNeeded)} / mois</strong></span>`;
        }
        targetDateInfo = `
          <span>Échéance visée : <strong>${escapeHtml(formatDateFr(goal.targetDate))}</strong></span>
          ${effortHtml}
        `;
      }

      return `
        <div class="goal-card">
          <div class="goal-card-header">
            <span class="goal-name">${escapeHtml(goal.name)}</span>
            <span class="goal-rate-badge ${isComplete ? 'badge-complete' : ''}">${rate}% ${isComplete ? '✓ Atteint' : ''}</span>
          </div>
          <div class="goal-amounts-row">
            <span class="goal-saved-val ${isComplete ? 'income-text' : ''}">${formatCurrency(current)}</span>
            <span class="goal-target-val">Objectif : ${formatCurrency(target)}</span>
          </div>
          <div class="goal-progress-track">
            <div class="goal-progress-fill ${isComplete ? 'completed' : ''}" style="width: ${rate}%;"></div>
          </div>
          <div class="goal-meta-info">
            <span>Reste à épargner : <strong>${formatCurrency(remaining)}</strong></span>
            ${targetDateInfo}
            ${linked
              ? `<span class="goal-linked-info">Compte lié : <span class="account-pill">${escapeHtml(getAccountName(goal.accountId))}</span></span>`
              : ''}
          </div>
          <div class="goal-card-footer">
            <div class="goal-transfer-actions">
              <button type="button" class="btn btn-primary btn-sm deposit-goal-btn" data-id="${escapeHtml(goal.id)}" title="Verser de l'argent">
                + Verser
              </button>
              <button type="button" class="btn btn-secondary btn-sm withdraw-goal-btn" data-id="${escapeHtml(goal.id)}" title="Retirer de l'argent">
                - Retirer
              </button>
            </div>
            <div class="account-card-actions">
              <button type="button" class="btn-edit-icon edit-goal-btn" data-id="${escapeHtml(goal.id)}" title="Modifier l'objectif">
                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                </svg>
              </button>
              <button type="button" class="btn-danger-icon delete-goal-btn" data-id="${escapeHtml(goal.id)}" title="Supprimer l'objectif">
                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function populateGoalAccountSelect(selectedId) {
    if (!dom.goalAccountSelect) return;
    // Les comptes d'épargne sont proposés en premier
    const sorted = [...state.accounts].sort((a, b) => (a.type === 'savings' ? 0 : 1) - (b.type === 'savings' ? 0 : 1));
    dom.goalAccountSelect.innerHTML = `
      <option value="">Aucun — simple compteur</option>
      ${sorted.map(acc => `
        <option value="${escapeHtml(acc.id)}" ${acc.id === selectedId ? 'selected' : ''}>
          ${escapeHtml(acc.name)} (${getAccountTypeLabel(acc.type)})
        </option>
      `).join('')}
    `;
  }

  function openGoalModal(id = null) {
    if (!dom.goalModal) return;
    if (id) {
      const goal = state.goals.find(g => g.id === id);
      if (!goal) return;
      dom.goalModalTitle.textContent = 'Modifier l\'objectif d\'épargne';
      dom.goalEditId.value = goal.id;
      dom.goalNameInput.value = goal.name;
      dom.goalTargetInput.value = goal.targetAmount;
      dom.goalCurrentInput.value = getGoalCurrentAmount(goal);
      dom.goalDateInput.value = goal.targetDate || '';
      populateGoalAccountSelect(isGoalLinked(goal) ? goal.accountId : '');
    } else {
      dom.goalModalTitle.textContent = 'Nouvel objectif d\'épargne';
      dom.goalEditId.value = '';
      dom.goalNameInput.value = '';
      dom.goalTargetInput.value = '';
      dom.goalCurrentInput.value = '0';
      dom.goalDateInput.value = '';
      populateGoalAccountSelect('');
    }
    dom.goalModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    dom.goalNameInput.focus();
  }

  function closeGoalModal() {
    if (dom.goalModal) {
      dom.goalModal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  function saveGoal(id, name, targetAmount, currentAmount, targetDate, accountId) {
    if (!name.trim()) {
      showToast('Veuillez saisir un nom pour votre projet');
      return;
    }
    const targetVal = toAmount(targetAmount);
    if (isNaN(targetVal) || targetVal <= 0) {
      showToast('Veuillez indiquer un montant cible valide');
      return;
    }
    const currentVal = Math.max(0, toAmount(currentAmount) || 0);
    const linkedAccountId = accountId && getAccountById(accountId) ? accountId : '';

    if (id) {
      const goal = state.goals.find(g => g.id === id);
      if (goal) {
        goal.name = name.trim();
        goal.targetAmount = targetVal;
        // Le montant saisi est le total affiché : on en déduit la part manuelle
        goal.currentAmount = Math.round((currentVal - getGoalLinkedSum(goal)) * 100) / 100;
        goal.targetDate = targetDate || '';
        goal.accountId = linkedAccountId;
        showToast(`Objectif « ${goal.name} » mis à jour`);
      }
    } else {
      const newGoal = {
        id: 'goal-' + generateId(),
        name: name.trim(),
        targetAmount: targetVal,
        currentAmount: currentVal,
        targetDate: targetDate || '',
        accountId: linkedAccountId
      };
      state.goals.push(newGoal);
      showToast(`Objectif « ${newGoal.name} » créé avec succès`);
    }

    saveGoalsToStorage();
    closeGoalModal();
    renderGoals();
  }

  function deleteGoal(id) {
    const goal = state.goals.find(g => g.id === id);
    if (!goal) return;
    const hasLinkedTx = state.transactions.some(t => t.goalId === goal.id);
    const confirmDel = window.confirm(`Supprimer l'objectif « ${goal.name} » ?${hasLinkedTx ? '\n\nLes virements déjà effectués resteront dans l\'historique de vos comptes.' : ''}`);
    if (!confirmDel) return;

    state.goals = state.goals.filter(g => g.id !== id);
    saveGoalsToStorage();
    renderGoals();
    showToast(`Objectif « ${goal.name} » supprimé`);
  }

  function openGoalTransferModal(id, type = 'deposit') {
    const goal = state.goals.find(g => g.id === id);
    if (!goal || !dom.goalTransferModal) return;

    const linked = isGoalLinked(goal);
    const otherAccounts = state.accounts.filter(a => a.id !== goal.accountId);
    if (linked && otherAccounts.length === 0) {
      showToast('Ajoutez un deuxième compte pour pouvoir effectuer un virement vers cet objectif.');
      return;
    }

    dom.goalTransferId.value = goal.id;
    dom.goalTransferType.value = type;
    dom.goalTransferDesc.innerHTML = `Projet : <strong>${escapeHtml(goal.name)}</strong> (Actuel : ${formatCurrency(getGoalCurrentAmount(goal))} / Cible : ${formatCurrency(goal.targetAmount)})`
      + (linked ? `<br><span class="goal-transfer-note">Un virement sera enregistré ${type === 'deposit' ? 'vers' : 'depuis'} le compte <strong>${escapeHtml(getAccountName(goal.accountId))}</strong>.</span>` : '');
    dom.goalTransferAmountInput.value = '';

    if (dom.goalTransferAccountGroup) {
      dom.goalTransferAccountGroup.classList.toggle('hidden', !linked);
      if (linked) {
        dom.goalTransferAccountLabel.innerHTML = `${type === 'deposit' ? 'Depuis le compte' : 'Vers le compte'} <span class="required">*</span>`;
        // Par défaut : un compte courant, sinon le premier compte disponible
        const preferred = otherAccounts.find(a => a.type === 'checking') || otherAccounts[0];
        dom.goalTransferAccountSelect.innerHTML = otherAccounts.map(acc => `
          <option value="${escapeHtml(acc.id)}" ${acc.id === preferred.id ? 'selected' : ''}>
            ${escapeHtml(acc.name)} — ${formatCurrency(calculateAccountBalance(acc.id))}
          </option>
        `).join('');
      }
    }

    if (type === 'deposit') {
      dom.goalTransferTitle.textContent = 'Alimenter la cagnotte';
      dom.submitGoalTransferBtn.textContent = 'Confirmer le versement';
      dom.submitGoalTransferBtn.className = 'btn btn-primary';
    } else {
      dom.goalTransferTitle.textContent = 'Retirer de la cagnotte';
      dom.submitGoalTransferBtn.textContent = 'Confirmer le retrait';
      dom.submitGoalTransferBtn.className = 'btn btn-secondary';
    }

    dom.goalTransferModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    dom.goalTransferAmountInput.focus();
  }

  function closeGoalTransferModal() {
    if (dom.goalTransferModal) {
      dom.goalTransferModal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  function submitGoalTransfer(id, type, amount, otherAccountId) {
    const goal = state.goals.find(g => g.id === id);
    if (!goal) return;

    const val = toAmount(amount);
    if (isNaN(val) || val <= 0) {
      showToast('Veuillez saisir un montant valide');
      return;
    }

    const current = getGoalCurrentAmount(goal);
    if (type === 'withdraw' && val > current) {
      showToast('Le montant retiré dépasse le montant disponible dans cette cagnotte.');
      return;
    }

    if (isGoalLinked(goal)) {
      // Objectif lié : on enregistre un vrai virement entre comptes
      if (!otherAccountId || !getAccountById(otherAccountId) || otherAccountId === goal.accountId) {
        showToast('Veuillez choisir un compte différent du compte d\'épargne lié.');
        return;
      }
      const isDeposit = type === 'deposit';
      state.transactions.unshift({
        id: generateId(),
        type: 'transfer',
        amount: val,
        accountId: isDeposit ? otherAccountId : goal.accountId,
        toAccountId: isDeposit ? goal.accountId : otherAccountId,
        category: 'Virement interne',
        description: `${isDeposit ? 'Versement' : 'Retrait'} épargne : ${goal.name}`.slice(0, 120),
        date: getTodayDateString(),
        createdAt: Date.now(),
        goalId: goal.id,
        goalAction: isDeposit ? 'deposit' : 'withdraw'
      });
      saveTransactionsToStorage();
      closeGoalTransferModal();
      state.currentPage = 1;
      updateUI();
      showToast(isDeposit
        ? `+${formatCurrency(val)} versés sur « ${goal.name} » (virement ${getAccountName(otherAccountId)} ➔ ${getAccountName(goal.accountId)})`
        : `-${formatCurrency(val)} retirés de « ${goal.name} » (virement vers ${getAccountName(otherAccountId)})`);
      return;
    }

    // Objectif non lié : simple compteur
    if (type === 'deposit') {
      goal.currentAmount = Math.round(((Number(goal.currentAmount) || 0) + val) * 100) / 100;
      showToast(`+${formatCurrency(val)} versés sur « ${goal.name} »`);
    } else {
      goal.currentAmount = Math.round(((Number(goal.currentAmount) || 0) - val) * 100) / 100;
      showToast(`-${formatCurrency(val)} retirés de « ${goal.name} »`);
    }

    saveGoalsToStorage();
    closeGoalTransferModal();
    renderGoals();
  }

  // ==========================================================================
  // 10. Module Transactions Récurrentes & Abonnements
  // ==========================================================================

  const WEEKDAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const MONTH_NAMES = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  /**
   * Liste des échéances d'une récurrence comprises entre deux dates (incluses).
   * @param {object} rec
   * @param {string} fromStr YYYY-MM-DD
   * @param {string} toStr YYYY-MM-DD
   * @param {number} limit nombre maximum d'échéances retournées
   * @returns {string[]}
   */
  function getRecurringOccurrences(rec, fromStr, toStr, limit = 500) {
    const result = [];
    if (!rec.startDate || !fromStr || !toStr || toStr < rec.startDate) return result;
    const lower = maxDateString(fromStr, rec.startDate);

    if (rec.frequency === 'weekly') {
      const start = stringToDate(rec.startDate);
      const diffDays = Math.round((stringToDate(lower) - start) / DAY_MS);
      let k = Math.max(0, Math.floor(diffDays / 7));
      for (let guard = 0; guard < 2000 && result.length < limit; guard++, k++) {
        const s = dateToString(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7 * k));
        if (s > toStr) break;
        if (s >= lower) result.push(s);
      }
      return result;
    }

    const step = rec.frequency === 'yearly' ? 12 : (rec.frequency === 'quarterly' ? 3 : 1);
    const p = parseDateParts(rec.startDate);
    const lp = parseDateParts(lower);
    const monthsDiff = (lp.year - p.year) * 12 + (lp.month - p.month);
    let k = Math.max(0, Math.floor(monthsDiff / step));
    for (let guard = 0; guard < 2000 && result.length < limit; guard++, k++) {
      const s = addMonthsClamped(p.year, p.month, p.day, k * step);
      if (s > toStr) break;
      if (s >= lower) result.push(s);
    }
    return result;
  }

  /**
   * Une échéance a-t-elle déjà donné lieu à une transaction ?
   * - transactions v5 : identifiant de récurrence + date d'échéance d'origine
   *   (une modification de la date ou du montant de la transaction ne crée pas de doublon) ;
   * - pour les fréquences mensuelles ou plus longues, une transaction de la même
   *   récurrence dans le même mois suffit ;
   * - transactions antérieures à la v4.1 (sans identifiant) : intitulé + type + montant.
   */
  function isOccurrenceGenerated(rec, occ) {
    const occMonth = occ.slice(0, 7);
    return state.transactions.some(t => {
      if (t.recurringId) {
        if (t.recurringId !== rec.id) return false;
        const ref = t.recurringDate || t.date || '';
        if (ref === occ) return true;
        return rec.frequency !== 'weekly' && ref.slice(0, 7) === occMonth;
      }
      return rec.frequency === 'monthly'
        && (t.date || '').slice(0, 7) === occMonth
        && t.description === rec.name
        && t.type === rec.type
        && t.amount === rec.amount;
    });
  }

  /** Échéance traitée = déjà générée, ou antérieure à la date de dernier traitement */
  function isOccurrenceHandled(rec, occ) {
    return (rec.appliedUntil && occ <= rec.appliedUntil) || isOccurrenceGenerated(rec, occ);
  }

  function getPendingOccurrences(rec, fromStr, toStr) {
    return getRecurringOccurrences(rec, fromStr, toStr).filter(occ => !isOccurrenceHandled(rec, occ));
  }

  function getNextPendingOccurrence(rec) {
    const from = addDays(maxDateString(rec.appliedUntil, addDays(getTodayDateString(), -1)), 1);
    return getRecurringOccurrences(rec, from, '9999-12-31', 12).find(occ => !isOccurrenceGenerated(rec, occ)) || '';
  }

  function createRecurringTransaction(rec, occ) {
    const accountId = getAccountById(rec.accountId) ? rec.accountId : (state.accounts[0]?.id || 'courant');
    state.transactions.unshift({
      id: generateId(),
      type: rec.type,
      amount: rec.amount,
      accountId,
      category: rec.category,
      description: rec.name,
      date: occ,
      createdAt: Date.now(),
      recurringId: rec.id,
      recurringDate: occ
    });
  }

  function getRecurringMonthStatus(rec) {
    const { start, end } = getCurrentMonthBounds();
    const occs = getRecurringOccurrences(rec, start, end);
    const done = occs.filter(occ => isOccurrenceHandled(rec, occ)).length;
    return { total: occs.length, done };
  }

  function formatRecurringSchedule(rec) {
    const p = parseDateParts(rec.startDate);
    const dayLabel = p.day === 1 ? '1er' : String(p.day);
    switch (rec.frequency) {
      case 'weekly':
        return `Chaque ${WEEKDAY_NAMES[stringToDate(rec.startDate).getDay()]}`;
      case 'quarterly':
        return `Tous les 3 mois, le ${dayLabel}`;
      case 'yearly':
        return `Chaque année, le ${dayLabel} ${MONTH_NAMES[p.month]}`;
      case 'monthly':
      default:
        return `Le ${dayLabel} de chaque mois`;
    }
  }

  function getMonthlyEquivalent(rec) {
    const freq = FREQUENCIES[rec.frequency] || FREQUENCIES.monthly;
    return (Number(rec.amount) || 0) * freq.perMonth;
  }

  /**
   * Génère automatiquement les échéances passées (jusqu'à aujourd'hui inclus)
   * non encore traitées. Retourne le nombre de transactions créées.
   */
  function autoApplyRecurring() {
    const today = getTodayDateString();
    let addedCount = 0;
    let recurringChanged = false;

    state.recurring.forEach(rec => {
      const from = addDays(rec.appliedUntil || getDefaultAppliedUntil(rec.startDate), 1);
      if (from <= today) {
        getRecurringOccurrences(rec, from, today, 400).forEach(occ => {
          if (!isOccurrenceGenerated(rec, occ)) {
            createRecurringTransaction(rec, occ);
            addedCount++;
          }
        });
      }
      const newUntil = maxDateString(rec.appliedUntil, today);
      if (newUntil !== rec.appliedUntil) {
        rec.appliedUntil = newUntil;
        recurringChanged = true;
      }
    });

    if (recurringChanged) saveRecurringToStorage();
    if (addedCount > 0) saveTransactionsToStorage();
    return addedCount;
  }

  function setAutoApplyRecurring(enabled) {
    state.settings.autoApplyRecurring = !!enabled;
    saveSettingsToStorage();
    if (!enabled) {
      showToast('Application automatique des récurrences désactivée');
      return;
    }
    // On ne rattrape pas les mois passés pendant la désactivation : seulement le mois en cours
    const monthStart = getCurrentMonthBounds().start;
    state.recurring.forEach(rec => {
      rec.appliedUntil = maxDateString(rec.appliedUntil, addDays(monthStart, -1));
    });
    const added = autoApplyRecurring();
    saveRecurringToStorage();
    updateUI();
    showToast(added > 0
      ? `Application automatique activée : ${added} opération(s) échue(s) ajoutée(s)`
      : 'Application automatique activée : les échéances seront ajoutées à leur date');
  }

  function renderRecurring() {
    if (dom.autoApplyToggle) dom.autoApplyToggle.checked = state.settings.autoApplyRecurring;
    if (!dom.recurringGrid) return;

    if (!state.recurring || state.recurring.length === 0) {
      if (dom.emptyRecurring) dom.emptyRecurring.classList.remove('hidden');
      dom.recurringGrid.innerHTML = '';
      if (dom.recSummaryExpenses) dom.recSummaryExpenses.textContent = formatCurrency(0);
      if (dom.recSummaryIncome) dom.recSummaryIncome.textContent = formatCurrency(0);
      if (dom.recSummaryNet) dom.recSummaryNet.textContent = formatCurrency(0);
      return;
    }

    if (dom.emptyRecurring) dom.emptyRecurring.classList.add('hidden');

    // Synthèse en équivalent mensuel (hebdo x 52/12, trimestriel / 3, annuel / 12)
    const totalExpense = state.recurring
      .filter(r => r.type === 'expense')
      .reduce((sum, r) => sum + getMonthlyEquivalent(r), 0);
    const totalIncome = state.recurring
      .filter(r => r.type === 'income')
      .reduce((sum, r) => sum + getMonthlyEquivalent(r), 0);
    const net = totalIncome - totalExpense;

    if (dom.recSummaryExpenses) dom.recSummaryExpenses.textContent = `-${formatCurrency(totalExpense)}`;
    if (dom.recSummaryIncome) dom.recSummaryIncome.textContent = `+${formatCurrency(totalIncome)}`;
    if (dom.recSummaryNet) {
      dom.recSummaryNet.textContent = formatCurrency(net);
      dom.recSummaryNet.className = `summary-val ${net >= 0 ? 'income-text' : 'expense-text'}`;
    }

    dom.recurringGrid.innerHTML = state.recurring.map(rec => {
      const isExpense = rec.type === 'expense';
      const accName = getAccountName(rec.accountId);
      const freq = FREQUENCIES[rec.frequency] || FREQUENCIES.monthly;
      const status = getRecurringMonthStatus(rec);
      const next = getNextPendingOccurrence(rec);

      let badgeClass = '';
      let badgeText;
      let badgeTitle;
      if (status.total === 0) {
        badgeText = `${freq.label} · pas d'échéance ce mois`;
        badgeTitle = 'Aucune échéance prévue ce mois-ci';
      } else if (status.done >= status.total) {
        badgeClass = 'is-applied';
        badgeText = status.total > 1 ? `✓ ${status.done}/${status.total} ce mois` : '✓ Appliquée ce mois';
        badgeTitle = 'Échéance(s) du mois déjà enregistrée(s)';
      } else {
        badgeClass = 'is-pending';
        badgeText = `${freq.label} · ${status.total - status.done} en attente`;
        badgeTitle = 'Échéance(s) de ce mois pas encore enregistrée(s)';
      }

      return `
        <div class="recurring-card ${isExpense ? 'expense-recur' : 'income-recur'}">
          <div class="recurring-card-header">
            <span class="recurring-title">${escapeHtml(rec.name)}</span>
            <span class="recurring-status-badge ${badgeClass}" title="${badgeTitle}">${badgeText}</span>
          </div>
          <div class="recurring-amount ${isExpense ? 'expense-text' : 'income-text'}">
            ${isExpense ? '-' : '+'}${formatCurrency(rec.amount)}
            ${rec.frequency !== 'monthly' ? `<span class="recurring-monthly-eq">≈ ${formatCurrency(getMonthlyEquivalent(rec))} / mois</span>` : ''}
          </div>
          <div class="recurring-details-row">
            <span class="account-pill">${escapeHtml(accName)}</span>
            <span class="recurring-day-chip">${escapeHtml(formatRecurringSchedule(rec))}</span>
          </div>
          <div class="recurring-next">Prochaine échéance : <strong>${next ? escapeHtml(formatDateFr(next)) : '—'}</strong></div>
          <div class="recurring-card-footer">
            <span style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHtml(rec.category)}</span>
            <div class="account-card-actions">
              <button type="button" class="btn-edit-icon edit-recurring-btn" data-id="${escapeHtml(rec.id)}" title="Modifier la récurrence" aria-label="Modifier la récurrence">
                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                </svg>
              </button>
              <button type="button" class="btn-danger-icon delete-recurring-btn" data-id="${escapeHtml(rec.id)}" title="Supprimer la récurrence" aria-label="Supprimer la récurrence">
                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function openRecurringModal(id = null) {
    if (!dom.recurringModal) return;
    populateAccountSelect(dom.recAccountSelect, state.accounts[0]?.id || 'courant');

    if (id) {
      const rec = state.recurring.find(r => r.id === id);
      if (!rec) return;
      dom.recurringModalTitle.textContent = 'Modifier l\'opération récurrente';
      dom.recurringEditId.value = rec.id;
      handleRecTypeChange(rec.type === 'income' ? 'income' : 'expense');
      dom.recNameInput.value = rec.name;
      dom.recAmountInput.value = rec.amount;
      dom.recAccountSelect.value = rec.accountId || state.accounts[0]?.id || 'courant';
      setSelectValue(dom.recCategorySelect, rec.category);
      if (dom.recFrequencySelect) dom.recFrequencySelect.value = rec.frequency || 'monthly';
      if (dom.recStartDateInput) dom.recStartDateInput.value = rec.startDate || getTodayDateString();
    } else {
      dom.recurringModalTitle.textContent = 'Nouvelle opération récurrente';
      dom.recurringEditId.value = '';
      handleRecTypeChange('expense');
      dom.recNameInput.value = '';
      dom.recAmountInput.value = '';
      dom.recAccountSelect.value = state.accounts[0]?.id || 'courant';
      if (dom.recFrequencySelect) dom.recFrequencySelect.value = 'monthly';
      if (dom.recStartDateInput) dom.recStartDateInput.value = getTodayDateString();
    }
    dom.recurringModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    dom.recNameInput.focus();
  }

  function closeRecurringModal() {
    if (dom.recurringModal) {
      dom.recurringModal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  function saveRecurring(id, type, name, amount, accountId, category, frequency, startDate) {
    if (!name.trim()) {
      showToast('Veuillez saisir un intitulé');
      return;
    }
    const val = toAmount(amount);
    if (isNaN(val) || val <= 0) {
      showToast('Veuillez saisir un montant valide');
      return;
    }
    const freq = FREQUENCIES[frequency] ? frequency : 'monthly';
    const start = normalizeDateString(startDate);
    if (!start) {
      showToast('Veuillez indiquer la date de la première échéance');
      if (dom.recStartDateInput) dom.recStartDateInput.focus();
      return;
    }

    let message;
    if (id) {
      const rec = state.recurring.find(r => r.id === id);
      if (!rec) return;
      const scheduleChanged = rec.frequency !== freq || rec.startDate !== start;
      rec.type = type;
      rec.name = name.trim();
      rec.amount = val;
      rec.accountId = accountId;
      rec.category = category;
      rec.frequency = freq;
      rec.startDate = start;
      if (scheduleChanged) {
        // Nouveau calendrier : seules les échéances à partir d'aujourd'hui sont générées
        rec.appliedUntil = maxDateString(rec.appliedUntil, addDays(getTodayDateString(), -1));
      }
      message = `Récurrence « ${rec.name} » mise à jour`;
    } else {
      const newRec = {
        id: 'rec-' + generateId(),
        type,
        name: name.trim(),
        amount: val,
        accountId,
        category,
        frequency: freq,
        startDate: start,
        appliedUntil: getDefaultAppliedUntil(start)
      };
      state.recurring.push(newRec);
      message = `Récurrence « ${newRec.name} » enregistrée`;
    }

    saveRecurringToStorage();
    closeRecurringModal();

    if (state.settings.autoApplyRecurring) {
      const added = autoApplyRecurring();
      if (added > 0) message += ` — ${added} échéance(s) passée(s) ajoutée(s)`;
    }
    updateUI();
    showToast(message);
  }

  function deleteRecurring(id) {
    const rec = state.recurring.find(r => r.id === id);
    if (!rec) return;
    const confirmDel = window.confirm(`Supprimer la récurrence « ${rec.name} » ?\n\nLes transactions déjà générées restent dans l'historique.`);
    if (!confirmDel) return;

    state.recurring = state.recurring.filter(r => r.id !== id);
    saveRecurringToStorage();
    updateUI();
    showToast(`Récurrence « ${rec.name} » supprimée`);
  }

  /**
   * Bouton « Appliquer ce mois-ci » : génère toutes les échéances du mois en cours
   * (y compris celles à venir) qui n'ont pas encore de transaction.
   */
  function applyMonthlyRecurring() {
    if (!state.recurring || state.recurring.length === 0) {
      showToast('Aucune transaction récurrente configurée.');
      return;
    }

    const { start, end } = getCurrentMonthBounds();
    let addedCount = 0;

    state.recurring.forEach(rec => {
      getRecurringOccurrences(rec, start, end).forEach(occ => {
        if (!isOccurrenceGenerated(rec, occ)) {
          createRecurringTransaction(rec, occ);
          addedCount++;
        }
      });
      rec.appliedUntil = maxDateString(rec.appliedUntil, end);
    });

    saveRecurringToStorage();
    if (addedCount > 0) {
      saveTransactionsToStorage();
      state.currentPage = 1;
      updateUI();
      showToast(`⚡ ${addedCount} opération(s) récurrente(s) générée(s) pour ce mois !`);
    } else {
      updateUI();
      showToast('Toutes les opérations récurrentes de ce mois ont déjà été appliquées.');
    }
  }

  // ==========================================================================
  // 10 bis. Prévision du solde de fin de mois
  // ==========================================================================

  /**
   * Solde prévu en fin de mois = solde actuel (périmètre filtré)
   * + échéances récurrentes du mois pas encore enregistrées.
   */
  function computeMonthForecast() {
    const { start, end } = getCurrentMonthBounds();
    const scope = state.filterAccount;
    const perAccount = {};
    let pendingIncome = 0;
    let pendingExpense = 0;
    let pendingCount = 0;

    state.recurring.forEach(rec => {
      if (scope !== 'all' && rec.accountId !== scope) return;
      const pending = getPendingOccurrences(rec, start, end);
      if (pending.length === 0) return;
      const total = rec.amount * pending.length;
      pendingCount += pending.length;
      if (rec.type === 'income') {
        pendingIncome += total;
      } else {
        pendingExpense += total;
      }
      perAccount[rec.accountId] = (perAccount[rec.accountId] || 0) + (rec.type === 'income' ? total : -total);
    });

    const current = computeBalanceSummary().currentBalance;
    const accountsInScope = scope === 'all' ? state.accounts : state.accounts.filter(a => a.id === scope);
    const negativeAccounts = accountsInScope
      .map(a => ({ name: a.name, value: calculateAccountBalance(a.id) + (perAccount[a.id] || 0) }))
      .filter(a => a.value < -0.004);

    return {
      endDate: end,
      forecast: current + pendingIncome - pendingExpense,
      pendingIncome,
      pendingExpense,
      pendingCount,
      negativeAccounts
    };
  }

  function renderForecast() {
    if (!dom.forecastDisplay) return;
    const f = computeMonthForecast();

    if (dom.forecastCaption) dom.forecastCaption.textContent = `Prévision au ${formatDateFr(f.endDate)}`;
    dom.forecastDisplay.textContent = formatCurrency(f.forecast);
    dom.forecastDisplay.className = `summary-amount ${f.forecast < 0 ? 'expense-text' : 'income-text'}`;

    if (dom.forecastDetail) {
      if (f.pendingCount === 0) {
        dom.forecastDetail.textContent = 'Aucune opération récurrente restante ce mois-ci';
      } else {
        const parts = [];
        if (f.pendingIncome > 0) parts.push(`+${formatCurrency(f.pendingIncome)}`);
        if (f.pendingExpense > 0) parts.push(`-${formatCurrency(f.pendingExpense)}`);
        dom.forecastDetail.textContent = `${f.pendingCount} échéance(s) récurrente(s) à venir : ${parts.join(' / ')}`;
      }
    }

    const hasWarning = f.negativeAccounts.length > 0;
    if (dom.forecastCard) dom.forecastCard.classList.toggle('forecast-warning', hasWarning);
    if (dom.forecastAlert) {
      dom.forecastAlert.classList.toggle('hidden', !hasWarning);
      dom.forecastAlert.textContent = hasWarning
        ? '⚠ ' + f.negativeAccounts.map(a => `${a.name} : ${formatCurrency(a.value)}`).join(' · ') + ' prévu en fin de mois'
        : '';
    }
  }

  // ==========================================================================
  // 11. Gestion des Catégories & Sélecteurs
  // ==========================================================================

  function getCategoryList(type) {
    return (state.categories && state.categories[type]) || [];
  }

  function findCategoryByLabel(type, label) {
    return getCategoryList(type).find(c => c.label === label) || null;
  }

  function getFallbackCategoryLabel(type) {
    const cat = getCategoryList(type).find(c => c.id === PROTECTED_CATEGORY_IDS[type]);
    return cat ? cat.label : (type === 'income' ? 'Autre revenu' : 'Autre dépense');
  }

  function getCategoryColor(type, label, index) {
    const cat = findCategoryByLabel(type, label);
    return cat ? cat.color : pickCategoryColor(type, index);
  }

  function populateCategorySelect(selectElement, type) {
    if (!selectElement) return;
    selectElement.innerHTML = getCategoryList(type)
      .map(cat => `<option value="${escapeHtml(cat.label)}">${escapeHtml(cat.label)}</option>`)
      .join('');
  }

  /**
   * Ajoute aux catégories les libellés utilisés dans les données mais absents de la liste
   * (anciennes sauvegardes, imports CSV) et harmonise la casse des libellés.
   */
  function ensureCategoriesFromData() {
    let changed = false;
    const resolve = (type, label) => {
      if (!label || !state.categories[type]) return label;
      const exact = state.categories[type].find(c => c.label === label);
      if (exact) return label;
      const similar = state.categories[type].find(c => c.label.toLowerCase() === label.toLowerCase());
      if (similar) return similar.label;
      state.categories[type].push({
        id: 'cat-' + generateId(),
        label,
        color: pickCategoryColor(type, state.categories[type].length)
      });
      changed = true;
      return label;
    };

    state.transactions.forEach(t => {
      if (t.type !== 'transfer') t.category = resolve(t.type, t.category);
    });
    state.recurring.forEach(r => {
      r.category = resolve(r.type, r.category);
    });
    Object.keys(state.budgets).forEach(label => {
      const resolved = resolve('expense', label);
      if (resolved !== label) {
        state.budgets[resolved] = state.budgets[label];
        delete state.budgets[label];
      }
    });

    if (changed) saveCategoriesToStorage();
    return changed;
  }

  function getCategoryUsage(type, label) {
    return {
      txCount: state.transactions.filter(t => t.type === type && t.category === label).length,
      recCount: state.recurring.filter(r => r.type === type && r.category === label).length,
      hasBudget: type === 'expense' && state.budgets[label] !== undefined
    };
  }

  /** Recharge le sélecteur du formulaire principal en conservant la catégorie choisie */
  function refreshCategorySelects() {
    if (!dom.txCategorySelect) return;
    const mainType = dom.typeIncomeRadio && dom.typeIncomeRadio.checked ? 'income' : 'expense';
    const current = dom.txCategorySelect.value;
    populateCategorySelect(dom.txCategorySelect, mainType);
    if (current && findCategoryByLabel(mainType, current)) dom.txCategorySelect.value = current;
  }

  function renderCategoriesManager() {
    if (!dom.categoriesList) return;
    const type = state.categoriesModalType;
    const list = getCategoryList(type);

    if (dom.categoriesTabExpense) {
      dom.categoriesTabExpense.classList.toggle('active', type === 'expense');
      dom.categoriesTabExpense.setAttribute('aria-selected', String(type === 'expense'));
    }
    if (dom.categoriesTabIncome) {
      dom.categoriesTabIncome.classList.toggle('active', type === 'income');
      dom.categoriesTabIncome.setAttribute('aria-selected', String(type === 'income'));
    }

    dom.categoriesList.innerHTML = list.map(cat => {
      const usage = getCategoryUsage(type, cat.label);
      const isProtected = cat.id === PROTECTED_CATEGORY_IDS[type];
      const usageParts = [`${usage.txCount} opération(s)`];
      if (usage.recCount > 0) usageParts.push(`${usage.recCount} récurrence(s)`);
      if (usage.hasBudget) usageParts.push('budget');

      return `
        <li class="category-item" data-id="${escapeHtml(cat.id)}">
          <input type="color" class="category-color-input" value="${escapeHtml(cat.color)}" aria-label="Couleur de la catégorie ${escapeHtml(cat.label)}" title="Changer la couleur">
          <input type="text" class="category-name-input" value="${escapeHtml(cat.label)}" maxlength="40" aria-label="Nom de la catégorie" title="Cliquez pour renommer">
          <span class="category-usage">${usageParts.join(' · ')}</span>
          ${isProtected
            ? '<span class="category-protected-tag" title="Catégorie de repli : elle reçoit les opérations des catégories supprimées">Par défaut</span>'
            : `<button type="button" class="btn-danger-icon delete-category-btn" data-id="${escapeHtml(cat.id)}" title="Supprimer la catégorie" aria-label="Supprimer la catégorie ${escapeHtml(cat.label)}">
                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>`}
        </li>
      `;
    }).join('');

    if (dom.newCategoryColor) dom.newCategoryColor.value = pickCategoryColor(type, list.length);
  }

  function openCategoriesModal(type) {
    if (!dom.categoriesModal) return;
    state.categoriesModalType = type === 'income' ? 'income' : 'expense';
    renderCategoriesManager();
    if (dom.newCategoryName) dom.newCategoryName.value = '';
    dom.categoriesModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    if (dom.newCategoryName) dom.newCategoryName.focus();
  }

  function closeCategoriesModal() {
    if (dom.categoriesModal) {
      dom.categoriesModal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  function isCategoryLabelTaken(type, label, exceptId) {
    const lower = label.toLowerCase();
    return getCategoryList(type).some(c => c.id !== exceptId && c.label.toLowerCase() === lower);
  }

  function addCategory(type, name, color) {
    const label = (name || '').trim().slice(0, 40);
    if (!label) {
      showToast('Veuillez saisir un nom de catégorie');
      return false;
    }
    if (isCategoryLabelTaken(type, label)) {
      showToast(`La catégorie « ${label} » existe déjà`);
      return false;
    }
    state.categories[type].push({
      id: 'cat-' + generateId(),
      label,
      color: isValidHexColor(color) ? color.toLowerCase() : pickCategoryColor(type, state.categories[type].length)
    });
    saveCategoriesToStorage();
    renderCategoriesManager();
    refreshCategorySelects();
    showToast(`Catégorie « ${label} » ajoutée`);
    return true;
  }

  /**
   * Renomme une catégorie et répercute le changement sur l'historique,
   * les récurrences et les plafonds budgétaires.
   */
  function renameCategory(type, id, newName) {
    const cat = getCategoryList(type).find(c => c.id === id);
    if (!cat) return false;
    const label = (newName || '').trim().slice(0, 40);
    if (label === cat.label) return true;
    if (!label) {
      showToast('Le nom de la catégorie ne peut pas être vide');
      return false;
    }
    if (isCategoryLabelTaken(type, label, id)) {
      showToast(`La catégorie « ${label} » existe déjà`);
      return false;
    }

    const oldLabel = cat.label;
    cat.label = label;
    let txCount = 0;
    state.transactions.forEach(t => {
      if (t.type === type && t.category === oldLabel) {
        t.category = label;
        txCount++;
      }
    });
    state.recurring.forEach(r => {
      if (r.type === type && r.category === oldLabel) r.category = label;
    });
    if (type === 'expense' && state.budgets[oldLabel] !== undefined) {
      state.budgets[label] = state.budgets[oldLabel];
      delete state.budgets[oldLabel];
    }

    saveCategoriesToStorage();
    saveTransactionsToStorage();
    saveRecurringToStorage();
    saveBudgetsToStorage();
    refreshCategorySelects();
    updateUI();
    showToast(`Catégorie renommée en « ${label} »${txCount ? ` (${txCount} opération(s) mise(s) à jour)` : ''}`);
    return true;
  }

  function setCategoryColor(type, id, color) {
    const cat = getCategoryList(type).find(c => c.id === id);
    if (!cat || !isValidHexColor(color)) return;
    cat.color = color.toLowerCase();
    saveCategoriesToStorage();
    renderStats();
  }

  function deleteCategory(type, id) {
    const cat = getCategoryList(type).find(c => c.id === id);
    if (!cat || cat.id === PROTECTED_CATEGORY_IDS[type]) return;

    const usage = getCategoryUsage(type, cat.label);
    const fallback = getFallbackCategoryLabel(type);
    let message = `Supprimer la catégorie « ${cat.label} » ?`;
    if (usage.txCount || usage.recCount) {
      message += `\n\n${usage.txCount} opération(s) et ${usage.recCount} récurrence(s) seront déplacées vers « ${fallback} ».`;
    }
    if (usage.hasBudget) {
      message += '\nLe plafond budgétaire associé sera supprimé.';
    }
    if (!window.confirm(message)) return;

    state.transactions.forEach(t => {
      if (t.type === type && t.category === cat.label) t.category = fallback;
    });
    state.recurring.forEach(r => {
      if (r.type === type && r.category === cat.label) r.category = fallback;
    });
    if (usage.hasBudget) delete state.budgets[cat.label];
    state.categories[type] = state.categories[type].filter(c => c.id !== id);

    saveCategoriesToStorage();
    saveTransactionsToStorage();
    saveRecurringToStorage();
    saveBudgetsToStorage();
    renderCategoriesManager();
    refreshCategorySelects();
    updateUI();
    showToast(`Catégorie « ${cat.label} » supprimée`);
  }

  function populateAllCategorySelects() {
    populateCategorySelect(dom.txCategorySelect, dom.typeExpenseRadio.checked ? 'expense' : 'income');
    populateCategorySelect(dom.editTxCategorySelect, 'expense');
    populateCategorySelect(dom.recCategorySelect, 'expense');
  }

  function handleMainTypeChange(selectedType) {
    if (selectedType === 'income') {
      if (dom.labelTypeIncome) dom.labelTypeIncome.classList.add('active');
      if (dom.labelTypeExpense) dom.labelTypeExpense.classList.remove('active');
      if (dom.labelTypeTransfer) dom.labelTypeTransfer.classList.remove('active');
      if (dom.typeIncomeRadio) dom.typeIncomeRadio.checked = true;
      if (dom.txTargetAccountGroup) dom.txTargetAccountGroup.classList.add('hidden');
      if (dom.txCategoryGroup) dom.txCategoryGroup.classList.remove('hidden');
      if (dom.labelTxAccount) dom.labelTxAccount.innerHTML = 'Compte / Portefeuille <span class="required">*</span>';
      populateCategorySelect(dom.txCategorySelect, 'income');
    } else if (selectedType === 'transfer') {
      if (dom.labelTypeTransfer) dom.labelTypeTransfer.classList.add('active');
      if (dom.labelTypeExpense) dom.labelTypeExpense.classList.remove('active');
      if (dom.labelTypeIncome) dom.labelTypeIncome.classList.remove('active');
      if (dom.typeTransferRadio) dom.typeTransferRadio.checked = true;
      if (dom.txTargetAccountGroup) dom.txTargetAccountGroup.classList.remove('hidden');
      if (dom.txCategoryGroup) dom.txCategoryGroup.classList.add('hidden');
      if (dom.labelTxAccount) dom.labelTxAccount.innerHTML = 'Compte débité (Source) <span class="required">*</span>';
    } else {
      if (dom.labelTypeExpense) dom.labelTypeExpense.classList.add('active');
      if (dom.labelTypeIncome) dom.labelTypeIncome.classList.remove('active');
      if (dom.labelTypeTransfer) dom.labelTypeTransfer.classList.remove('active');
      if (dom.typeExpenseRadio) dom.typeExpenseRadio.checked = true;
      if (dom.txTargetAccountGroup) dom.txTargetAccountGroup.classList.add('hidden');
      if (dom.txCategoryGroup) dom.txCategoryGroup.classList.remove('hidden');
      if (dom.labelTxAccount) dom.labelTxAccount.innerHTML = 'Compte / Portefeuille <span class="required">*</span>';
      populateCategorySelect(dom.txCategorySelect, 'expense');
    }
  }

  function handleEditTypeChange(selectedType) {
    if (selectedType === 'income') {
      if (dom.labelEditTypeIncome) dom.labelEditTypeIncome.classList.add('active');
      if (dom.labelEditTypeExpense) dom.labelEditTypeExpense.classList.remove('active');
      if (dom.labelEditTypeTransfer) dom.labelEditTypeTransfer.classList.remove('active');
      if (dom.editTypeIncomeRadio) dom.editTypeIncomeRadio.checked = true;
      if (dom.editTxTargetAccountGroup) dom.editTxTargetAccountGroup.classList.add('hidden');
      if (dom.editTxCategoryGroup) dom.editTxCategoryGroup.classList.remove('hidden');
      if (dom.labelEditTxAccount) dom.labelEditTxAccount.innerHTML = 'Compte / Portefeuille <span class="required">*</span>';
      populateCategorySelect(dom.editTxCategorySelect, 'income');
    } else if (selectedType === 'transfer') {
      if (dom.labelEditTypeTransfer) dom.labelEditTypeTransfer.classList.add('active');
      if (dom.labelEditTypeExpense) dom.labelEditTypeExpense.classList.remove('active');
      if (dom.labelEditTypeIncome) dom.labelEditTypeIncome.classList.remove('active');
      if (dom.editTypeTransferRadio) dom.editTypeTransferRadio.checked = true;
      if (dom.editTxTargetAccountGroup) dom.editTxTargetAccountGroup.classList.remove('hidden');
      if (dom.editTxCategoryGroup) dom.editTxCategoryGroup.classList.add('hidden');
      if (dom.labelEditTxAccount) dom.labelEditTxAccount.innerHTML = 'Compte débité (Source) <span class="required">*</span>';
    } else {
      if (dom.labelEditTypeExpense) dom.labelEditTypeExpense.classList.add('active');
      if (dom.labelEditTypeIncome) dom.labelEditTypeIncome.classList.remove('active');
      if (dom.labelEditTypeTransfer) dom.labelEditTypeTransfer.classList.remove('active');
      if (dom.editTypeExpenseRadio) dom.editTypeExpenseRadio.checked = true;
      if (dom.editTxTargetAccountGroup) dom.editTxTargetAccountGroup.classList.add('hidden');
      if (dom.editTxCategoryGroup) dom.editTxCategoryGroup.classList.remove('hidden');
      if (dom.labelEditTxAccount) dom.labelEditTxAccount.innerHTML = 'Compte / Portefeuille <span class="required">*</span>';
      populateCategorySelect(dom.editTxCategorySelect, 'expense');
    }
  }

  function handleRecTypeChange(selectedType) {
    if (selectedType === 'income') {
      if (dom.labelRecTypeIncome) dom.labelRecTypeIncome.classList.add('active');
      if (dom.labelRecTypeExpense) dom.labelRecTypeExpense.classList.remove('active');
      if (dom.recTypeIncome) dom.recTypeIncome.checked = true;
    } else {
      if (dom.labelRecTypeExpense) dom.labelRecTypeExpense.classList.add('active');
      if (dom.labelRecTypeIncome) dom.labelRecTypeIncome.classList.remove('active');
      if (dom.recTypeExpense) dom.recTypeExpense.checked = true;
    }
    populateCategorySelect(dom.recCategorySelect, selectedType);
  }

  // ==========================================================================
  // 12. Module Budgets Mensuels
  // ==========================================================================

  function getMonthlyExpenseByCategory() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const currentMonthExpenses = state.transactions.filter(t => {
      if (t.type !== 'expense' || !t.date) return false;
      if (state.filterAccount !== 'all' && t.accountId !== state.filterAccount) return false;
      const parts = parseDateParts(t.date);
      return parts.year === currentYear && parts.month === currentMonth;
    });

    const expenseMap = {};
    currentMonthExpenses.forEach(t => {
      expenseMap[t.category] = (expenseMap[t.category] || 0) + t.amount;
    });
    return expenseMap;
  }

  function renderBudgets() {
    if (!dom.budgetsGrid) return;

    const budgetEntries = Object.entries(state.budgets);
    if (budgetEntries.length === 0) {
      if (dom.emptyBudgets) dom.emptyBudgets.classList.remove('hidden');
      dom.budgetsGrid.innerHTML = '';
      if (dom.budgetTotalAllocated) dom.budgetTotalAllocated.textContent = formatCurrency(0);
      if (dom.budgetTotalSpent) dom.budgetTotalSpent.textContent = formatCurrency(0);
      if (dom.budgetTotalRemaining) dom.budgetTotalRemaining.textContent = formatCurrency(0);
      return;
    }

    if (dom.emptyBudgets) dom.emptyBudgets.classList.add('hidden');

    const spentMap = getMonthlyExpenseByCategory();
    let totalAllocated = 0;
    let totalSpent = 0;

    // Jours restants dans le mois (aujourd'hui inclus) pour le reste quotidien
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - today.getDate() + 1;

    const cardsHtml = budgetEntries.map(([category, limit]) => {
      const spent = spentMap[category] || 0;
      totalAllocated += limit;
      totalSpent += spent;

      const percentage = Math.min(100, Math.round((spent / limit) * 100));
      const remaining = limit - spent;

      let statusClass = 'status-ok';
      let pillClass = 'pill-ok';
      let fillClass = 'fill-ok';
      let statusText = 'Normal';

      if (spent > limit) {
        statusClass = 'status-danger';
        pillClass = 'pill-danger';
        fillClass = 'fill-danger';
        statusText = 'Dépassement !';
      } else if (percentage >= 80) {
        statusClass = 'status-warning';
        pillClass = 'pill-warning';
        fillClass = 'fill-warning';
        statusText = 'Attention (≥80%)';
      }

      return `
        <div class="budget-card ${statusClass}">
          <div class="budget-card-header">
            <span class="budget-category-title">${escapeHtml(category)}</span>
            <span class="budget-status-pill ${pillClass}">${statusText}</span>
          </div>
          <div class="budget-amounts-row">
            <span class="budget-spent-txt">${formatCurrency(spent)}</span>
            <span class="budget-limit-txt">Plafond : ${formatCurrency(limit)}</span>
          </div>
          <div class="budget-progress-track">
            <div class="budget-progress-fill ${fillClass}" style="width: ${percentage}%;"></div>
          </div>
          <div class="budget-card-footer">
            <span>${remaining >= 0
              ? `Reste : <strong>${formatCurrency(remaining)}</strong> <span class="budget-daily-hint">≈ ${formatCurrency(remaining / daysLeft)} / jour</span>`
              : `Excès : <strong style="color:var(--expense-color);">${formatCurrency(Math.abs(remaining))}</strong>`}</span>
            <div class="budget-actions">
              <button type="button" class="btn-edit-icon edit-budget-btn" data-category="${escapeHtml(category)}" title="Modifier le plafond" aria-label="Modifier le plafond">
                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                </svg>
              </button>
              <button type="button" class="btn-danger-icon delete-budget-btn" data-category="${escapeHtml(category)}" title="Supprimer le budget" aria-label="Supprimer le budget">
                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    dom.budgetsGrid.innerHTML = cardsHtml;

    const remainingTotal = totalAllocated - totalSpent;
    if (dom.budgetTotalAllocated) dom.budgetTotalAllocated.textContent = formatCurrency(totalAllocated);
    if (dom.budgetTotalSpent) dom.budgetTotalSpent.textContent = formatCurrency(totalSpent);
    if (dom.budgetTotalRemaining) {
      dom.budgetTotalRemaining.textContent = formatCurrency(remainingTotal);
      dom.budgetTotalRemaining.className = `summary-val ${remainingTotal >= 0 ? 'income-text' : 'expense-text'}`;
    }
  }

  function openBudgetModal(categoryToEdit = null) {
    if (!dom.budgetModal) return;

    if (!categoryToEdit && getCategoryList('expense').every(cat => state.budgets[cat.label] !== undefined)) {
      showToast('Toutes les catégories de dépenses ont déjà un plafond. Modifiez un plafond existant.');
      return;
    }

    dom.budgetCategorySelect.innerHTML = getCategoryList('expense').map(cat => {
      const isExisting = !categoryToEdit && state.budgets[cat.label] !== undefined;
      return `<option value="${escapeHtml(cat.label)}" ${isExisting ? 'disabled' : ''}>${escapeHtml(cat.label)} ${isExisting ? '(Déjà configuré)' : ''}</option>`;
    }).join('');

    if (categoryToEdit && state.budgets[categoryToEdit] !== undefined) {
      dom.budgetModalTitle.textContent = 'Modifier le plafond budgétaire';
      dom.budgetOriginalCategory.value = categoryToEdit;
      dom.budgetCategorySelect.value = categoryToEdit;
      dom.budgetCategorySelect.disabled = true;
      dom.budgetLimitInput.value = state.budgets[categoryToEdit];
    } else {
      dom.budgetModalTitle.textContent = 'Définir un plafond budgétaire';
      dom.budgetOriginalCategory.value = '';
      dom.budgetCategorySelect.disabled = false;
      const firstAvailable = getCategoryList('expense').find(cat => state.budgets[cat.label] === undefined);
      if (firstAvailable) {
        dom.budgetCategorySelect.value = firstAvailable.label;
      }
      dom.budgetLimitInput.value = '';
    }

    dom.budgetModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    dom.budgetLimitInput.focus();
  }

  function closeBudgetModal() {
    if (dom.budgetModal) {
      dom.budgetModal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  function saveBudget(category, limit) {
    if (!category) {
      showToast('Veuillez sélectionner une catégorie');
      return;
    }
    if (isNaN(limit) || limit <= 0) {
      showToast('Veuillez spécifier un plafond supérieur à 0 €');
      return;
    }

    state.budgets[category] = Math.round(limit * 100) / 100;
    saveBudgetsToStorage();
    closeBudgetModal();
    renderBudgets();
    showToast(`Plafond pour « ${category} » enregistré (${formatCurrency(limit)})`);
  }

  function deleteBudget(category) {
    if (state.budgets[category] === undefined) return;
    const confirmDel = window.confirm(`Supprimer le plafond budgétaire pour « ${category} » ?`);
    if (!confirmDel) return;

    delete state.budgets[category];
    saveBudgetsToStorage();
    renderBudgets();
    showToast(`Plafond pour « ${category} » supprimé`);
  }

  // ==========================================================================
  // 13. Calculs financiers & Soldes
  // ==========================================================================

  function computeBalanceSummary() {
    let initial = 0;
    if (state.filterAccount === 'all') {
      initial = state.accounts.reduce((sum, a) => sum + (Number(a.initialBalance) || 0), 0);
    } else {
      const acc = getAccountById(state.filterAccount);
      initial = acc ? (Number(acc.initialBalance) || 0) : 0;
    }

    let totalIncome = 0;
    let incomeCount = 0;
    let totalExpense = 0;
    let expenseCount = 0;
    let transfersIn = 0;
    let transfersOut = 0;

    state.transactions.forEach(tx => {
      if (state.filterAccount === 'all') {
        if (tx.type === 'income') {
          totalIncome += tx.amount;
          incomeCount++;
        } else if (tx.type === 'expense') {
          totalExpense += tx.amount;
          expenseCount++;
        }
      } else {
        if (tx.type === 'income' && tx.accountId === state.filterAccount) {
          totalIncome += tx.amount;
          incomeCount++;
        } else if (tx.type === 'expense' && tx.accountId === state.filterAccount) {
          totalExpense += tx.amount;
          expenseCount++;
        } else if (tx.type === 'transfer') {
          if (tx.toAccountId === state.filterAccount) {
            transfersIn += tx.amount;
          }
          if (tx.accountId === state.filterAccount) {
            transfersOut += tx.amount;
          }
        }
      }
    });

    const currentBalance = initial + totalIncome - totalExpense + transfersIn - transfersOut;

    return {
      initialBalance: initial,
      totalIncome,
      incomeCount,
      totalExpense,
      expenseCount,
      currentBalance
    };
  }

  function renderBalanceSection() {
    const summary = computeBalanceSummary();

    if (dom.currentBalanceDisplay) {
      dom.currentBalanceDisplay.textContent = formatCurrency(summary.currentBalance);
      dom.currentBalanceDisplay.className = 'balance-amount ' +
        (summary.currentBalance > 0 ? 'positive' : summary.currentBalance < 0 ? 'negative' : 'neutral');
    }

    if (dom.balanceSubtext) {
      const accText = state.filterAccount !== 'all' ? ` (Compte : ${getAccountName(state.filterAccount)})` : ' (Total de tous les comptes)';
      dom.balanceSubtext.textContent = `Solde initial cumulé : ${formatCurrency(summary.initialBalance)}${accText}`;
    }

    if (dom.quickIncomeDisplay) dom.quickIncomeDisplay.textContent = `+${formatCurrency(summary.totalIncome)}`;
    if (dom.quickIncomeCount) dom.quickIncomeCount.textContent = `${summary.incomeCount} opération(s)`;
    if (dom.quickExpenseDisplay) dom.quickExpenseDisplay.textContent = `-${formatCurrency(summary.totalExpense)}`;
    if (dom.quickExpenseCount) dom.quickExpenseCount.textContent = `${summary.expenseCount} opération(s)`;
  }

  // ==========================================================================
  // 14. Tableau & Filtrage des Transactions
  // ==========================================================================

  function getFilteredTransactions() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return state.transactions.filter(tx => {
      // Filtre Compte
      if (state.filterAccount !== 'all') {
        if (tx.type === 'transfer') {
          if (tx.accountId !== state.filterAccount && tx.toAccountId !== state.filterAccount) return false;
        } else if (tx.accountId !== state.filterAccount) {
          return false;
        }
      }

      // Filtre Type
      if (state.filterType !== 'all' && tx.type !== state.filterType) {
        return false;
      }

      // Filtre Période
      if (state.filterPeriod !== 'all' && tx.date) {
        const parts = parseDateParts(tx.date);
        const txYear = parts.year;
        const txMonth = parts.month;

        if (state.filterPeriod === 'this-month') {
          if (txYear !== currentYear || txMonth !== currentMonth) return false;
        } else if (state.filterPeriod === 'last-month') {
          const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          if (txYear !== prevYear || txMonth !== prevMonth) return false;
        } else if (state.filterPeriod === 'this-year') {
          if (txYear !== currentYear) return false;
        }
      }

      // Filtre Recherche
      if (state.searchQuery) {
        const query = state.searchQuery.trim().toLowerCase();
        const descMatch = (tx.description || '').toLowerCase().includes(query);
        const catMatch = (tx.category || '').toLowerCase().includes(query);
        const amountStr = String(tx.amount);
        const amountFr = tx.amount.toFixed(2).replace('.', ',');
        const amountMatch = amountStr.includes(query) || amountFr.includes(query) || amountStr.includes(query.replace(',', '.'));
        const accNameMatch = getAccountName(tx.accountId).toLowerCase().includes(query);
        const targetAccMatch = tx.toAccountId ? getAccountName(tx.toAccountId).toLowerCase().includes(query) : false;
        if (!descMatch && !catMatch && !amountMatch && !accNameMatch && !targetAccMatch) return false;
      }

      return true;
    });
  }

  /**
   * Numéros de pages à afficher : première, dernière, page courante ± 1, avec « … »
   */
  function getPageNumbers(current, total) {
    const pages = new Set([1, total, current - 1, current, current + 1]);
    if (current <= 3) [2, 3, 4].forEach(p => pages.add(p));
    if (current >= total - 2) [total - 3, total - 2, total - 1].forEach(p => pages.add(p));
    const sorted = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
    const result = [];
    sorted.forEach((p, i) => {
      if (i > 0 && p - sorted[i - 1] > 1) result.push('…');
      result.push(p);
    });
    return result;
  }

  function renderPagination(totalItems, currentPage, totalPages) {
    if (!dom.transactionsPagination) return;
    if (totalItems === 0) {
      dom.transactionsPagination.innerHTML = '';
      dom.transactionsPagination.classList.add('hidden');
      return;
    }
    dom.transactionsPagination.classList.remove('hidden');

    const pageSize = state.settings.pageSize;
    const first = (currentPage - 1) * pageSize + 1;
    const last = Math.min(totalItems, currentPage * pageSize);

    const navHtml = totalPages > 1 ? `
      <nav class="pagination-nav" aria-label="Pagination des transactions">
        <button type="button" class="pagination-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''} aria-label="Page précédente">‹</button>
        ${getPageNumbers(currentPage, totalPages).map(p => p === '…'
          ? '<span class="pagination-ellipsis" aria-hidden="true">…</span>'
          : `<button type="button" class="pagination-btn ${p === currentPage ? 'active' : ''}" data-page="${p}" ${p === currentPage ? 'aria-current="page"' : ''} aria-label="Page ${p}">${p}</button>`
        ).join('')}
        <button type="button" class="pagination-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Page suivante">›</button>
      </nav>
    ` : '';

    dom.transactionsPagination.innerHTML = `
      <span class="pagination-info">${first}–${last} sur ${totalItems} transaction(s)</span>
      ${navHtml}
      <label class="pagination-size">
        <span>Afficher</span>
        <select class="select-sm pagination-size-select" aria-label="Nombre de transactions par page">
          ${PAGE_SIZE_OPTIONS.map(n => `<option value="${n}" ${n === pageSize ? 'selected' : ''}>${n}</option>`).join('')}
        </select>
        <span>par page</span>
      </label>
    `;
  }

  function goToTransactionsPage(page) {
    state.currentPage = page;
    renderTransactionsTable();
    // Remonte en haut du tableau si celui-ci est sorti de l'écran
    if (dom.transactionsTable) {
      const rect = dom.transactionsTable.getBoundingClientRect();
      if (rect.top < 0) {
        const section = document.getElementById('transactions');
        if (section) section.scrollIntoView({ block: 'start' });
      }
    }
  }

  function renderTransactionsTable() {
    const filtered = getFilteredTransactions();

    if (!dom.transactionsTableBody) return;

    if (filtered.length === 0) {
      dom.transactionsTableBody.innerHTML = '';
      if (dom.emptyState) dom.emptyState.classList.remove('hidden');
      renderPagination(0, 1, 1);
      return;
    }

    if (dom.emptyState) dom.emptyState.classList.add('hidden');

    // Tri chronologique : plus récentes d'abord
    filtered.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || 0) - (a.createdAt || 0));

    // Pagination
    const pageSize = state.settings.pageSize;
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    state.currentPage = Math.min(Math.max(1, state.currentPage), totalPages);
    const startIndex = (state.currentPage - 1) * pageSize;
    const pageItems = filtered.slice(startIndex, startIndex + pageSize);
    renderPagination(filtered.length, state.currentPage, totalPages);

    dom.transactionsTableBody.innerHTML = pageItems.map(tx => {
      let badgeClass = 'badge-expense';
      let typeLabel = 'Dépense';
      let amountPrefix = '-';
      let amountClass = 'expense';
      let accountHtml = `<span class="account-pill">${escapeHtml(getAccountName(tx.accountId))}</span>`;

      if (tx.type === 'income') {
        badgeClass = 'badge-income';
        typeLabel = 'Revenu';
        amountPrefix = '+';
        amountClass = 'income';
      } else if (tx.type === 'transfer') {
        badgeClass = 'badge-transfer';
        typeLabel = 'Virement';
        const sourceName = getAccountName(tx.accountId);
        const targetName = getAccountName(tx.toAccountId);
        accountHtml = `<span class="account-transfer-flow"><span class="account-pill">${escapeHtml(sourceName)}</span> <span class="account-transfer-arrow">➔</span> <span class="account-pill">${escapeHtml(targetName)}</span></span>`;

        if (state.filterAccount !== 'all') {
          if (tx.toAccountId === state.filterAccount) {
            amountPrefix = '+';
            amountClass = 'income';
          } else {
            amountPrefix = '-';
            amountClass = 'expense';
          }
        } else {
          amountPrefix = '⇄ ';
          amountClass = 'transfer';
        }
      }

      return `
        <tr data-id="${escapeHtml(tx.id)}">
          <td><span class="badge ${badgeClass}">${typeLabel}</span></td>
          <td class="cell-amount ${amountClass}">${amountPrefix}${formatCurrency(tx.amount)}</td>
          <td>${accountHtml}</td>
          <td class="cell-category">${escapeHtml(tx.category || (tx.type === 'transfer' ? 'Virement interne' : ''))}</td>
          <td class="cell-desc" title="${escapeHtml(tx.description || '')}">${tx.recurringId ? '<span class="tx-tag" title="Générée par une opération récurrente" aria-label="Récurrente">↻</span>' : ''}${tx.goalId ? '<span class="tx-tag" title="Versement / retrait d\'un objectif d\'épargne" aria-label="Épargne">◎</span>' : ''}${escapeHtml(tx.description || '—')}</td>
          <td class="cell-date">${formatDateFr(tx.date)}</td>
          <td class="text-right">
            <div class="table-actions">
              <button type="button" class="btn-edit-icon edit-tx-btn" data-id="${escapeHtml(tx.id)}" title="Modifier la transaction" aria-label="Modifier la transaction">
                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                </svg>
              </button>
              <button type="button" class="btn-danger-icon delete-tx-btn" data-id="${escapeHtml(tx.id)}" title="Supprimer la transaction" aria-label="Supprimer la transaction">
                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ==========================================================================
  // 15. Statistiques & Graphiques SVG (Donut Charts)
  // ==========================================================================

  function renderStats() {
    const filtered = getFilteredTransactions();

    let incomeTotal = 0;
    let incomeCount = 0;
    let expenseTotal = 0;
    let expenseCount = 0;

    const expenseByCategory = {};
    const incomeByCategory = {};

    filtered.forEach(tx => {
      if (tx.type === 'income') {
        incomeTotal += tx.amount;
        incomeCount++;
        incomeByCategory[tx.category] = (incomeByCategory[tx.category] || 0) + tx.amount;
      } else if (tx.type === 'expense') {
        expenseTotal += tx.amount;
        expenseCount++;
        expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + tx.amount;
      }
    });

    const avgExpense = expenseCount > 0 ? expenseTotal / expenseCount : 0;
    const netFlow = incomeTotal - expenseTotal;
    const savingsRate = incomeTotal > 0 ? Math.max(0, ((incomeTotal - expenseTotal) / incomeTotal) * 100) : 0;

    if (dom.statTotalIncome) dom.statTotalIncome.textContent = formatCurrency(incomeTotal);
    if (dom.statIncomeCount) dom.statIncomeCount.textContent = `${incomeCount} transaction(s)`;
    if (dom.statTotalExpense) dom.statTotalExpense.textContent = formatCurrency(expenseTotal);
    if (dom.statExpenseCount) dom.statExpenseCount.textContent = `${expenseCount} transaction(s)`;
    if (dom.statAverageExpense) dom.statAverageExpense.textContent = formatCurrency(avgExpense);
    if (dom.statNetFlow) dom.statNetFlow.textContent = formatCurrency(netFlow);
    if (dom.statSavingsRate) dom.statSavingsRate.textContent = `Taux d'épargne : ${savingsRate.toFixed(1)}%`;

    renderDonutChart(dom.expenseDonutContainer, expenseByCategory, expenseTotal, 'expense', 'Dépenses');
    renderDonutChart(dom.incomeDonutContainer, incomeByCategory, incomeTotal, 'income', 'Revenus');

    renderCategoryBreakdown(dom.expenseCategoryBreakdown, expenseByCategory, expenseTotal, 'expense');
    renderCategoryBreakdown(dom.incomeCategoryBreakdown, incomeByCategory, incomeTotal, 'income');
  }

  function renderDonutChart(container, categoryData, total, type, title) {
    if (!container) return;

    const entries = Object.entries(categoryData).sort((a, b) => b[1] - a[1]);
    const colors = entries.map(([category], idx) => getCategoryColor(type, category, idx));

    if (entries.length === 0 || total === 0) {
      container.innerHTML = `<p class="empty-desc" style="padding: 2rem 0;">Aucune donnée de ${title.toLowerCase()} sur la période.</p>`;
      return;
    }

    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    let accumulatedAngle = 0;

    const segmentsHtml = entries.map(([category, amount], idx) => {
      const ratio = amount / total;
      const strokeDasharray = `${ratio * circumference} ${circumference}`;
      const strokeDashoffset = -accumulatedAngle * circumference;
      accumulatedAngle += ratio;
      const color = colors[idx];

      return `
        <circle class="donut-segment"
          cx="85" cy="85" r="${radius}"
          fill="transparent"
          stroke="${color}"
          stroke-width="20"
          stroke-dasharray="${strokeDasharray}"
          stroke-dashoffset="${strokeDashoffset}"
          data-category="${escapeHtml(category)}"
          data-amount="${amount}">
          <title>${escapeHtml(category)}: ${formatCurrency(amount)} (${(ratio * 100).toFixed(1)}%)</title>
        </circle>
      `;
    }).join('');

    container.innerHTML = `
      <div class="donut-svg-wrapper">
        <svg class="donut-svg" viewBox="0 0 170 170" role="img" aria-label="Graphique ${escapeHtml(title)} : total ${formatCurrency(total)}">
          <circle cx="85" cy="85" r="${radius}" fill="transparent" stroke="var(--bg-hover)" stroke-width="20"></circle>
          ${segmentsHtml}
        </svg>
        <div class="donut-center-text" aria-hidden="true">
          <div class="donut-center-total">${formatCurrency(total)}</div>
          <div class="donut-center-label">${escapeHtml(title)}</div>
        </div>
      </div>
      <div class="donut-legend">
        ${entries.map(([category, amount], idx) => `
          <div class="donut-legend-item">
            <span class="donut-legend-color" style="background-color: ${colors[idx]}"></span>
            <span>${escapeHtml(category)}</span>
            <span class="donut-legend-value">${((amount / total) * 100).toFixed(0)}%</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderCategoryBreakdown(container, categoryData, total, type) {
    if (!container) return;
    const entries = Object.entries(categoryData).sort((a, b) => b[1] - a[1]);

    if (entries.length === 0 || total === 0) {
      container.innerHTML = `<p class="category-empty-note">Aucune donnée sur la période sélectionnée.</p>`;
      return;
    }

    container.innerHTML = entries.map(([category, amount], idx) => {
      const ratio = (amount / total) * 100;
      const color = getCategoryColor(type, category, idx);

      return `
        <div class="category-bar-item">
          <div class="category-bar-header">
            <span class="category-bar-name">${escapeHtml(category)}</span>
            <span class="category-bar-val">${formatCurrency(amount)} (${ratio.toFixed(1)}%)</span>
          </div>
          <div class="category-bar-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(ratio)}" aria-label="${escapeHtml(category)}">
            <div class="category-bar-fill" style="width: ${ratio.toFixed(2)}%; background-color: ${color};"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ==========================================================================
  // 16. Modale d'Édition de Transaction
  // ==========================================================================

  function openEditModal(id) {
    const tx = state.transactions.find(t => t.id === id);
    if (!tx || !dom.editModal) return;

    dom.editTxId.value = tx.id;
    dom.editTxAmountInput.value = tx.amount;
    dom.editTxDateInput.value = tx.date;
    dom.editTxDescriptionInput.value = tx.description || '';

    populateAccountSelect(dom.editTxAccountSelect, tx.accountId || state.accounts[0]?.id || 'courant');
    const defaultTarget = tx.toAccountId || state.accounts.find(a => a.id !== tx.accountId)?.id || state.accounts[0]?.id || 'courant';
    populateAccountSelect(dom.editTxTargetAccountSelect, defaultTarget);

    if (tx.type === 'income') {
      handleEditTypeChange('income');
      setSelectValue(dom.editTxCategorySelect, tx.category);
    } else if (tx.type === 'transfer') {
      handleEditTypeChange('transfer');
      if (dom.editTxTargetAccountSelect) dom.editTxTargetAccountSelect.value = tx.toAccountId || defaultTarget;
    } else {
      handleEditTypeChange('expense');
      setSelectValue(dom.editTxCategorySelect, tx.category);
    }

    dom.editModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    dom.editTxAmountInput.focus();
  }

  function closeEditModal() {
    if (dom.editModal) {
      dom.editModal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  function closeAllModals() {
    closeAccountModal();
    closeGoalModal();
    closeGoalTransferModal();
    closeRecurringModal();
    closeBudgetModal();
    closeEditModal();
    closeChangelogModal();
    closeCategoriesModal();
  }

  // ==========================================================================
  // 17. Notifications Toast (avec support Undo)
  // ==========================================================================

  function showToast(message, actionLabel = null, onAction = null) {
    if (!dom.toast) return;

    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
      toastTimeoutId = null;
    }

    dom.toastMessage.textContent = message;

    if (actionLabel && typeof onAction === 'function') {
      dom.toastActionBtn.textContent = actionLabel;
      dom.toastActionBtn.classList.remove('hidden');
      dom.toastActionBtn.onclick = () => {
        onAction();
        hideToast();
      };
    } else {
      dom.toastActionBtn.classList.add('hidden');
      dom.toastActionBtn.onclick = null;
    }

    dom.toast.classList.remove('hidden');
    toastTimeoutId = setTimeout(() => {
      hideToast();
    }, 4500);
  }

  function hideToast() {
    if (dom.toast) {
      dom.toast.classList.add('hidden');
    }
    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
      toastTimeoutId = null;
    }
  }

  // ==========================================================================
  // 18. Actualisation globale de l'interface
  // ==========================================================================

  function updateUI() {
    renderAccounts();
    renderBalanceSection();
    renderForecast();
    renderTransactionsTable();
    renderBudgets();
    renderGoals();
    renderRecurring();
    renderStats();
  }

  // ==========================================================================
  // 19. Export & Import de Données (JSON & CSV)
  // ==========================================================================

  function exportDataAsJSON() {
    const dataToExport = {
      app: 'Budget Manager',
      version: APP_VERSION,
      exportDate: new Date().toISOString(),
      initialBalance: state.initialBalance,
      accounts: state.accounts,
      budgets: state.budgets,
      goals: state.goals,
      recurring: state.recurring,
      categories: state.categories,
      transactions: state.transactions
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget_manager_export_${getTodayDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    state.settings.lastExportAt = Date.now();
    state.settings.backupSnoozeUntil = null;
    saveSettingsToStorage();
    renderBackupReminder();
    showToast('Export JSON généré avec succès — sauvegarde enregistrée');
  }

  // ==========================================================================
  // 19 bis. Rappel de sauvegarde
  // ==========================================================================

  function renderBackupReminder() {
    const now = Date.now();
    const { lastExportAt, firstUseAt, backupSnoozeUntil } = state.settings;

    if (dom.lastBackupInfo) {
      dom.lastBackupInfo.textContent = lastExportAt
        ? `Dernière sauvegarde JSON : ${new Date(lastExportAt).toLocaleDateString('fr-FR')}`
        : 'Aucune sauvegarde JSON effectuée pour le moment';
    }

    if (!dom.backupReminder) return;
    const reference = lastExportAt || firstUseAt || now;
    const days = Math.floor((now - reference) / DAY_MS);
    const snoozed = backupSnoozeUntil && now < backupSnoozeUntil;
    const hasData = state.transactions.length > 0;
    const show = hasData && days >= BACKUP_REMINDER_DAYS && !snoozed;

    dom.backupReminder.classList.toggle('hidden', !show);
    if (show && dom.backupReminderText) {
      dom.backupReminderText.textContent = (lastExportAt
        ? `Votre dernière sauvegarde date de ${days} jours.`
        : `Aucune sauvegarde depuis ${days} jours.`)
        + ' Vos données sont stockées uniquement dans ce navigateur : un nettoyage du cache peut les effacer.';
    }
  }

  function snoozeBackupReminder() {
    state.settings.backupSnoozeUntil = Date.now() + BACKUP_SNOOZE_DAYS * DAY_MS;
    saveSettingsToStorage();
    renderBackupReminder();
    showToast(`Rappel reporté de ${BACKUP_SNOOZE_DAYS} jours`);
  }

  function exportDataAsCSV() {
    if (state.transactions.length === 0) {
      showToast('Aucune transaction à exporter');
      return;
    }

    const headers = ['ID', 'Type', 'Montant', 'Compte', 'Compte_Destination', 'Categorie', 'Description', 'Date'];
    // Séparateur ";" + virgule décimale : ouverture directe dans Excel / LibreOffice en français
    const rows = state.transactions.map(tx => [
      csvCell(tx.id),
      csvCell(tx.type),
      csvCell(tx.amount.toFixed(2).replace('.', ',')),
      csvCell(getAccountName(tx.accountId)),
      csvCell(tx.type === 'transfer' && tx.toAccountId ? getAccountName(tx.toAccountId) : ''),
      csvCell(tx.category || ''),
      csvCell(tx.description || ''),
      csvCell(tx.date)
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget_manager_transactions_${getTodayDateString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Export CSV généré avec succès');
  }

  function handleFileImport(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const fileName = file.name.toLowerCase();

    reader.onload = (event) => {
      try {
        const content = event.target.result;
        if (fileName.endsWith('.json')) {
          importJSONContent(content);
        } else if (fileName.endsWith('.csv')) {
          importCSVContent(content);
        } else {
          showToast('Format de fichier non pris en charge (utilisez .json ou .csv)');
        }
      } catch (err) {
        showToast('Erreur lors de l\'analyse du fichier : vérifiez qu\'il s\'agit d\'un export Budget Manager valide');
        console.error(err);
      }
      e.target.value = '';
    };

    reader.onerror = () => {
      showToast('Impossible de lire le fichier sélectionné');
      e.target.value = '';
    };

    reader.readAsText(file, 'UTF-8');
  }

  function saveAllToStorage() {
    saveInitialBalanceToStorage();
    saveAccountsToStorage();
    saveTransactionsToStorage();
    saveBudgetsToStorage();
    saveGoalsToStorage();
    saveRecurringToStorage();
    saveCategoriesToStorage();
  }

  function importJSONContent(jsonString) {
    const parsed = JSON.parse(jsonString);
    const isArray = Array.isArray(parsed);

    if (!isArray && (!parsed || typeof parsed !== 'object')) {
      showToast('Fichier JSON non reconnu');
      return;
    }

    const rawTransactions = isArray ? parsed : parsed.transactions;
    if (!Array.isArray(rawTransactions) && !Array.isArray(parsed.accounts)) {
      showToast('Aucune donnée Budget Manager trouvée dans ce fichier');
      return;
    }

    const confirmImport = window.confirm('L\'import JSON va remplacer vos données actuelles par celles du fichier. Pensez à exporter une sauvegarde avant. Continuer ?');
    if (!confirmImport) return;

    if (!isArray) {
      const importedAccounts = sanitizeAccounts(parsed.accounts);
      if (importedAccounts.length > 0) {
        state.accounts = importedAccounts;
      } else if (parsed.initialBalance !== undefined) {
        // Sauvegarde v1/v2 (un seul solde, pas de comptes) : on recrée un compte unique
        const legacyBalance = toAmount(parsed.initialBalance);
        state.accounts = [{
          id: 'courant',
          name: 'Compte Courant',
          type: 'checking',
          initialBalance: Number.isFinite(legacyBalance) ? legacyBalance : 0
        }];
      }

      if (parsed.initialBalance !== undefined) {
        const val = toAmount(parsed.initialBalance);
        state.initialBalance = Number.isFinite(val) ? val : 0;
      }
      if (parsed.budgets !== undefined) state.budgets = sanitizeBudgets(parsed.budgets);
      if (parsed.goals !== undefined) state.goals = sanitizeGoals(parsed.goals);
      if (parsed.categories !== undefined) state.categories = sanitizeCategories(parsed.categories);
    }

    const fallbackId = state.accounts[0]?.id || 'courant';
    if (Array.isArray(rawTransactions)) {
      state.transactions = sanitizeTransactions(rawTransactions, fallbackId);
    }
    if (!isArray && parsed.recurring !== undefined) {
      state.recurring = sanitizeRecurring(parsed.recurring, fallbackId);
    }

    repairAccountReferences();
    ensureCategoriesFromData();
    saveAllToStorage();
    state.currentPage = 1;
    refreshCategorySelects();
    updateUI();
    showToast(`Données importées avec succès (${state.transactions.length} transaction(s))`);
  }

  function importCSVContent(csvString) {
    const lines = csvString.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) {
      showToast('Le fichier CSV est vide');
      return;
    }

    const separator = lines[0].includes(';') ? ';' : ',';
    const newTransactions = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = splitCsvLine(lines[i], separator);
      if (parts.length >= 5) {
        const typeRaw = parts[1]?.toLowerCase();
        const type = typeRaw === 'income' ? 'income' : (typeRaw === 'transfer' ? 'transfer' : 'expense');
        const amount = toAmount(parts[2]);
        let accountName = parts[3] || '';
        let targetAccountName = '';
        let category = '';
        let description = '';
        let date = '';

        const defaultCategory = type === 'transfer' ? 'Virement interne' : getFallbackCategoryLabel(type);
        if (parts.length >= 8) {
          targetAccountName = parts[4] || '';
          category = parts[5] || defaultCategory;
          description = parts[6] || '';
          date = parts[7] || getTodayDateString();
        } else {
          category = parts[4] || defaultCategory;
          description = parts[5] || '';
          date = parts[6] || getTodayDateString();
        }

        const matchedAcc = state.accounts.find(a => a.name.toLowerCase() === accountName.toLowerCase());
        const accountId = matchedAcc ? matchedAcc.id : (state.accounts[0]?.id || 'courant');

        const matchedTargetAcc = targetAccountName ? state.accounts.find(a => a.name.toLowerCase() === targetAccountName.toLowerCase()) : null;
        const toAccountId = matchedTargetAcc ? matchedTargetAcc.id : (type === 'transfer' ? (state.accounts[1]?.id || state.accounts[0]?.id || 'courant') : undefined);

        if (!isNaN(amount) && amount > 0) {
          const item = {
            id: generateId(),
            type,
            amount,
            accountId,
            category,
            description,
            date: normalizeDateString(date) || getTodayDateString(),
            createdAt: Date.now() - i * 1000
          };
          if (type === 'transfer') {
            item.toAccountId = toAccountId;
          }
          newTransactions.push(item);
        }
      }
    }

    const cleanTransactions = sanitizeTransactions(newTransactions, state.accounts[0]?.id || 'courant');
    if (cleanTransactions.length === 0) {
      showToast('Aucune transaction valide trouvée dans le CSV');
      return;
    }

    state.transactions = [...cleanTransactions, ...state.transactions];
    repairAccountReferences();
    const newCategories = ensureCategoriesFromData();
    saveTransactionsToStorage();
    state.currentPage = 1;
    if (newCategories) refreshCategorySelects();
    updateUI();
    showToast(`${cleanTransactions.length} transaction(s) CSV ajoutée(s) avec succès`);
  }

  function resetAllData() {
    const confirmation = window.confirm('Êtes-vous sûr de vouloir supprimer toutes vos données (transactions, budgets, objectifs, récurrences, catégories personnalisées et comptes) ? Cette action est irréversible.');
    if (!confirmation) return;

    state.initialBalance = 0;
    state.transactions = [];
    state.budgets = {};
    state.goals = [];
    state.recurring = [];
    state.categories = sanitizeCategories(DEFAULT_CATEGORIES);
    state.currentPage = 1;
    // Comptes par défaut repartant de zéro (sans les montants de démonstration)
    state.accounts = deepClone(DEFAULT_ACCOUNTS).map(acc => ({ ...acc, initialBalance: 0 }));
    state.filterAccount = 'all';
    state.filterType = 'all';
    state.filterPeriod = 'all';
    state.searchQuery = '';

    if (dom.filterAccountSelect) dom.filterAccountSelect.value = 'all';
    if (dom.filterTypeSelect) dom.filterTypeSelect.value = 'all';
    if (dom.filterPeriodSelect) dom.filterPeriodSelect.value = 'all';
    if (dom.filterSearchInput) dom.filterSearchInput.value = '';

    saveAllToStorage();
    refreshCategorySelects();

    updateUI();
    renderBackupReminder();
    showToast('Toutes les données ont été réinitialisées');
  }

  // ==========================================================================
  // 20. Initialisation des écouteurs d'événements
  // ==========================================================================

  function initEventListeners() {
    // 1. Thème
    if (dom.themeToggleBtn) {
      dom.themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // 2. Journal des versions (Changelog)
    if (dom.versionBadgeBtn) {
      dom.versionBadgeBtn.addEventListener('click', openChangelogModal);
    }
    if (dom.footerVersionBtn) {
      dom.footerVersionBtn.addEventListener('click', openChangelogModal);
    }
    if (dom.closeChangelogModalBtn) {
      dom.closeChangelogModalBtn.addEventListener('click', closeChangelogModal);
    }
    if (dom.closeChangelogFooterBtn) {
      dom.closeChangelogFooterBtn.addEventListener('click', closeChangelogModal);
    }
    if (dom.changelogModal) {
      dom.changelogModal.addEventListener('click', (e) => {
        if (e.target === dom.changelogModal) closeChangelogModal();
      });
    }

    // 3. Module Comptes
    if (dom.openAddAccountBtn) {
      dom.openAddAccountBtn.addEventListener('click', () => openAccountModal());
    }
    if (dom.closeAccountModalBtn) {
      dom.closeAccountModalBtn.addEventListener('click', closeAccountModal);
    }
    if (dom.cancelAccountModalBtn) {
      dom.cancelAccountModalBtn.addEventListener('click', closeAccountModal);
    }
    if (dom.accountModal) {
      dom.accountModal.addEventListener('click', (e) => {
        if (e.target === dom.accountModal) closeAccountModal();
      });
    }
    if (dom.accountForm) {
      dom.accountForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveAccount(
          dom.accountEditId.value,
          dom.accountNameInput.value,
          dom.accountTypeSelect.value,
          parseFloat(dom.accountInitialBalanceInput.value)
        );
      });
    }
    if (dom.accountsGrid) {
      dom.accountsGrid.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-account-btn');
        if (editBtn) {
          openAccountModal(editBtn.getAttribute('data-id'));
          return;
        }

        const deleteBtn = e.target.closest('.delete-account-btn');
        if (deleteBtn) {
          deleteAccount(deleteBtn.getAttribute('data-id'));
          return;
        }

        const card = e.target.closest('.account-card');
        if (card) {
          const accId = card.getAttribute('data-account-id');
          if (state.filterAccount === accId) {
            state.filterAccount = 'all';
          } else {
            state.filterAccount = accId;
          }
          if (dom.filterAccountSelect) dom.filterAccountSelect.value = state.filterAccount;
          state.currentPage = 1;
          updateUI();
        }
      });

      // Activation au clavier des cartes de compte (Entrée / Espace)
      dom.accountsGrid.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const card = e.target.closest('.account-card');
        if (!card || e.target !== card) return;
        e.preventDefault();
        const accId = card.getAttribute('data-account-id');
        state.filterAccount = state.filterAccount === accId ? 'all' : accId;
        if (dom.filterAccountSelect) dom.filterAccountSelect.value = state.filterAccount;
        state.currentPage = 1;
        updateUI();
        const refocus = dom.accountsGrid.querySelector(`.account-card[data-account-id="${CSS.escape(accId)}"]`);
        if (refocus) refocus.focus();
      });
    }

    // 4. Module Objectifs d'épargne
    if (dom.openAddGoalBtn) {
      dom.openAddGoalBtn.addEventListener('click', () => openGoalModal());
    }
    if (dom.closeGoalModalBtn) {
      dom.closeGoalModalBtn.addEventListener('click', closeGoalModal);
    }
    if (dom.cancelGoalModalBtn) {
      dom.cancelGoalModalBtn.addEventListener('click', closeGoalModal);
    }
    if (dom.goalModal) {
      dom.goalModal.addEventListener('click', (e) => {
        if (e.target === dom.goalModal) closeGoalModal();
      });
    }
    if (dom.goalForm) {
      dom.goalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveGoal(
          dom.goalEditId.value,
          dom.goalNameInput.value,
          dom.goalTargetInput.value,
          dom.goalCurrentInput.value,
          dom.goalDateInput.value,
          dom.goalAccountSelect ? dom.goalAccountSelect.value : ''
        );
      });
    }

    if (dom.goalsGrid) {
      dom.goalsGrid.addEventListener('click', (e) => {
        const depositBtn = e.target.closest('.deposit-goal-btn');
        if (depositBtn) {
          openGoalTransferModal(depositBtn.getAttribute('data-id'), 'deposit');
          return;
        }

        const withdrawBtn = e.target.closest('.withdraw-goal-btn');
        if (withdrawBtn) {
          openGoalTransferModal(withdrawBtn.getAttribute('data-id'), 'withdraw');
          return;
        }

        const editBtn = e.target.closest('.edit-goal-btn');
        if (editBtn) {
          openGoalModal(editBtn.getAttribute('data-id'));
          return;
        }

        const deleteBtn = e.target.closest('.delete-goal-btn');
        if (deleteBtn) {
          deleteGoal(deleteBtn.getAttribute('data-id'));
        }
      });
    }

    if (dom.closeGoalTransferModalBtn) {
      dom.closeGoalTransferModalBtn.addEventListener('click', closeGoalTransferModal);
    }
    if (dom.cancelGoalTransferModalBtn) {
      dom.cancelGoalTransferModalBtn.addEventListener('click', closeGoalTransferModal);
    }
    if (dom.goalTransferModal) {
      dom.goalTransferModal.addEventListener('click', (e) => {
        if (e.target === dom.goalTransferModal) closeGoalTransferModal();
      });
    }
    if (dom.goalTransferForm) {
      dom.goalTransferForm.addEventListener('submit', (e) => {
        e.preventDefault();
        submitGoalTransfer(
          dom.goalTransferId.value,
          dom.goalTransferType.value,
          dom.goalTransferAmountInput.value,
          dom.goalTransferAccountSelect ? dom.goalTransferAccountSelect.value : ''
        );
      });
    }

    // 5. Module Transactions Récurrentes
    if (dom.openAddRecurringBtn) {
      dom.openAddRecurringBtn.addEventListener('click', () => openRecurringModal());
    }
    if (dom.applyRecurringBtn) {
      dom.applyRecurringBtn.addEventListener('click', applyMonthlyRecurring);
    }
    if (dom.closeRecurringModalBtn) {
      dom.closeRecurringModalBtn.addEventListener('click', closeRecurringModal);
    }
    if (dom.cancelRecurringModalBtn) {
      dom.cancelRecurringModalBtn.addEventListener('click', closeRecurringModal);
    }
    if (dom.recurringModal) {
      dom.recurringModal.addEventListener('click', (e) => {
        if (e.target === dom.recurringModal) closeRecurringModal();
      });
    }

    if (dom.recTypeExpense) dom.recTypeExpense.addEventListener('change', () => handleRecTypeChange('expense'));
    if (dom.recTypeIncome) dom.recTypeIncome.addEventListener('change', () => handleRecTypeChange('income'));

    if (dom.recurringForm) {
      dom.recurringForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const type = dom.recTypeIncome.checked ? 'income' : 'expense';
        saveRecurring(
          dom.recurringEditId.value,
          type,
          dom.recNameInput.value,
          dom.recAmountInput.value,
          dom.recAccountSelect.value,
          dom.recCategorySelect.value,
          dom.recFrequencySelect ? dom.recFrequencySelect.value : 'monthly',
          dom.recStartDateInput ? dom.recStartDateInput.value : ''
        );
      });
    }

    if (dom.autoApplyToggle) {
      dom.autoApplyToggle.addEventListener('change', (e) => setAutoApplyRecurring(e.target.checked));
    }

    // 5 bis. Gestion des catégories
    if (dom.openCategoriesBtn) {
      dom.openCategoriesBtn.addEventListener('click', () => {
        openCategoriesModal(dom.typeIncomeRadio && dom.typeIncomeRadio.checked ? 'income' : 'expense');
      });
    }
    if (dom.closeCategoriesModalBtn) dom.closeCategoriesModalBtn.addEventListener('click', closeCategoriesModal);
    if (dom.closeCategoriesFooterBtn) dom.closeCategoriesFooterBtn.addEventListener('click', closeCategoriesModal);
    if (dom.categoriesModal) {
      dom.categoriesModal.addEventListener('click', (e) => {
        if (e.target === dom.categoriesModal) closeCategoriesModal();
      });
    }
    if (dom.categoriesTabExpense) {
      dom.categoriesTabExpense.addEventListener('click', () => {
        state.categoriesModalType = 'expense';
        renderCategoriesManager();
      });
    }
    if (dom.categoriesTabIncome) {
      dom.categoriesTabIncome.addEventListener('click', () => {
        state.categoriesModalType = 'income';
        renderCategoriesManager();
      });
    }
    if (dom.addCategoryForm) {
      dom.addCategoryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (addCategory(state.categoriesModalType, dom.newCategoryName.value, dom.newCategoryColor.value)) {
          dom.newCategoryName.value = '';
          dom.newCategoryName.focus();
        }
      });
    }
    if (dom.categoriesList) {
      // Renommage : validé à la sortie du champ ou avec Entrée
      dom.categoriesList.addEventListener('change', (e) => {
        const item = e.target.closest('.category-item');
        if (!item) return;
        const id = item.getAttribute('data-id');
        const type = state.categoriesModalType;
        if (e.target.classList.contains('category-name-input')) {
          if (!renameCategory(type, id, e.target.value)) {
            const cat = getCategoryList(type).find(c => c.id === id);
            if (cat) e.target.value = cat.label;
          }
        } else if (e.target.classList.contains('category-color-input')) {
          setCategoryColor(type, id, e.target.value);
        }
      });
      dom.categoriesList.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.classList.contains('category-name-input')) {
          e.preventDefault();
          e.target.blur();
        }
      });
      dom.categoriesList.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-category-btn');
        if (deleteBtn) deleteCategory(state.categoriesModalType, deleteBtn.getAttribute('data-id'));
      });
    }

    // 5 ter. Rappel de sauvegarde
    if (dom.backupNowBtn) dom.backupNowBtn.addEventListener('click', exportDataAsJSON);
    if (dom.backupLaterBtn) dom.backupLaterBtn.addEventListener('click', snoozeBackupReminder);

    // 5 quater. Pagination des transactions
    if (dom.transactionsPagination) {
      dom.transactionsPagination.addEventListener('click', (e) => {
        const btn = e.target.closest('.pagination-btn');
        if (!btn || btn.disabled) return;
        const page = parseInt(btn.getAttribute('data-page'), 10);
        if (Number.isFinite(page)) goToTransactionsPage(page);
      });
      dom.transactionsPagination.addEventListener('change', (e) => {
        if (!e.target.classList.contains('pagination-size-select')) return;
        const size = parseInt(e.target.value, 10);
        if (!PAGE_SIZE_OPTIONS.includes(size)) return;
        state.settings.pageSize = size;
        state.currentPage = 1;
        saveSettingsToStorage();
        renderTransactionsTable();
      });
    }

    if (dom.recurringGrid) {
      dom.recurringGrid.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-recurring-btn');
        if (editBtn) {
          openRecurringModal(editBtn.getAttribute('data-id'));
          return;
        }

        const deleteBtn = e.target.closest('.delete-recurring-btn');
        if (deleteBtn) {
          deleteRecurring(deleteBtn.getAttribute('data-id'));
        }
      });
    }

    // 6. Gestion des Budgets
    if (dom.openAddBudgetBtn) {
      dom.openAddBudgetBtn.addEventListener('click', () => openBudgetModal());
    }
    if (dom.closeBudgetModalBtn) {
      dom.closeBudgetModalBtn.addEventListener('click', closeBudgetModal);
    }
    if (dom.cancelBudgetModalBtn) {
      dom.cancelBudgetModalBtn.addEventListener('click', closeBudgetModal);
    }
    if (dom.budgetModal) {
      dom.budgetModal.addEventListener('click', (e) => {
        if (e.target === dom.budgetModal) closeBudgetModal();
      });
    }
    if (dom.budgetForm) {
      dom.budgetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const cat = dom.budgetOriginalCategory.value || dom.budgetCategorySelect.value;
        saveBudget(cat, parseFloat(dom.budgetLimitInput.value));
      });
    }
    if (dom.budgetsGrid) {
      dom.budgetsGrid.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-budget-btn');
        if (editBtn) {
          const category = editBtn.getAttribute('data-category');
          if (category) openBudgetModal(category);
          return;
        }

        const deleteBtn = e.target.closest('.delete-budget-btn');
        if (deleteBtn) {
          const category = deleteBtn.getAttribute('data-category');
          if (category) deleteBudget(category);
        }
      });
    }

    // 7. Formulaire principal : changement de type et synchronisation des comptes
    if (dom.typeExpenseRadio) dom.typeExpenseRadio.addEventListener('change', () => handleMainTypeChange('expense'));
    if (dom.typeIncomeRadio) dom.typeIncomeRadio.addEventListener('change', () => handleMainTypeChange('income'));
    if (dom.typeTransferRadio) dom.typeTransferRadio.addEventListener('change', () => handleMainTypeChange('transfer'));

    if (dom.txAccountSelect) {
      dom.txAccountSelect.addEventListener('change', () => {
        if (dom.txTargetAccountSelect && dom.txTargetAccountSelect.value === dom.txAccountSelect.value) {
          const other = state.accounts.find(a => a.id !== dom.txAccountSelect.value);
          if (other) dom.txTargetAccountSelect.value = other.id;
        }
      });
    }

    // 8. Soumission du formulaire d'ajout
    if (dom.transactionForm) {
      dom.transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const type = dom.typeTransferRadio && dom.typeTransferRadio.checked
          ? 'transfer'
          : (dom.typeIncomeRadio && dom.typeIncomeRadio.checked ? 'income' : 'expense');
        const amount = parseFloat(dom.txAmountInput.value);
        const accountId = dom.txAccountSelect.value || state.accounts[0]?.id || 'courant';
        const toAccountId = (type === 'transfer' && dom.txTargetAccountSelect) ? dom.txTargetAccountSelect.value : null;
        const category = type === 'transfer' ? 'Virement interne' : dom.txCategorySelect.value;
        const description = dom.txDescriptionInput.value;
        const date = normalizeDateString(dom.txDateInput.value);

        if (isNaN(amount) || amount <= 0) {
          showToast('Veuillez saisir un montant supérieur à 0 €');
          dom.txAmountInput.focus();
          return;
        }

        if (type === 'transfer' && accountId === toAccountId) {
          showToast('Le compte source et le compte de destination doivent être différents.');
          return;
        }

        if (!date) {
          showToast('Veuillez sélectionner une date');
          dom.txDateInput.focus();
          return;
        }

        const newTx = {
          id: generateId(),
          type,
          amount: Math.round(amount * 100) / 100,
          accountId,
          category,
          description: description ? description.trim() : '',
          date,
          createdAt: Date.now()
        };
        if (type === 'transfer') {
          newTx.toAccountId = toAccountId;
        }

        state.transactions.unshift(newTx);
        saveTransactionsToStorage();

        dom.txAmountInput.value = '';
        dom.txDescriptionInput.value = '';
        dom.txDateInput.value = getTodayDateString();

        state.currentPage = 1;
        updateUI();
        showToast(type === 'transfer' ? 'Virement enregistré avec succès' : 'Transaction ajoutée avec succès');
      });
    }

    // 9. Modale d'édition de transaction
    if (dom.editTypeExpenseRadio) dom.editTypeExpenseRadio.addEventListener('change', () => handleEditTypeChange('expense'));
    if (dom.editTypeIncomeRadio) dom.editTypeIncomeRadio.addEventListener('change', () => handleEditTypeChange('income'));
    if (dom.editTypeTransferRadio) dom.editTypeTransferRadio.addEventListener('change', () => handleEditTypeChange('transfer'));

    if (dom.editTxAccountSelect) {
      dom.editTxAccountSelect.addEventListener('change', () => {
        if (dom.editTxTargetAccountSelect && dom.editTxTargetAccountSelect.value === dom.editTxAccountSelect.value) {
          const other = state.accounts.find(a => a.id !== dom.editTxAccountSelect.value);
          if (other) dom.editTxTargetAccountSelect.value = other.id;
        }
      });
    }

    if (dom.closeEditModalBtn) dom.closeEditModalBtn.addEventListener('click', closeEditModal);
    if (dom.cancelEditModalBtn) dom.cancelEditModalBtn.addEventListener('click', closeEditModal);
    if (dom.editModal) {
      dom.editModal.addEventListener('click', (e) => {
        if (e.target === dom.editModal) closeEditModal();
      });
    }

    if (dom.editTransactionForm) {
      dom.editTransactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = dom.editTxId.value;
        const tx = state.transactions.find(t => t.id === id);
        if (!tx) return;

        const type = dom.editTypeTransferRadio && dom.editTypeTransferRadio.checked
          ? 'transfer'
          : (dom.editTypeIncomeRadio && dom.editTypeIncomeRadio.checked ? 'income' : 'expense');
        const amount = parseFloat(dom.editTxAmountInput.value);
        const accountId = dom.editTxAccountSelect.value || state.accounts[0]?.id || 'courant';
        const toAccountId = (type === 'transfer' && dom.editTxTargetAccountSelect) ? dom.editTxTargetAccountSelect.value : null;
        const category = type === 'transfer' ? 'Virement interne' : dom.editTxCategorySelect.value;
        const description = dom.editTxDescriptionInput.value;
        const date = normalizeDateString(dom.editTxDateInput.value);

        if (isNaN(amount) || amount <= 0) {
          showToast('Veuillez saisir un montant valide');
          return;
        }

        if (type === 'transfer' && accountId === toAccountId) {
          showToast('Le compte source et le compte de destination doivent être différents.');
          return;
        }

        if (!date) {
          showToast('Veuillez sélectionner une date');
          dom.editTxDateInput.focus();
          return;
        }

        tx.type = type;
        tx.amount = Math.round(amount * 100) / 100;
        tx.accountId = accountId;
        if (type === 'transfer') {
          tx.toAccountId = toAccountId;
        } else {
          delete tx.toAccountId;
        }
        tx.category = category;
        tx.description = description ? description.trim() : '';
        tx.date = date;

        saveTransactionsToStorage();
        closeEditModal();
        updateUI();
        showToast('Transaction modifiée avec succès');
      });
    }

    // 10. Actions du tableau de transactions
    if (dom.transactionsTableBody) {
      dom.transactionsTableBody.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-tx-btn');
        if (editBtn) {
          const id = editBtn.getAttribute('data-id');
          openEditModal(id);
          return;
        }

        const deleteBtn = e.target.closest('.delete-tx-btn');
        if (deleteBtn) {
          const id = deleteBtn.getAttribute('data-id');
          const index = state.transactions.findIndex(t => t.id === id);
          if (index !== -1) {
            const deleted = state.transactions.splice(index, 1)[0];
            saveTransactionsToStorage();
            updateUI();

            showToast('Transaction supprimée', 'Annuler', () => {
              state.transactions.splice(index, 0, deleted);
              saveTransactionsToStorage();
              updateUI();
              showToast('Suppression annulée');
            });
          }
        }
      });
    }

    // 11. Filtres
    if (dom.filterAccountSelect) {
      dom.filterAccountSelect.addEventListener('change', (e) => {
        state.filterAccount = e.target.value;
        state.currentPage = 1;
        updateUI();
      });
    }

    if (dom.filterPeriodSelect) {
      dom.filterPeriodSelect.addEventListener('change', (e) => {
        state.filterPeriod = e.target.value;
        state.currentPage = 1;
        updateUI();
      });
    }

    if (dom.filterTypeSelect) {
      dom.filterTypeSelect.addEventListener('change', (e) => {
        state.filterType = e.target.value;
        state.currentPage = 1;
        updateUI();
      });
    }

    if (dom.filterSearchInput) {
      dom.filterSearchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        state.currentPage = 1;
        renderTransactionsTable();
        renderStats();
      });
    }

    // 12. Exports & Imports
    if (dom.exportDataBtn) dom.exportDataBtn.addEventListener('click', exportDataAsJSON);
    if (dom.exportCsvBtn) dom.exportCsvBtn.addEventListener('click', exportDataAsCSV);
    if (dom.importFileInput) dom.importFileInput.addEventListener('change', handleFileImport);
    if (dom.resetDataBtn) dom.resetDataBtn.addEventListener('click', resetAllData);

    // 13. Navigation fluide & Défilement actif
    if (dom.navLinks) {
      dom.navLinks.forEach(link => {
        link.addEventListener('click', function () {
          dom.navLinks.forEach(l => l.classList.remove('active'));
          this.classList.add('active');
        });
      });
    }

    // 14. Fermeture des modales avec la touche Échap
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        closeAllModals();
      }
    });

    // 15. Détection de défilement pour la barre de navigation
    if ('IntersectionObserver' in window) {
      const sections = document.querySelectorAll('section[id]');
      const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            if (dom.navLinks) {
              dom.navLinks.forEach(link => {
                if (link.getAttribute('href') === `#${id}`) {
                  link.classList.add('active');
                } else {
                  link.classList.remove('active');
                }
              });
            }
          }
        });
      }, { rootMargin: '-20% 0px -65% 0px' });

      sections.forEach(sec => navObserver.observe(sec));
    }
  }

  // ==========================================================================
  // 21. Démarrage de l'application
  // ==========================================================================

  function init() {
    // 1. Initialiser le thème (préférence enregistrée, sinon thème du système)
    const savedTheme = loadThemeFromStorage();
    applyTheme(savedTheme || getSystemTheme(), false);
    if (!savedTheme && window.matchMedia) {
      try {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
          if (!loadThemeFromStorage()) applyTheme(e.matches ? 'dark' : 'light', false);
        });
      } catch (e) { /* navigateurs anciens : ignoré */ }
    }

    const storedAccounts = loadAccountsFromStorage();
    const storedBalance = loadInitialBalanceFromStorage();
    const storedTxs = loadTransactionsFromStorage();
    const isFirstVisit = storedAccounts === null && storedBalance === null && storedTxs === null;

    // 1 bis. Réglages (pagination, récurrences automatiques, sauvegardes) et catégories
    state.settings = sanitizeSettings(loadJsonFromStorage(STORAGE_KEY_SETTINGS));
    if (!state.settings.firstUseAt) state.settings.firstUseAt = Date.now();
    state.categories = sanitizeCategories(loadJsonFromStorage(STORAGE_KEY_CATEGORIES));

    // 2. Charger les comptes
    if (storedAccounts && storedAccounts.length > 0) {
      state.accounts = sanitizeAccounts(storedAccounts);
    } else if (!isFirstVisit) {
      // Migration v1/v2 : un seul solde initial, pas de comptes.
      // On conserve ce solde sur un compte unique au lieu d'ajouter des comptes de démonstration.
      state.accounts = [{
        id: 'courant',
        name: 'Compte Courant',
        type: 'checking',
        initialBalance: storedBalance !== null ? storedBalance : 0
      }];
    } else {
      state.accounts = deepClone(DEFAULT_ACCOUNTS);
    }

    // 3. Charger le solde initial (conservé pour compatibilité des exports)
    state.initialBalance = storedBalance !== null ? storedBalance : INITIAL_DEMO_DATA.initialBalance;

    const fallbackAccountId = state.accounts[0]?.id || 'courant';

    // 4. Charger les transactions
    // Les données de démonstration ne sont injectées qu'à la toute première visite
    state.transactions = storedTxs !== null
      ? sanitizeTransactions(storedTxs, fallbackAccountId)
      : (isFirstVisit ? deepClone(INITIAL_DEMO_DATA.transactions) : []);

    // 5. Charger les budgets
    const storedBudgets = loadBudgetsFromStorage();
    state.budgets = storedBudgets !== null
      ? sanitizeBudgets(storedBudgets)
      : (isFirstVisit ? { ...INITIAL_DEMO_DATA.budgets } : {});

    // 6. Charger les objectifs d'épargne
    const storedGoals = loadGoalsFromStorage();
    state.goals = storedGoals !== null
      ? sanitizeGoals(storedGoals)
      : (isFirstVisit ? deepClone(DEFAULT_GOALS) : []);

    // 7. Charger les récurrences
    const storedRecurring = loadRecurringFromStorage();
    state.recurring = storedRecurring !== null
      ? sanitizeRecurring(storedRecurring, fallbackAccountId)
      : (isFirstVisit ? sanitizeRecurring(DEFAULT_RECURRING, fallbackAccountId) : []);

    repairAccountReferences();
    ensureCategoriesFromData();

    // 7 bis. Application automatique des échéances récurrentes passées
    const autoApplied = state.settings.autoApplyRecurring ? autoApplyRecurring() : 0;

    saveAllToStorage();
    saveSettingsToStorage();

    // 8. Initialiser les sélecteurs et la date du jour
    // (synchronise l'interface avec le type éventuellement restauré par le navigateur)
    const checkedType = dom.typeTransferRadio && dom.typeTransferRadio.checked
      ? 'transfer'
      : (dom.typeIncomeRadio && dom.typeIncomeRadio.checked ? 'income' : 'expense');
    populateAllCategorySelects();
    handleMainTypeChange(checkedType);
    if (dom.txDateInput) dom.txDateInput.value = getTodayDateString();

    // 9. Initialiser les écouteurs d'événements
    initEventListeners();

    // 10. Premier rendu de l'interface
    updateUI();
    renderBackupReminder();
    if (autoApplied > 0) {
      showToast(`⚡ ${autoApplied} opération(s) récurrente(s) échue(s) ajoutée(s) automatiquement`);
    }

    // 11. Enregistrement PWA (Service Worker pour fonctionnement hors-ligne)
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then((reg) => {
            console.log('Service Worker enregistré:', reg.scope);
          })
          .catch((err) => {
            console.warn('Erreur Service Worker:', err);
          });
      });
    }
  }

  // Lancement dès que le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
