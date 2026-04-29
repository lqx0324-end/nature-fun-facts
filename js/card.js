const Card = {
  categoryColors: {
    '动物': 'var(--category-animal)',
    '植物': 'var(--category-plant)',
    '共生关系': 'var(--category-symbiosis)',
    '极端生存': 'var(--category-extreme)',
  },

  createCard(fact, options = {}) {
    const { showActions = true, compact = false, onShare } = options;
    const isFav = Storage.isFavorite(fact.id);
    const catColor = this.categoryColors[fact.category] || 'var(--color-primary)';

    const card = document.createElement('div');
    card.className = 'flip-card' + (compact ? ' flip-card--compact' : '');
    card.dataset.factId = fact.id;

    card.innerHTML = `
      <div class="flip-card-inner">
        <div class="flip-card-front">
          <span class="card-category" style="background: ${catColor}">${fact.category}</span>
          <div class="card-image-container" data-fact-id="${fact.id}">
            <div class="card-image-placeholder">
              <svg viewBox="0 0 24 24" width="32" height="32"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="currentColor" opacity="0.3"/></svg>
            </div>
          </div>
          <p class="card-question">${fact.question}</p>
          <p class="card-hint">点击翻转查看答案</p>
        </div>
        <div class="flip-card-back">
          <span class="card-category" style="background: ${catColor}">${fact.category}</span>
          <div class="card-image-container" data-fact-id="${fact.id}"></div>
          <h3 class="card-answer">${fact.answer}</h3>
          <p class="card-explanation">${fact.explanation}</p>
          ${showActions ? `
          <div class="card-actions">
            <button class="btn-fav ${isFav ? 'btn-fav--active' : ''}" data-action="fav">
              <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/></svg>
              <span>${isFav ? '已收藏' : '收藏'}</span>
            </button>
            ${onShare ? `
            <button class="btn-fav" data-action="share">
              <svg viewBox="0 0 24 24" width="20" height="20"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" fill="currentColor"/></svg>
              <span>分享</span>
            </button>` : ''}
            <button class="btn-next" data-action="next">
              <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" fill="currentColor"/></svg>
              <span>换一个</span>
            </button>
          </div>` : ''}
        </div>
      </div>
    `;

    this._loadImage(card, fact);

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

    const shareBtn = card.querySelector('[data-action="share"]');
    if (shareBtn && onShare) {
      shareBtn.addEventListener('click', () => onShare());
    }

    return card;
  },

  createFavoriteCard(fact) {
    const card = this.createCard(fact, { compact: true, showActions: true });
    card.classList.add('flipped');

    const favBtn = card.querySelector('[data-action="fav"]');
    if (favBtn) {
      const newFavBtn = favBtn.cloneNode(true);
      favBtn.replaceWith(newFavBtn);
      newFavBtn.addEventListener('click', () => {
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

  async _loadImage(card, fact) {
    const imageUrl = await AI.fetchImage(fact);
    if (!imageUrl) return;

    const containers = card.querySelectorAll('.card-image-container');
    containers.forEach(container => {
      const placeholder = container.querySelector('.card-image-placeholder');
      const img = document.createElement('img');
      img.className = 'card-image';
      img.src = imageUrl;
      img.alt = fact.answer;
      img.loading = 'lazy';
      img.onload = () => {
        if (placeholder) placeholder.remove();
      };
      img.onerror = () => {
        img.remove();
        if (placeholder) {
          placeholder.innerHTML = `
            <svg viewBox="0 0 24 24" width="24" height="24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="currentColor" opacity="0.3"/></svg>
            <span class="placeholder-text">图片加载失败</span>`;
          placeholder.style.opacity = '0.5';
        }
      };
      container.appendChild(img);
    });
  },
};
