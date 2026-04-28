const App = {
  _currentPage: null,

  async init() {
    await AI.loadFacts();
    Router.init();
  },

  // === 页面渲染 ===

  renderHome() {
    const container = document.getElementById('page-container');
    container.innerHTML = `
      <div class="page active" id="page-home">
        <div class="page-header">
          <h1>🌿 自然冷知识</h1>
          <p class="subtitle">每天一个神奇的自然奥秘</p>
        </div>
        <div id="daily-card-container"></div>
      </div>
    `;
    this._loadDailyCard();
  },

  async _loadDailyCard() {
    const container = document.getElementById('daily-card-container');
    if (!container) return;

    const fact = await AI.getDailyFact();
    if (!fact) {
      container.innerHTML = '<div class="empty-state"><p>暂无数据</p></div>';
      return;
    }

    const card = Card.createCard(fact);
    const nextBtn = card.querySelector('[data-action="next"]');
    if (nextBtn) {
      nextBtn.addEventListener('click', async function handler() {
        const btn = this;
        btn.disabled = true;
        btn.querySelector('span').textContent = '生成中...';
        try {
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
        } finally {
          // Button may have been removed from DOM, check first
          if (btn.isConnected) {
            btn.disabled = false;
            btn.querySelector('span').textContent = '换一个';
          }
        }
      });
    }
    container.appendChild(card);
  },

  renderExplore() {
    const container = document.getElementById('page-container');
    container.innerHTML = `
      <div class="page active" id="page-explore">
        <div class="page-header">
          <h1>🔍 探索自然</h1>
          <p class="subtitle">发现更多令人惊叹的冷知识</p>
        </div>
        <div class="category-filters" id="category-filters">
          <button class="filter-btn active" data-category="all">全部</button>
          <button class="filter-btn" data-category="动物">动物</button>
          <button class="filter-btn" data-category="植物">植物</button>
          <button class="filter-btn" data-category="共生关系">共生关系</button>
          <button class="filter-btn" data-category="极端生存">极端生存</button>
        </div>
        <div class="cards-grid" id="explore-cards-container"></div>
      </div>
    `;
    this._loadExploreCards('all');
    this._bindFilters();
  },

  async _loadExploreCards(category) {
    const container = document.getElementById('explore-cards-container');
    if (!container) return;

    const facts = await AI.loadFacts();
    const filtered = category === 'all' ? facts : facts.filter(f => f.category === category);

    container.innerHTML = '';
    filtered.forEach(fact => {
      const card = Card.createCard(fact, { compact: true });
      container.appendChild(card);
    });
  },

  _bindFilters() {
    const filters = document.getElementById('category-filters');
    if (!filters) return;

    filters.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      filters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      this._loadExploreCards(btn.dataset.category);
    });
  },

  async renderFavorites() {
    const container = document.getElementById('page-container');
    container.innerHTML = `
      <div class="page active" id="page-favorites">
        <div class="page-header">
          <h1>❤️ 我的收藏</h1>
          <p class="subtitle">你收藏的自然冷知识</p>
        </div>
        <div id="favorites-empty" class="empty-state" style="display:none">
          <p>还没有收藏</p>
          <p class="hint">点击卡片上的收藏按钮来添加</p>
        </div>
        <div class="cards-grid" id="favorites-cards-container"></div>
      </div>
    `;
    await this._loadFavoriteCards();
  },

  async _loadFavoriteCards() {
    const container = document.getElementById('favorites-cards-container');
    const emptyState = document.getElementById('favorites-empty');
    if (!container) return;

    const favoriteIds = Storage.getFavorites();
    const facts = await AI.loadFacts();

    const favoriteFacts = facts.filter(f => favoriteIds.includes(f.id));

    if (favoriteFacts.length === 0) {
      emptyState.style.display = 'block';
      return;
    }

    container.innerHTML = '';
    favoriteFacts.forEach(fact => {
      const card = Card.createFavoriteCard(fact);
      container.appendChild(card);
    });
  },

  renderSettings() {
    const container = document.getElementById('page-container');
    const settings = Storage.getSettings();

    container.innerHTML = `
      <div class="page active" id="page-settings">
        <div class="page-header">
          <h1>⚙️ 设置</h1>
          <p class="subtitle">配置 AI 生成功能</p>
        </div>
        <div class="settings-form">
          <div class="form-group">
            <label>AI 服务商</label>
            <select id="api-provider">
              <option value="openai" ${settings.apiProvider === 'openai' ? 'selected' : ''}>OpenAI</option>
              <option value="gemini" ${settings.apiProvider === 'gemini' ? 'selected' : ''}>Google Gemini</option>
            </select>
          </div>
          <div class="form-group">
            <label>API Key</label>
            <input type="password" id="api-key" placeholder="输入你的 API Key" value="${settings.apiKey || ''}">
          </div>
          <button class="btn btn-primary" id="save-settings">保存设置</button>
          <p class="settings-hint">配置后可使用 AI 生成新的冷知识</p>
        </div>
      </div>
    `;

    document.getElementById('save-settings').addEventListener('click', () => {
      const provider = document.getElementById('api-provider').value;
      const apiKey = document.getElementById('api-key').value.trim();
      Storage.saveSettings({ apiProvider: provider, apiKey });
      alert('设置已保存！');
    });
  },
};