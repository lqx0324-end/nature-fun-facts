const Card = {
  categoryColors: {
    '动物': 'var(--category-animal)',
    '植物': 'var(--category-plant)',
    '共生关系': 'var(--category-symbiosis)',
    '极端生存': 'var(--category-extreme)',
  },

  createCard(fact, options = {}) {
    const { showActions = true, compact = false } = options;
    const isFav = Storage.isFavorite(fact.id);
    const catColor = this.categoryColors[fact.category] || 'var(--color-brown)';

    const card = document.createElement('div');
    card.className = 'flip-card' + (compact ? ' flip-card--compact' : '');
    card.dataset.factId = fact.id;

    card.innerHTML = `
      <div class="flip-card-inner">
        <div class="flip-card-front" style="border-top: 4px solid ${catColor}">
          <span class="card-category" style="background: ${catColor}">${fact.category}</span>
          <p class="card-question">${fact.question}</p>
          <p class="card-hint">点击翻转查看答案</p>
        </div>
        <div class="flip-card-back" style="border-top: 4px solid ${catColor}">
          <span class="card-category" style="background: ${catColor}">${fact.category}</span>
          <h3 class="card-answer">${fact.answer}</h3>
          <p class="card-explanation">${fact.explanation}</p>
          ${showActions ? `
          <div class="card-actions">
            <button class="btn-fav ${isFav ? 'btn-fav--active' : ''}" data-action="fav">
              <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/></svg>
              <span>${isFav ? '已收藏' : '收藏'}</span>
            </button>
            <button class="btn-next" data-action="next">
              <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" fill="currentColor"/></svg>
              <span>换一个</span>
            </button>
          </div>` : ''}
        </div>
      </div>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-action]')) return;
      card.classList.toggle('flipped');
    });

    const favBtn = card.querySelector('[data-action="fav"]');
    if (favBtn) {
      favBtn.addEventListener('click', () => {
        const id = card.dataset.factId;
        if (Storage.isFavorite(id)) {
          Storage.removeFavorite(id);
          favBtn.classList.remove('btn-fav--active');
          favBtn.querySelector('span').textContent = '收藏';
        } else {
          Storage.addFavorite(id);
          favBtn.classList.add('btn-fav--active');
          favBtn.querySelector('span').textContent = '已收藏';
        }
      });
    }

    return card;
  },

  createFavoriteCard(fact) {
    const isFav = Storage.isFavorite(fact.id);
    const catColor = this.categoryColors[fact.category] || 'var(--color-brown)';

    const card = document.createElement('div');
    card.className = 'flip-card flipped flip-card--compact';
    card.dataset.factId = fact.id;

    card.innerHTML = `
      <div class="flip-card-inner">
        <div class="flip-card-front" style="border-top: 4px solid ${catColor}">
          <span class="card-category" style="background: ${catColor}">${fact.category}</span>
          <p class="card-question">${fact.question}</p>
          <p class="card-hint">点击翻转查看答案</p>
        </div>
        <div class="flip-card-back" style="border-top: 4px solid ${catColor}">
          <span class="card-category" style="background: ${catColor}">${fact.category}</span>
          <h3 class="card-answer">${fact.answer}</h3>
          <p class="card-explanation">${fact.explanation}</p>
          <div class="card-actions">
            <button class="btn-fav btn-fav--active" data-action="fav">
              <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/></svg>
              <span>已收藏</span>
            </button>
          </div>
        </div>
      </div>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-action]')) return;
      card.classList.toggle('flipped');
    });

    const favBtn = card.querySelector('[data-action="fav"]');
    if (favBtn) {
      favBtn.addEventListener('click', () => {
        const id = card.dataset.factId;
        Storage.removeFavorite(id);
        card.style.transition = 'opacity 0.3s, transform 0.3s';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        setTimeout(() => card.remove(), 300);
        setTimeout(() => {
          const container = document.getElementById('favorites-cards-container');
          if (container && container.children.length === 0) {
            document.getElementById('favorites-empty').style.display = 'block';
          }
        }, 350);
      });
    }

    return card;
  },
};
