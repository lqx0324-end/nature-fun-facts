const App = {
  _currentPage: null,
  _exploreCategory: 'all',
  _exploreSearch: '',
  _exploreFacts: null,

  async init() {
    await AI.loadFacts();
    Router.init();
  },

  toast(message, duration = 2000) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), duration);
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
        <div id="daily-card-container">
          <div class="loading-spinner">加载中</div>
        </div>
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

    container.innerHTML = '';
    const card = Card.createCard(fact, { onShare: () => this._shareFact(fact) });
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
            const newCard = Card.createCard(newFact, { onShare: () => App._shareFact(newFact) });
            const newNextBtn = newCard.querySelector('[data-action="next"]');
            if (newNextBtn) {
              newNextBtn.addEventListener('click', handler);
            }
            container.appendChild(newCard);
          }
        } finally {
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
    this._exploreCategory = 'all';
    this._exploreSearch = '';
    this._exploreFacts = null;

    const container = document.getElementById('page-container');
    container.innerHTML = `
      <div class="page active" id="page-explore">
        <div class="page-header">
          <h1>🔍 探索自然</h1>
          <p class="subtitle">发现更多令人惊叹的冷知识</p>
        </div>
        <div class="search-bar" id="search-bar">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/></svg>
          <input type="text" id="search-input" placeholder="搜索问题、答案..." autocomplete="off">
          <button class="search-clear" id="search-clear" style="display:none">&times;</button>
        </div>
        <div class="category-filters" id="category-filters">
          <button class="filter-btn active" data-category="all">全部</button>
          <button class="filter-btn" data-category="动物">动物</button>
          <button class="filter-btn" data-category="植物">植物</button>
          <button class="filter-btn" data-category="共生关系">共生关系</button>
          <button class="filter-btn" data-category="极端生存">极端生存</button>
        </div>
        <div id="explore-empty" class="empty-state" style="display:none">
          <p>没有找到匹配的冷知识</p>
          <p class="hint">换个关键词试试</p>
        </div>
        <div class="cards-grid" id="explore-cards-container">
          <div class="loading-spinner">加载中</div>
        </div>
      </div>
    `;
    this._loadExploreCards();
    this._bindSearch();
    this._bindFilters();
  },

  async _loadExploreCards() {
    const container = document.getElementById('explore-cards-container');
    if (!container) return;

    this._exploreFacts = await AI.loadFacts();
    this._filterAndRenderExplore();
  },

  _filterAndRenderExplore() {
    const container = document.getElementById('explore-cards-container');
    const emptyState = document.getElementById('explore-empty');
    if (!container) return;

    let filtered = this._exploreFacts;

    if (this._exploreCategory !== 'all') {
      filtered = filtered.filter(f => f.category === this._exploreCategory);
    }

    if (this._exploreSearch) {
      const term = this._exploreSearch.toLowerCase();
      filtered = filtered.filter(f =>
        f.question.toLowerCase().includes(term) ||
        f.answer.toLowerCase().includes(term) ||
        f.explanation.toLowerCase().includes(term)
      );
    }

    container.innerHTML = '';
    if (filtered.length === 0) {
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
      filtered.forEach(fact => {
        const card = Card.createCard(fact, { compact: true, onShare: () => this._shareFact(fact) });
        container.appendChild(card);
      });
    }
  },

  _bindSearch() {
    const input = document.getElementById('search-input');
    const clearBtn = document.getElementById('search-clear');
    if (!input) return;

    input.addEventListener('input', () => {
      this._exploreSearch = input.value.trim();
      clearBtn.style.display = this._exploreSearch ? 'flex' : 'none';
      this._filterAndRenderExplore();
    });

    clearBtn.addEventListener('click', () => {
      input.value = '';
      this._exploreSearch = '';
      clearBtn.style.display = 'none';
      this._filterAndRenderExplore();
      input.focus();
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

      this._exploreCategory = btn.dataset.category;
      this._filterAndRenderExplore();
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
        <div class="cards-grid" id="favorites-cards-container">
          <div class="loading-spinner">加载中</div>
        </div>
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

    container.innerHTML = '';

    if (favoriteFacts.length === 0) {
      emptyState.style.display = 'block';
      return;
    }

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
      this.toast('设置已保存');
    });
  },

  async renderQuiz() {
    const container = document.getElementById('page-container');
    const bestScore = Storage.getBestQuizScore();

    container.innerHTML = `
      <div class="page active" id="page-quiz">
        <div class="page-header">
          <h1>⚡ 知识挑战</h1>
          <p class="subtitle">测试你的自然冷知识储备！</p>
        </div>
        <div class="quiz-start-card">
          <div class="quiz-start-icon">⚡</div>
          <p class="quiz-start-desc">每轮 ${Quiz.QUESTIONS_PER_ROUND} 道题，看看你能答对几个？</p>
          ${bestScore > 0 ? `<p class="quiz-best-score">最佳成绩：${bestScore}/${Quiz.QUESTIONS_PER_ROUND}</p>` : ''}
          <button class="btn btn-primary" id="quiz-start-btn">开始挑战</button>
        </div>
      </div>
    `;

    document.getElementById('quiz-start-btn').addEventListener('click', async () => {
      const facts = await AI.loadFacts();
      if (facts.length < 4) {
        this.toast('题目数量不足，暂时无法挑战');
        return;
      }
      Quiz.start(facts);
    });
  },

  _shareFact(fact) {
    const text = `🌿 自然冷知识\n\n❓ ${fact.question}\n💡 ${fact.answer}\n📖 ${fact.explanation}`;
    if (navigator.share) {
      navigator.share({ title: '自然冷知识', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        this.toast('已复制到剪贴板');
      }).catch(() => {
        this.toast('分享失败');
      });
    }
  },
};
