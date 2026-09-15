/**
 * Budget Manager — Application JavaScript
 * Gestion de budget simple, moderne, 100% locale avec multi-comptes, objectifs d'épargne, transactions récurrentes, plafonds budgétaires, graphiques, mode sombre, édition et imports/exports
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. Constantes & Catégories par défaut
  // ==========================================================================

  const APP_VERSION = '4.0.0';

  const STORAGE_KEY_TRANSACTIONS = 'budget_manager_transactions';
  const STORAGE_KEY_INITIAL_BALANCE = 'budget_manager_initial_balance';
  const STORAGE_KEY_THEME = 'budget_manager_theme';
  const STORAGE_KEY_BUDGETS = 'budget_manager_budgets';
  const STORAGE_KEY_ACCOUNTS = 'budget_manager_accounts';
  const STORAGE_KEY_ACTIVE_ACCOUNT = 'budget_manager_active_account';
  const STORAGE_KEY_GOALS = 'budget_manager_goals';
  const STORAGE_KEY_RECURRING = 'budget_manager_recurring';

  // Historique des versions (Changelog officiel)
  const CHANGELOG_HISTORY = [
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

  const CATEGORIES = {
    expense: [
      { id: 'alimentation', label: 'Alimentation & Courses' },
      { id: 'logement', label: 'Logement & Factures' },
      { id: 'transport', label: 'Transport & Carburant' },
      { id: 'loisirs', label: 'Loisirs & Sorties' },
      { id: 'shopping', label: 'Achats & Shopping' },
      { id: 'sante', label: 'Santé & Soins' },
      { id: 'autre_depense', label: 'Autre dépense' }
    ],
    income: [
      { id: 'salaire', label: 'Salaire & Rémunération' },
      { id: 'investissements', label: 'Investissements & Dividendes' },
      { id: 'primes', label: 'Primes & Cadeaux' },
      { id: 'ventes', label: 'Ventes & Remboursements' },
      { id: 'autre_revenu', label: 'Autre revenu' }
    ]
  };

  const EXPENSE_COLORS = ['#ef4444', '#f97316', '#eab308', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b', '#3b82f6'];
  const INCOME_COLORS = ['#22c55e', '#10b981', '#14b8a6', '#0ea5e9', '#6366f1', '#a855f7', '#84cc16'];

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
    recDayInput: document.getElementById('recDayInput'),

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

  // ==========================================================================
  // 5. Gestion de la persistance (LocalStorage)
  // ==========================================================================

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

  function loadThemeFromStorage() {
    try {
      return localStorage.getItem(STORAGE_KEY_THEME) || 'light';
    } catch (e) {
      return 'light';
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

  function applyTheme(theme) {
    state.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);

    if (theme === 'dark') {
      if (dom.iconSun) dom.iconSun.classList.add('hidden');
      if (dom.iconMoon) dom.iconMoon.classList.remove('hidden');
    } else {
      if (dom.iconSun) dom.iconSun.classList.remove('hidden');
      if (dom.iconMoon) dom.iconMoon.classList.add('hidden');
    }
    saveThemeToStorage(theme);
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
    const currentVal = dom.filterAccountSelect.value || 'all';
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
        <div class="account-card ${isSelected ? 'active' : ''}" data-account-id="${escapeHtml(acc.id)}">
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
    const balanceVal = Number.isFinite(initialBalance) ? initialBalance : 0;

    if (id) {
      const acc = getAccountById(id);
      if (acc) {
        acc.name = name.trim();
        acc.type = type;
        acc.initialBalance = balanceVal;
        showToast(`Compte « ${acc.name} » mis à jour`);
      }
    } else {
      const newAcc = {
        id: 'acc-' + Date.now().toString(36),
        name: name.trim(),
        type: type,
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

    // Réassigner les transactions
    state.transactions.forEach(t => {
      if (t.accountId === id) t.accountId = fallbackId;
      if (t.toAccountId === id) t.toAccountId = fallbackId;
      if (t.type === 'transfer' && t.accountId === t.toAccountId) {
        const otherAcc = state.accounts.find(a => a.id !== fallbackId);
        if (otherAcc) {
          t.toAccountId = otherAcc.id;
        } else {
          t.type = 'expense';
          t.category = 'Autre dépense';
          delete t.toAccountId;
        }
      }
    });

    // Réassigner les transactions récurrentes
    if (state.recurring) {
      state.recurring.forEach(r => {
        if (r.accountId === id) r.accountId = fallbackId;
      });
      saveRecurringToStorage();
    }

    if (state.filterAccount === id) {
      state.filterAccount = 'all';
    }

    saveAccountsToStorage();
    saveTransactionsToStorage();
    updateUI();
    showToast(`Compte « ${acc.name} » supprimé`);
  }

  // ==========================================================================
  // 9. Module Objectifs d'Épargne & Cagnottes
  // ==========================================================================

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

    const totalSaved = state.goals.reduce((sum, g) => sum + (Number(g.currentAmount) || 0), 0);
    const totalTarget = state.goals.reduce((sum, g) => sum + (Number(g.targetAmount) || 0), 0);
    const globalRate = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

    if (dom.goalTotalSaved) dom.goalTotalSaved.textContent = formatCurrency(totalSaved);
    if (dom.goalTotalTarget) dom.goalTotalTarget.textContent = formatCurrency(totalTarget);
    if (dom.goalGlobalRate) dom.goalGlobalRate.textContent = `${globalRate} %`;

    dom.goalsGrid.innerHTML = state.goals.map(goal => {
      const current = Number(goal.currentAmount) || 0;
      const target = Number(goal.targetAmount) || 1;
      const rate = Math.min(100, Math.round((current / target) * 100));
      const isComplete = current >= target;
      const remaining = Math.max(0, target - current);

      let targetDateInfo = '';
      if (goal.targetDate) {
        const targetD = new Date(goal.targetDate);
        const now = new Date();
        const diffMonths = Math.max(1, (targetD.getFullYear() - now.getFullYear()) * 12 + (targetD.getMonth() - now.getMonth()));
        const monthlyNeeded = remaining / diffMonths;
        targetDateInfo = `
          <span>Échéance visée : <strong>${formatDateFr(goal.targetDate)}</strong></span>
          ${remaining > 0 ? `<span>Effort recommandé : <strong>${formatCurrency(monthlyNeeded)} / mois</strong></span>` : ''}
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

  function openGoalModal(id = null) {
    if (!dom.goalModal) return;
    if (id) {
      const goal = state.goals.find(g => g.id === id);
      if (!goal) return;
      dom.goalModalTitle.textContent = 'Modifier l\'objectif d\'épargne';
      dom.goalEditId.value = goal.id;
      dom.goalNameInput.value = goal.name;
      dom.goalTargetInput.value = goal.targetAmount;
      dom.goalCurrentInput.value = goal.currentAmount;
      dom.goalDateInput.value = goal.targetDate || '';
    } else {
      dom.goalModalTitle.textContent = 'Nouvel objectif d\'épargne';
      dom.goalEditId.value = '';
      dom.goalNameInput.value = '';
      dom.goalTargetInput.value = '';
      dom.goalCurrentInput.value = '0';
      dom.goalDateInput.value = '';
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

  function saveGoal(id, name, targetAmount, currentAmount, targetDate) {
    if (!name.trim()) {
      showToast('Veuillez saisir un nom pour votre projet');
      return;
    }
    const targetVal = parseFloat(targetAmount);
    if (isNaN(targetVal) || targetVal <= 0) {
      showToast('Veuillez indiquer un montant cible valide');
      return;
    }
    const currentVal = parseFloat(currentAmount) || 0;

    if (id) {
      const goal = state.goals.find(g => g.id === id);
      if (goal) {
        goal.name = name.trim();
        goal.targetAmount = targetVal;
        goal.currentAmount = currentVal;
        goal.targetDate = targetDate || '';
        showToast(`Objectif « ${goal.name} » mis à jour`);
      }
    } else {
      const newGoal = {
        id: 'goal-' + Date.now().toString(36),
        name: name.trim(),
        targetAmount: targetVal,
        currentAmount: currentVal,
        targetDate: targetDate || ''
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
    const confirmDel = window.confirm(`Supprimer l'objectif « ${goal.name} » ?`);
    if (!confirmDel) return;

    state.goals = state.goals.filter(g => g.id !== id);
    saveGoalsToStorage();
    renderGoals();
    showToast(`Objectif « ${goal.name} » supprimé`);
  }

  function openGoalTransferModal(id, type = 'deposit') {
    const goal = state.goals.find(g => g.id === id);
    if (!goal || !dom.goalTransferModal) return;

    dom.goalTransferId.value = goal.id;
    dom.goalTransferType.value = type;
    dom.goalTransferDesc.innerHTML = `Projet : <strong>${escapeHtml(goal.name)}</strong> (Actuel : ${formatCurrency(goal.currentAmount)} / Cible : ${formatCurrency(goal.targetAmount)})`;
    dom.goalTransferAmountInput.value = '';

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

  function submitGoalTransfer(id, type, amount) {
    const goal = state.goals.find(g => g.id === id);
    if (!goal) return;

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      showToast('Veuillez saisir un montant valide');
      return;
    }

    if (type === 'deposit') {
      goal.currentAmount = (Number(goal.currentAmount) || 0) + val;
      showToast(`+${formatCurrency(val)} versés sur « ${goal.name} »`);
    } else {
      if (val > (Number(goal.currentAmount) || 0)) {
        showToast('Le montant retiré dépasse le montant disponible dans cette cagnotte.');
        return;
      }
      goal.currentAmount = (Number(goal.currentAmount) || 0) - val;
      showToast(`-${formatCurrency(val)} retirés de « ${goal.name} »`);
    }

    saveGoalsToStorage();
    closeGoalTransferModal();
    renderGoals();
  }

  // ==========================================================================
  // 10. Module Transactions Récurrentes & Abonnements
  // ==========================================================================

  function renderRecurring() {
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

    const totalExpense = state.recurring
      .filter(r => r.type === 'expense')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const totalIncome = state.recurring
      .filter(r => r.type === 'income')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
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

      return `
        <div class="recurring-card ${isExpense ? 'expense-recur' : 'income-recur'}">
          <div class="recurring-card-header">
            <span class="recurring-title">${escapeHtml(rec.name)}</span>
            <span class="recurring-frequency-badge">Mensuel</span>
          </div>
          <div class="recurring-amount ${isExpense ? 'expense-text' : 'income-text'}">
            ${isExpense ? '-' : '+'}${formatCurrency(rec.amount)}
          </div>
          <div class="recurring-details-row">
            <span class="account-pill">${escapeHtml(accName)}</span>
            <span class="recurring-day-chip">Jour ${rec.day} du mois</span>
          </div>
          <div class="recurring-card-footer">
            <span style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHtml(rec.category)}</span>
            <div class="account-card-actions">
              <button type="button" class="btn-edit-icon edit-recurring-btn" data-id="${escapeHtml(rec.id)}" title="Modifier la récurrence">
                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                </svg>
              </button>
              <button type="button" class="btn-danger-icon delete-recurring-btn" data-id="${escapeHtml(rec.id)}" title="Supprimer la récurrence">
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
      if (rec.type === 'income') {
        dom.recTypeIncome.checked = true;
        dom.labelRecTypeIncome.classList.add('active');
        dom.labelRecTypeExpense.classList.remove('active');
        populateCategorySelect(dom.recCategorySelect, 'income');
      } else {
        dom.recTypeExpense.checked = true;
        dom.labelRecTypeExpense.classList.add('active');
        dom.labelRecTypeIncome.classList.remove('active');
        populateCategorySelect(dom.recCategorySelect, 'expense');
      }
      dom.recNameInput.value = rec.name;
      dom.recAmountInput.value = rec.amount;
      dom.recAccountSelect.value = rec.accountId || state.accounts[0]?.id || 'courant';
      dom.recCategorySelect.value = rec.category;
      dom.recDayInput.value = rec.day || 1;
    } else {
      dom.recurringModalTitle.textContent = 'Nouvelle opération récurrente';
      dom.recurringEditId.value = '';
      dom.recTypeExpense.checked = true;
      dom.labelRecTypeExpense.classList.add('active');
      dom.labelRecTypeIncome.classList.remove('active');
      populateCategorySelect(dom.recCategorySelect, 'expense');
      dom.recNameInput.value = '';
      dom.recAmountInput.value = '';
      dom.recAccountSelect.value = state.accounts[0]?.id || 'courant';
      dom.recDayInput.value = 1;
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

  function saveRecurring(id, type, name, amount, accountId, category, day) {
    if (!name.trim()) {
      showToast('Veuillez saisir un intitulé');
      return;
    }
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      showToast('Veuillez saisir un montant valide');
      return;
    }
    const dayVal = Math.min(31, Math.max(1, parseInt(day, 10) || 1));

    if (id) {
      const rec = state.recurring.find(r => r.id === id);
      if (rec) {
        rec.type = type;
        rec.name = name.trim();
        rec.amount = val;
        rec.accountId = accountId;
        rec.category = category;
        rec.day = dayVal;
        showToast(`Récurrence « ${rec.name} » mise à jour`);
      }
    } else {
      const newRec = {
        id: 'rec-' + Date.now().toString(36),
        type,
        name: name.trim(),
        amount: val,
        accountId,
        category,
        day: dayVal
      };
      state.recurring.push(newRec);
      showToast(`Récurrence « ${newRec.name} » enregistrée`);
    }

    saveRecurringToStorage();
    closeRecurringModal();
    renderRecurring();
  }

  function deleteRecurring(id) {
    const rec = state.recurring.find(r => r.id === id);
    if (!rec) return;
    const confirmDel = window.confirm(`Supprimer la récurrence « ${rec.name} » ?`);
    if (!confirmDel) return;

    state.recurring = state.recurring.filter(r => r.id !== id);
    saveRecurringToStorage();
    renderRecurring();
    showToast(`Récurrence « ${rec.name} » supprimée`);
  }

  function applyMonthlyRecurring() {
    if (!state.recurring || state.recurring.length === 0) {
      showToast('Aucune transaction récurrente configurée.');
      return;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth();
    const currentMonth = String(currentMonthNum + 1).padStart(2, '0');
    const daysInMonth = new Date(currentYear, currentMonthNum + 1, 0).getDate();
    let addedCount = 0;

    state.recurring.forEach(rec => {
      const dayNum = Math.min(daysInMonth, Math.max(1, rec.day || 1));
      const dayStr = String(dayNum).padStart(2, '0');
      const dateStr = `${currentYear}-${currentMonth}-${dayStr}`;

      // Vérifier si une transaction équivalente a déjà été ajoutée ce mois-ci
      const alreadyExists = state.transactions.some(t => {
        const parts = parseDateParts(t.date);
        return (
          t.description === rec.name &&
          t.type === rec.type &&
          t.amount === rec.amount &&
          parts.year === currentYear &&
          parts.month === currentMonthNum
        );
      });

      if (!alreadyExists) {
        state.transactions.unshift({
          id: generateId(),
          type: rec.type,
          amount: rec.amount,
          accountId: rec.accountId || state.accounts[0]?.id || 'courant',
          category: rec.category,
          description: rec.name,
          date: dateStr,
          createdAt: Date.now()
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      saveTransactionsToStorage();
      updateUI();
      showToast(`⚡ ${addedCount} opération(s) récurrente(s) générée(s) pour ce mois !`);
    } else {
      showToast('Toutes les opérations récurrentes de ce mois ont déjà été appliquées.');
    }
  }

  // ==========================================================================
  // 11. Gestion des Catégories & Sélecteurs
  // ==========================================================================

  function populateCategorySelect(selectElement, type) {
    if (!selectElement) return;
    const list = CATEGORIES[type] || [];
    selectElement.innerHTML = list.map(cat => `<option value="${escapeHtml(cat.label)}">${escapeHtml(cat.label)}</option>`).join('');
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
            <span>${remaining >= 0 ? `Reste : <strong>${formatCurrency(remaining)}</strong>` : `Excès : <strong style="color:var(--expense-color);">${formatCurrency(Math.abs(remaining))}</strong>`}</span>
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

    dom.budgetCategorySelect.innerHTML = CATEGORIES.expense.map(cat => {
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
      const firstAvailable = CATEGORIES.expense.find(cat => state.budgets[cat.label] === undefined);
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

    state.budgets[category] = limit;
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
        const query = state.searchQuery.toLowerCase();
        const descMatch = (tx.description || '').toLowerCase().includes(query);
        const catMatch = (tx.category || '').toLowerCase().includes(query);
        const amountMatch = tx.amount.toString().includes(query);
        const accNameMatch = getAccountName(tx.accountId).toLowerCase().includes(query);
        const targetAccMatch = tx.toAccountId ? getAccountName(tx.toAccountId).toLowerCase().includes(query) : false;
        if (!descMatch && !catMatch && !amountMatch && !accNameMatch && !targetAccMatch) return false;
      }

      return true;
    });
  }

  function renderTransactionsTable() {
    const filtered = getFilteredTransactions();

    if (!dom.transactionsTableBody) return;

    if (filtered.length === 0) {
      dom.transactionsTableBody.innerHTML = '';
      if (dom.emptyState) dom.emptyState.classList.remove('hidden');
      return;
    }

    if (dom.emptyState) dom.emptyState.classList.add('hidden');

    // Tri chronologique : plus récentes d'abord
    filtered.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || 0) - (a.createdAt || 0));

    dom.transactionsTableBody.innerHTML = filtered.map(tx => {
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
          <td class="cell-desc" title="${escapeHtml(tx.description || '')}">${escapeHtml(tx.description || '—')}</td>
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

    renderDonutChart(dom.expenseDonutContainer, expenseByCategory, expenseTotal, EXPENSE_COLORS, 'Dépenses');
    renderDonutChart(dom.incomeDonutContainer, incomeByCategory, incomeTotal, INCOME_COLORS, 'Revenus');

    renderCategoryBreakdown(dom.expenseCategoryBreakdown, expenseByCategory, expenseTotal, EXPENSE_COLORS);
    renderCategoryBreakdown(dom.incomeCategoryBreakdown, incomeByCategory, incomeTotal, INCOME_COLORS);
  }

  function renderDonutChart(container, categoryData, total, colors, title) {
    if (!container) return;

    const entries = Object.entries(categoryData).sort((a, b) => b[1] - a[1]);

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
      const color = colors[idx % colors.length];

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
        <svg class="donut-svg" viewBox="0 0 170 170" aria-label="Graphique ${title}">
          ${segmentsHtml}
        </svg>
      </div>
      <div class="chart-legend-grid">
        ${entries.map(([category, amount], idx) => `
          <div class="legend-item">
            <span class="legend-dot" style="background-color: ${colors[idx % colors.length]}"></span>
            <span class="legend-label">${escapeHtml(category)}</span>
            <span class="legend-value">${formatCurrency(amount)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderCategoryBreakdown(container, categoryData, total, colors) {
    if (!container) return;
    const entries = Object.entries(categoryData).sort((a, b) => b[1] - a[1]);

    if (entries.length === 0 || total === 0) {
      container.innerHTML = `<p class="empty-desc">Aucune donnée.</p>`;
      return;
    }

    container.innerHTML = entries.map(([category, amount], idx) => {
      const ratio = (amount / total) * 100;
      const color = colors[idx % colors.length];

      return `
        <div class="category-row">
          <div class="category-row-header">
            <span class="category-name">${escapeHtml(category)}</span>
            <span class="category-pct">${formatCurrency(amount)} (${ratio.toFixed(1)}%)</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${ratio}%; background-color: ${color};"></div>
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
      dom.editTxCategorySelect.value = tx.category;
    } else if (tx.type === 'transfer') {
      handleEditTypeChange('transfer');
      if (dom.editTxTargetAccountSelect) dom.editTxTargetAccountSelect.value = tx.toAccountId || defaultTarget;
    } else {
      handleEditTypeChange('expense');
      dom.editTxCategorySelect.value = tx.category;
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
    showToast('Export JSON généré avec succès');
  }

  function exportDataAsCSV() {
    if (state.transactions.length === 0) {
      showToast('Aucune transaction à exporter');
      return;
    }

    const headers = ['ID', 'Type', 'Montant', 'Compte', 'Compte_Destination', 'Categorie', 'Description', 'Date'];
    const rows = state.transactions.map(tx => [
      `"${tx.id}"`,
      `"${tx.type}"`,
      tx.amount,
      `"${getAccountName(tx.accountId)}"`,
      `"${tx.toAccountId ? getAccountName(tx.toAccountId) : ''}"`,
      `"${(tx.category || '').replace(/"/g, '""')}"`,
      `"${(tx.description || '').replace(/"/g, '""')}"`,
      `"${tx.date}"`
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
        showToast('Erreur lors de l\'analyse du fichier');
        console.error(err);
      }
      e.target.value = '';
    };

    reader.readAsText(file, 'UTF-8');
  }

  function importJSONContent(jsonString) {
    const parsed = JSON.parse(jsonString);

    if (Array.isArray(parsed)) {
      // Tableau direct de transactions
      state.transactions = parsed.map(tx => ({
        ...tx,
        accountId: tx.accountId || state.accounts[0]?.id || 'courant'
      }));
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.transactions)) {
        state.transactions = parsed.transactions.map(tx => ({
          ...tx,
          accountId: tx.accountId || state.accounts[0]?.id || 'courant'
        }));
      }
      if (parsed.initialBalance !== undefined) {
        state.initialBalance = parseFloat(parsed.initialBalance) || 0;
        saveInitialBalanceToStorage();
      }
      if (parsed.accounts && Array.isArray(parsed.accounts) && parsed.accounts.length > 0) {
        state.accounts = parsed.accounts;
        saveAccountsToStorage();
      }
      if (parsed.budgets && typeof parsed.budgets === 'object') {
        state.budgets = parsed.budgets;
        saveBudgetsToStorage();
      }
      if (parsed.goals && Array.isArray(parsed.goals)) {
        state.goals = parsed.goals;
        saveGoalsToStorage();
      }
      if (parsed.recurring && Array.isArray(parsed.recurring)) {
        state.recurring = parsed.recurring;
        saveRecurringToStorage();
      }
    }

    saveTransactionsToStorage();
    updateUI();
    showToast('Données importées avec succès');
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
        const amount = parseFloat(parts[2]?.replace(',', '.'));
        let accountName = parts[3] || '';
        let targetAccountName = '';
        let category = '';
        let description = '';
        let date = '';

        if (parts.length >= 8) {
          targetAccountName = parts[4] || '';
          category = parts[5] || (type === 'transfer' ? 'Virement interne' : (type === 'income' ? 'Autre revenu' : 'Autre dépense'));
          description = parts[6] || '';
          date = parts[7] || getTodayDateString();
        } else {
          category = parts[4] || (type === 'transfer' ? 'Virement interne' : (type === 'income' ? 'Autre revenu' : 'Autre dépense'));
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
            date,
            createdAt: Date.now() - i * 1000
          };
          if (type === 'transfer') {
            item.toAccountId = toAccountId;
          }
          newTransactions.push(item);
        }
      }
    }

    if (newTransactions.length === 0) {
      showToast('Aucune transaction valide trouvée dans le CSV');
      return;
    }

    state.transactions = [...newTransactions, ...state.transactions];
    saveTransactionsToStorage();
    updateUI();
    showToast(`${newTransactions.length} transaction(s) CSV ajoutée(s) avec succès`);
  }

  function resetAllData() {
    const confirmation = window.confirm('Êtes-vous sûr de vouloir supprimer toutes vos données (transactions, budgets, objectifs, récurrences et comptes) ? Cette action est irréversible.');
    if (!confirmation) return;

    state.initialBalance = 0;
    state.transactions = [];
    state.budgets = {};
    state.goals = [];
    state.recurring = [];
    state.accounts = [...DEFAULT_ACCOUNTS];
    state.filterAccount = 'all';
    state.filterType = 'all';
    state.filterPeriod = 'all';
    state.searchQuery = '';

    if (dom.filterAccountSelect) dom.filterAccountSelect.value = 'all';
    if (dom.filterTypeSelect) dom.filterTypeSelect.value = 'all';
    if (dom.filterPeriodSelect) dom.filterPeriodSelect.value = 'all';
    if (dom.filterSearchInput) dom.filterSearchInput.value = '';

    saveInitialBalanceToStorage();
    saveTransactionsToStorage();
    saveBudgetsToStorage();
    saveGoalsToStorage();
    saveRecurringToStorage();
    saveAccountsToStorage();

    updateUI();
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
          updateUI();
        }
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
          dom.goalDateInput.value
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
          dom.goalTransferAmountInput.value
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
          dom.recDayInput.value
        );
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
        const date = dom.txDateInput.value;

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
          amount,
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
        const date = dom.editTxDateInput.value;

        if (isNaN(amount) || amount <= 0) {
          showToast('Veuillez saisir un montant valide');
          return;
        }

        if (type === 'transfer' && accountId === toAccountId) {
          showToast('Le compte source et le compte de destination doivent être différents.');
          return;
        }

        tx.type = type;
        tx.amount = amount;
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
        updateUI();
      });
    }

    if (dom.filterPeriodSelect) {
      dom.filterPeriodSelect.addEventListener('change', (e) => {
        state.filterPeriod = e.target.value;
        updateUI();
      });
    }

    if (dom.filterTypeSelect) {
      dom.filterTypeSelect.addEventListener('change', (e) => {
        state.filterType = e.target.value;
        updateUI();
      });
    }

    if (dom.filterSearchInput) {
      dom.filterSearchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
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
    // 1. Initialiser le thème
    const savedTheme = loadThemeFromStorage();
    applyTheme(savedTheme);

    // 2. Charger les comptes
    const storedAccounts = loadAccountsFromStorage();
    if (storedAccounts && storedAccounts.length > 0) {
      state.accounts = storedAccounts;
    } else {
      state.accounts = [...DEFAULT_ACCOUNTS];
      saveAccountsToStorage();
    }

    // 3. Charger le solde initial
    const storedBalance = loadInitialBalanceFromStorage();
    if (storedBalance !== null) {
      state.initialBalance = storedBalance;
    } else {
      state.initialBalance = INITIAL_DEMO_DATA.initialBalance;
      saveInitialBalanceToStorage();
    }

    // 4. Charger les transactions
    const storedTxs = loadTransactionsFromStorage();
    if (storedTxs !== null) {
      state.transactions = storedTxs;
    } else {
      state.transactions = [...INITIAL_DEMO_DATA.transactions];
      saveTransactionsToStorage();
    }

    // 5. Charger les budgets
    const storedBudgets = loadBudgetsFromStorage();
    if (storedBudgets !== null) {
      state.budgets = storedBudgets;
    } else {
      state.budgets = { ...INITIAL_DEMO_DATA.budgets };
      saveBudgetsToStorage();
    }

    // 6. Charger les objectifs d'épargne
    const storedGoals = loadGoalsFromStorage();
    if (storedGoals !== null) {
      state.goals = storedGoals;
    } else {
      state.goals = [...DEFAULT_GOALS];
      saveGoalsToStorage();
    }

    // 7. Charger les récurrences
    const storedRecurring = loadRecurringFromStorage();
    if (storedRecurring !== null) {
      state.recurring = storedRecurring;
    } else {
      state.recurring = [...DEFAULT_RECURRING];
      saveRecurringToStorage();
    }

    // 8. Initialiser les sélecteurs et la date du jour
    populateAllCategorySelects();
    if (dom.txDateInput) dom.txDateInput.value = getTodayDateString();

    // 9. Initialiser les écouteurs d'événements
    initEventListeners();

    // 10. Premier rendu de l'interface
    updateUI();

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
