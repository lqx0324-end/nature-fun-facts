const App = {
  currentPage: 'home',
  currentDailyFact: null,

  init() {
    this.bindNav();
    this.bindSettings();
    this.loadDailyFact();

    const hash = window.location.hash.slice(1) || 'home';
    this.navigateTo(hash);
  },

  bindNav() {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.slice(1) || 'home';
      this.navigateTo(hash);
    });

    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        window.location.hash = page;
      });
    });
  },

  navigateTo(page) {
    this.currentPage = page;

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`page-${page}`);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    if (page === 'home') this.loadDailyFact();
    if (page === 'explore') this.loadExplore();
    if (page === 'favorites') this.loadFavorites();
  },

  async loadDailyFact() {
    const container = document.getElementById('daily-card-container');
    if (container.querySelector('.flip-card')) return;

    const fact = await AI.getDailyFact();
    if (!fact) return;
    this.currentDailyFact = fact;

    const card = Card.createCard(fact);
    const nextBtn = card.querySelector('[data-action="next"]');
    if (nextBtn) {
      nextBtn.addEventListener('click', async function handler() {
        nextBtn.disabled = true;
        nextBtn.querySelector('span').textContent = '生成中...';
        const newFact = await AI.getNewFact();
        if (newFact) {
          container.innerHTML = '';
          const newCard = Card.createCard(newFact);
          const newNextBtn = newCard.querySelector('[data-action="next"]');
          if (newNextBtn) {
            newNextBtn.addEventListener('click', handler);
          }
          container.appendChild(newCard);
        }
        nextBtn.disabled = false;
      });
    }

    container.appendChild(card);
  },

  async loadExplore() {
    const container = document.getElementById('explore-cards-container');
    const filtersContainer = document.getElementById('category-filters');

    if (filtersContainer.children.length > 0) return;

    const facts = await AI.loadFacts();

    const categories = ['全部', ...new Set(facts.map(f => f.category))];
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn' + (cat === '全部' ? ' active' : '');
      btn.textContent = cat;
      btn.addEventListener('click', () => {
        filtersContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filterExplore(cat);
      });
      filtersContainer.appendChild(btn);
    });

    this.renderExploreCards(facts);
  },

  renderExploreCards(facts) {
    const container = document.getElementById('explore-cards-container');
    container.innerHTML = '';
    facts.forEach(fact => {
      const card = Card.createCard(fact, { compact: true });
      container.appendChild(card);
    });
  },

  filterExplore(category) {
    AI.loadFacts().then(facts => {
      const filtered = category === '全部'
        ? facts
        : facts.filter(f => f.category === category);
      this.renderExploreCards(filtered);
    });
  },

  async loadFavorites() {
    const container = document.getElementById('favorites-cards-container');
    const emptyState = document.getElementById('favorites-empty');
    container.innerHTML = '';

    const favoriteIds = Storage.getFavorites();
    if (favoriteIds.length === 0) {
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    const allFacts = await AI.loadFacts();
    const favoriteFacts = favoriteIds
      .map(id => allFacts.find(f => f.id === id))
      .filter(Boolean);

    if (favoriteFacts.length === 0) {
      emptyState.style.display = 'block';
      return;
    }

    favoriteFacts.forEach(fact => {
      const card = Card.createFavoriteCard(fact);
      container.appendChild(card);
    });
  },

  bindSettings() {
    const modal = document.getElementById('settings-modal');
    const btn = document.getElementById('settings-btn');
    const closeBtn = document.getElementById('settings-close');
    const saveBtn = document.getElementById('settings-save');
    const providerSelect = document.getElementById('api-provider');
    const keyInput = document.getElementById('api-key');

    btn.addEventListener('click', () => {
      providerSelect.value = Storage.getApiProvider();
      keyInput.value = Storage.getApiKey();
      modal.style.display = 'flex';
    });

    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });

    saveBtn.addEventListener('click', () => {
      Storage.saveSettings({
        apiProvider: providerSelect.value,
        apiKey: keyInput.value.trim(),
      });
      modal.style.display = 'none';
    });
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
