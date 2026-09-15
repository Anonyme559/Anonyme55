/**
 * Budget Manager — Application JavaScript
 * Gestion de budget simple, moderne et 100% locale
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. Constantes & Catégories par défaut
  // ==========================================================================

  const STORAGE_KEY_TRANSACTIONS = 'budget_manager_transactions';
  const STORAGE_KEY_INITIAL_BALANCE = 'budget_manager_initial_balance';

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

  // Données de démonstration initiales si l'utilisateur découvre le site
  const INITIAL_DEMO_DATA = {
    initialBalance: 1200,
    transactions: [
      {
        id: 'tx-demo-1',
        type: 'income',
        amount: 2400.00,
        category: 'Salaire & Rémunération',
        description: 'Salaire mensuel',
        date: getFormattedDateOffset(-5),
        createdAt: Date.now() - 500000
      },
      {
        id: 'tx-demo-2',
        type: 'expense',
        amount: 650.00,
        category: 'Logement & Factures',
        description: 'Loyer et charges',
        date: getFormattedDateOffset(-4),
        createdAt: Date.now() - 400000
      },
      {
        id: 'tx-demo-3',
        type: 'expense',
        amount: 142.50,
        category: 'Alimentation & Courses',
        description: 'Supermarché',
        date: getFormattedDateOffset(-2),
        createdAt: Date.now() - 300000
      },
      {
        id: 'tx-demo-4',
        type: 'expense',
        amount: 45.00,
        category: 'Transport & Carburant',
        description: 'Recharge carte de transport',
        date: getFormattedDateOffset(-1),
        createdAt: Date.now() - 200000
      }
    ]
  };

  // ==========================================================================
  // 2. État de l'application (State)
  // ==========================================================================

  const state = {
    initialBalance: 0,
    transactions: [],
    filterType: 'all',
    searchQuery: ''
  };

  // ==========================================================================
  // 3. Éléments DOM
  // ==========================================================================

  const dom = {
    // Solde actuel
    currentBalanceDisplay: document.getElementById('currentBalanceDisplay'),
    balanceSubtext: document.getElementById('balanceSubtext'),
    quickIncomeDisplay: document.getElementById('quickIncomeDisplay'),
    quickIncomeCount: document.getElementById('quickIncomeCount'),
    quickExpenseDisplay: document.getElementById('quickExpenseDisplay'),
    quickExpenseCount: document.getElementById('quickExpenseCount'),
    toggleInitialBalanceBtn: document.getElementById('toggleInitialBalanceBtn'),
    initialBalanceContainer: document.getElementById('initialBalanceContainer'),
    initialBalanceForm: document.getElementById('initialBalanceForm'),
    initialBalanceInput: document.getElementById('initialBalanceInput'),
    cancelInitialBalanceBtn: document.getElementById('cancelInitialBalanceBtn'),

    // Formulaire d'ajout
    transactionForm: document.getElementById('transactionForm'),
    typeExpenseRadio: document.getElementById('typeExpense'),
    typeIncomeRadio: document.getElementById('typeIncome'),
    labelTypeExpense: document.getElementById('labelTypeExpense'),
    labelTypeIncome: document.getElementById('labelTypeIncome'),
    txAmountInput: document.getElementById('txAmount'),
    txCategorySelect: document.getElementById('txCategory'),
    txDateInput: document.getElementById('txDate'),
    txDescriptionInput: document.getElementById('txDescription'),

    // Liste des transactions
    filterTypeSelect: document.getElementById('filterType'),
    filterSearchInput: document.getElementById('filterSearch'),
    transactionsTableBody: document.getElementById('transactionsTableBody'),
    emptyState: document.getElementById('emptyState'),

    // Statistiques
    statTotalIncome: document.getElementById('statTotalIncome'),
    statIncomeCount: document.getElementById('statIncomeCount'),
    statTotalExpense: document.getElementById('statTotalExpense'),
    statExpenseCount: document.getElementById('statExpenseCount'),
    statAverageExpense: document.getElementById('statAverageExpense'),
    statNetFlow: document.getElementById('statNetFlow'),
    statSavingsRate: document.getElementById('statSavingsRate'),
    expenseCategoryBreakdown: document.getElementById('expenseCategoryBreakdown'),
    incomeCategoryBreakdown: document.getElementById('incomeCategoryBreakdown'),

    // Footer & Actions
    exportDataBtn: document.getElementById('exportDataBtn'),
    resetDataBtn: document.getElementById('resetDataBtn'),

    // Toast
    toast: document.getElementById('toastNotification'),
    toastMessage: document.getElementById('toastMessage'),

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
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  /**
   * Génère un identifiant unique pour une transaction
   * @returns {string}
   */
  function generateId() {
    return 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  }

  // ==========================================================================
  // 5. Gestion de la persistance (LocalStorage)
  // ==========================================================================

  /**
   * Charge les données depuis le localStorage ou initialise avec des données par défaut
   */
  function loadFromStorage() {
    try {
      const savedTransactions = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
      const savedInitialBalance = localStorage.getItem(STORAGE_KEY_INITIAL_BALANCE);

      if (savedTransactions !== null) {
        state.transactions = JSON.parse(savedTransactions) || [];
      } else {
        // Premier chargement : charger des exemples pour permettre une prise en main immédiate
        state.transactions = [...INITIAL_DEMO_DATA.transactions];
        saveTransactionsToStorage();
      }

      if (savedInitialBalance !== null) {
        state.initialBalance = parseFloat(savedInitialBalance) || 0;
      } else {
        state.initialBalance = INITIAL_DEMO_DATA.initialBalance;
        saveInitialBalanceToStorage();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données depuis localStorage:', error);
      state.transactions = [];
      state.initialBalance = 0;
    }
  }

  /**
   * Sauvegarde la liste des transactions dans localStorage
   */
  function saveTransactionsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(state.transactions));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des transactions:', error);
    }
  }

  /**
   * Sauvegarde le solde initial dans localStorage
   */
  function saveInitialBalanceToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_INITIAL_BALANCE, state.initialBalance.toString());
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du solde initial:', error);
    }
  }

  // ==========================================================================
  // 6. Moteur de calcul financier & statistiques
  // ==========================================================================

  /**
   * Calcule les métriques globales et par catégorie
   * @returns {Object}
   */
  function calculateMetrics() {
    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    const expenseByCategory = {};
    const incomeByCategory = {};

    state.transactions.forEach(tx => {
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        totalIncome += amount;
        incomeCount += 1;
        incomeByCategory[tx.category] = (incomeByCategory[tx.category] || 0) + amount;
      } else if (tx.type === 'expense') {
        totalExpense += amount;
        expenseCount += 1;
        expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + amount;
      }
    });

    const netFlow = totalIncome - totalExpense;
    const currentBalance = state.initialBalance + netFlow;
    const averageExpense = expenseCount > 0 ? totalExpense / expenseCount : 0;

    return {
      initialBalance: state.initialBalance,
      currentBalance,
      totalIncome,
      totalExpense,
      incomeCount,
      expenseCount,
      netFlow,
      averageExpense,
      expenseByCategory,
      incomeByCategory
    };
  }

  // ==========================================================================
  // 7. Rendu visuel de l'interface utilisateur
  // ==========================================================================

  /**
   * Met à jour toutes les sections de la page
   */
  function updateUI() {
    const metrics = calculateMetrics();
    renderBalance(metrics);
    renderTransactionsTable();
    renderStatistics(metrics);
  }

  /**
   * Met à jour la section Solde actuel
   * @param {Object} metrics
   */
  function renderBalance(metrics) {
    // Solde total disponible
    dom.currentBalanceDisplay.textContent = formatCurrency(metrics.currentBalance);

    // Classes de couleur
    dom.currentBalanceDisplay.classList.remove('neutral', 'positive', 'negative');
    if (metrics.currentBalance > 0) {
      dom.currentBalanceDisplay.classList.add('positive');
    } else if (metrics.currentBalance < 0) {
      dom.currentBalanceDisplay.classList.add('negative');
    } else {
      dom.currentBalanceDisplay.classList.add('neutral');
    }

    // Solde initial
    dom.balanceSubtext.textContent = `Solde initial : ${formatCurrency(metrics.initialBalance)}`;
    if (dom.initialBalanceInput) {
      dom.initialBalanceInput.value = metrics.initialBalance > 0 ? metrics.initialBalance : '';
    }

    // Récapitulatif rapide
    dom.quickIncomeDisplay.textContent = `+${formatCurrency(metrics.totalIncome)}`;
    dom.quickIncomeCount.textContent = `${metrics.incomeCount} opération(s)`;

    dom.quickExpenseDisplay.textContent = `-${formatCurrency(metrics.totalExpense)}`;
    dom.quickExpenseCount.textContent = `${metrics.expenseCount} opération(s)`;
  }

  /**
   * Met à jour la liste des transactions dans le tableau
   */
  function renderTransactionsTable() {
    // 1. Filtrage
    let list = [...state.transactions];

    if (state.filterType !== 'all') {
      list = list.filter(tx => tx.type === state.filterType);
    }

    if (state.searchQuery.trim() !== '') {
      const q = state.searchQuery.toLowerCase().trim();
      list = list.filter(tx => {
        const descMatch = tx.description ? tx.description.toLowerCase().includes(q) : false;
        const catMatch = tx.category ? tx.category.toLowerCase().includes(q) : false;
        const amountMatch = tx.amount.toString().includes(q);
        return descMatch || catMatch || amountMatch;
      });
    }

    // 2. Tri automatique : les plus récentes en premier (Date décroissante, puis createdAt décroissant)
    list.sort((a, b) => {
      const dateComparison = b.date.localeCompare(a.date);
      if (dateComparison !== 0) return dateComparison;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    // 3. Affichage du tableau ou de l'état vide
    if (list.length === 0) {
      dom.transactionsTableBody.innerHTML = '';
      dom.emptyState.classList.remove('hidden');
      return;
    }

    dom.emptyState.classList.add('hidden');

    // 4. Génération des lignes du tableau
    const rowsHtml = list.map(tx => {
      const isIncome = tx.type === 'income';
      const typeBadge = isIncome
        ? `<span class="badge badge-income">Revenu</span>`
        : `<span class="badge badge-expense">Dépense</span>`;

      const formattedAmount = isIncome
        ? `+${formatCurrency(tx.amount)}`
        : `-${formatCurrency(tx.amount)}`;

      const amountClass = isIncome ? 'income' : 'expense';
      const desc = tx.description ? escapeHtml(tx.description) : '<span style="color:var(--text-muted); font-style:italic;">Aucune</span>';

      return `
        <tr data-id="${escapeHtml(tx.id)}">
          <td>${typeBadge}</td>
          <td class="cell-amount ${amountClass}">${formattedAmount}</td>
          <td class="cell-category">${escapeHtml(tx.category)}</td>
          <td class="cell-desc" title="${tx.description ? escapeHtml(tx.description) : ''}">${desc}</td>
          <td class="cell-date">${formatDateFr(tx.date)}</td>
          <td class="text-right">
            <button type="button" class="btn-danger-icon delete-btn" data-id="${escapeHtml(tx.id)}" title="Supprimer la transaction" aria-label="Supprimer la transaction">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    dom.transactionsTableBody.innerHTML = rowsHtml;
  }

  /**
   * Met à jour la section des statistiques et la répartition par catégorie
   * @param {Object} metrics
   */
  function renderStatistics(metrics) {
    dom.statTotalIncome.textContent = `+${formatCurrency(metrics.totalIncome)}`;
    dom.statIncomeCount.textContent = `${metrics.incomeCount} transaction(s)`;

    dom.statTotalExpense.textContent = `-${formatCurrency(metrics.totalExpense)}`;
    dom.statExpenseCount.textContent = `${metrics.expenseCount} transaction(s)`;

    dom.statAverageExpense.textContent = formatCurrency(metrics.averageExpense);

    // Solde net
    const netPrefix = metrics.netFlow > 0 ? '+' : '';
    dom.statNetFlow.textContent = `${netPrefix}${formatCurrency(metrics.netFlow)}`;
    if (metrics.netFlow > 0) {
      dom.statNetFlow.className = 'stat-value income-text';
    } else if (metrics.netFlow < 0) {
      dom.statNetFlow.className = 'stat-value expense-text';
    } else {
      dom.statNetFlow.className = 'stat-value';
    }

    // Taux d'épargne ou note
    if (metrics.totalIncome > 0) {
      const rate = Math.round((metrics.netFlow / metrics.totalIncome) * 100);
      dom.statSavingsRate.textContent = `Taux d'épargne : ${rate}%`;
    } else {
      dom.statSavingsRate.textContent = 'Revenus – Dépenses';
    }

    // Répartition des dépenses par catégorie
    renderCategoryBars(
      dom.expenseCategoryBreakdown,
      metrics.expenseByCategory,
      metrics.totalExpense,
      'expense-fill',
      'Aucune dépense enregistrée pour le moment.'
    );

    // Répartition des revenus par catégorie
    renderCategoryBars(
      dom.incomeCategoryBreakdown,
      metrics.incomeByCategory,
      metrics.totalIncome,
      'income-fill',
      'Aucun revenu enregistré pour le moment.'
    );
  }

  /**
   * Génère les barres de progression pour la répartition par catégorie
   * @param {HTMLElement} container
   * @param {Object} categoriesData
   * @param {number} totalAmount
   * @param {string} fillClass
   * @param {string} emptyText
   */
  function renderCategoryBars(container, categoriesData, totalAmount, fillClass, emptyText) {
    const entries = Object.entries(categoriesData);

    if (entries.length === 0 || totalAmount <= 0) {
      container.innerHTML = `<p class="category-empty-note">${emptyText}</p>`;
      return;
    }

    // Trier les catégories par montant décroissant
    entries.sort((a, b) => b[1] - a[1]);

    const barsHtml = entries.map(([categoryName, amount]) => {
      const percentage = Math.round((amount / totalAmount) * 100);
      return `
        <div class="category-bar-item">
          <div class="category-bar-header">
            <span class="category-bar-name">${escapeHtml(categoryName)}</span>
            <span class="category-bar-val">${formatCurrency(amount)} (${percentage}%)</span>
          </div>
          <div class="category-bar-track">
            <div class="category-bar-fill ${fillClass}" style="width: ${percentage}%;"></div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = barsHtml;
  }

  /**
   * Met à jour le menu déroulant des catégories selon le type choisi
   * @param {string} type - 'expense' | 'income'
   */
  function populateCategorySelect(type) {
    const categoriesList = CATEGORIES[type] || CATEGORIES.expense;
    dom.txCategorySelect.innerHTML = categoriesList
      .map(cat => `<option value="${escapeHtml(cat.label)}">${escapeHtml(cat.label)}</option>`)
      .join('');
  }

  /**
   * Échappement HTML sécurisé
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================================================
  // 8. Notifications Toast
  // ==========================================================================

  /**
   * Affiche une notification toast discrète
   * @param {string} message
   */
  function showToast(message) {
    if (!dom.toast || !dom.toastMessage) return;

    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
    }

    dom.toastMessage.textContent = message;
    dom.toast.classList.remove('hidden');

    toastTimeoutId = setTimeout(() => {
      dom.toast.classList.add('hidden');
      toastTimeoutId = null;
    }, 3200);
  }

  // ==========================================================================
  // 9. Opérations Métier (Ajout, Suppression, Solde initial, Export, Reset)
  // ==========================================================================

  /**
   * Ajoute une nouvelle transaction
   * @param {Object} txData
   */
  function addTransaction(txData) {
    const newTx = {
      id: generateId(),
      type: txData.type,
      amount: parseFloat(txData.amount),
      category: txData.category,
      description: txData.description ? txData.description.trim() : '',
      date: txData.date || getTodayDateString(),
      createdAt: Date.now()
    };

    state.transactions.unshift(newTx);
    saveTransactionsToStorage();
    updateUI();
    showToast('Transaction ajoutée avec succès');
  }

  /**
   * Supprime une transaction par son ID
   * @param {string} id
   */
  function deleteTransaction(id) {
    const index = state.transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      state.transactions.splice(index, 1);
      saveTransactionsToStorage();
      updateUI();
      showToast('Transaction supprimée');
    }
  }

  /**
   * Modifie le solde initial
   * @param {number} newBalance
   */
  function setInitialBalance(newBalance) {
    state.initialBalance = Math.max(0, parseFloat(newBalance) || 0);
    saveInitialBalanceToStorage();
    updateUI();
    showToast('Argent disponible de départ mis à jour');
  }

  /**
   * Exporte l'ensemble des données au format JSON
   */
  function exportDataAsJSON() {
    const metrics = calculateMetrics();
    const exportPayload = {
      appName: 'Budget Manager',
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      summary: {
        initialBalance: metrics.initialBalance,
        currentBalance: metrics.currentBalance,
        totalIncome: metrics.totalIncome,
        totalExpense: metrics.totalExpense,
        netFlow: metrics.netFlow,
        totalTransactions: state.transactions.length
      },
      transactions: state.transactions
    };

    const jsonString = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    const todayStr = getTodayDateString();
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `budget-manager-export-${todayStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Données exportées au format JSON');
  }

  /**
   * Réinitialise toutes les données de l'application
   */
  function resetAllData() {
    const confirmation = window.confirm('Êtes-vous sûr de vouloir supprimer toutes vos transactions et réinitialiser votre solde ? Cette action est irréversible.');
    if (!confirmation) return;

    state.initialBalance = 0;
    state.transactions = [];
    saveInitialBalanceToStorage();
    saveTransactionsToStorage();
    updateUI();
    showToast('Toutes les données ont été réinitialisées');
  }

  // ==========================================================================
  // 10. Initialisation des écouteurs d'événements
  // ==========================================================================

  function initEventListeners() {
    // 1. Changement de type (Dépense / Revenu)
    const handleTypeChange = (selectedType) => {
      if (selectedType === 'income') {
        dom.labelTypeIncome.classList.add('active');
        dom.labelTypeExpense.classList.remove('active');
        dom.typeIncomeRadio.checked = true;
      } else {
        dom.labelTypeExpense.classList.add('active');
        dom.labelTypeIncome.classList.remove('active');
        dom.typeExpenseRadio.checked = true;
      }
      populateCategorySelect(selectedType);
    };

    dom.typeExpenseRadio.addEventListener('change', () => handleTypeChange('expense'));
    dom.typeIncomeRadio.addEventListener('change', () => handleTypeChange('income'));

    // 2. Soumission du formulaire d'ajout de transaction
    dom.transactionForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const type = dom.typeExpenseRadio.checked ? 'expense' : 'income';
      const amount = parseFloat(dom.txAmountInput.value);
      const category = dom.txCategorySelect.value;
      const description = dom.txDescriptionInput.value;
      const date = dom.txDateInput.value;

      if (!amount || amount <= 0 || isNaN(amount)) {
        alert('Veuillez renseigner un montant valide supérieur à 0.');
        dom.txAmountInput.focus();
        return;
      }

      if (!date) {
        alert('Veuillez sélectionner une date.');
        dom.txDateInput.focus();
        return;
      }

      addTransaction({
        type,
        amount,
        category,
        description,
        date
      });

      // Réinitialisation du formulaire en conservant la date du jour
      dom.txAmountInput.value = '';
      dom.txDescriptionInput.value = '';
      dom.txDateInput.value = getTodayDateString();
      dom.txAmountInput.focus();
    });

    // 3. Suppression de transaction via délégation d'événements
    dom.transactionsTableBody.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.delete-btn');
      if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-id');
        if (id) {
          deleteTransaction(id);
        }
      }
    });

    // 4. Gestion du solde initial
    dom.toggleInitialBalanceBtn.addEventListener('click', () => {
      dom.initialBalanceContainer.classList.toggle('hidden');
      if (!dom.initialBalanceContainer.classList.contains('hidden')) {
        dom.initialBalanceInput.focus();
      }
    });

    dom.cancelInitialBalanceBtn.addEventListener('click', () => {
      dom.initialBalanceContainer.classList.add('hidden');
    });

    dom.initialBalanceForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = parseFloat(dom.initialBalanceInput.value) || 0;
      setInitialBalance(val);
      dom.initialBalanceContainer.classList.add('hidden');
    });

    // 5. Filtres et recherche
    dom.filterTypeSelect.addEventListener('change', (e) => {
      state.filterType = e.target.value;
      renderTransactionsTable();
    });

    dom.filterSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderTransactionsTable();
    });

    // 6. Export JSON & Reset
    dom.exportDataBtn.addEventListener('click', exportDataAsJSON);
    dom.resetDataBtn.addEventListener('click', resetAllData);

    // 7. Navigation fluide et mise en surbrillance des liens
    dom.navLinks.forEach(link => {
      link.addEventListener('click', function (e) {
        dom.navLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
      });
    });

    // IntersectionObserver pour mettre à jour la navigation active au scroll
    if ('IntersectionObserver' in window) {
      const sections = document.querySelectorAll('section[id]');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const currentId = entry.target.getAttribute('id');
            dom.navLinks.forEach(link => {
              const href = link.getAttribute('href');
              if (href === `#${currentId}`) {
                link.classList.add('active');
              } else if (href && href.startsWith('#')) {
                link.classList.remove('active');
              }
            });
          }
        });
      }, { threshold: 0.3 });

      sections.forEach(section => observer.observe(section));
    }
  }

  // ==========================================================================
  // 11. Démarrage de l'application
  // ==========================================================================

  function initApp() {
    // 1. Initialiser le champ date avec aujourd'hui
    if (dom.txDateInput) {
      dom.txDateInput.value = getTodayDateString();
    }

    // 2. Charger les catégories par défaut pour les dépenses
    populateCategorySelect('expense');

    // 3. Charger les données persistées
    loadFromStorage();

    // 4. Mettre à jour l'interface
    updateUI();

    // 5. Initialiser les écouteurs d'événements
    initEventListeners();
  }

  // Exécution au chargement du DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
