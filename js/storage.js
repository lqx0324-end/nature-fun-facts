const Storage = {
  KEYS: {
    FAVORITES: 'nature_facts_favorites',
    SETTINGS: 'nature_facts_settings',
  },

  // === 收藏 ===
  getFavorites() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.FAVORITES)) || [];
    } catch {
      return [];
    }
  },

  addFavorite(factId) {
    const favorites = this.getFavorites();
    if (!favorites.includes(factId)) {
      favorites.push(factId);
      localStorage.setItem(this.KEYS.FAVORITES, JSON.stringify(favorites));
    }
  },

  removeFavorite(factId) {
    const favorites = this.getFavorites().filter(id => id !== factId);
    localStorage.setItem(this.KEYS.FAVORITES, JSON.stringify(favorites));
  },

  isFavorite(factId) {
    return this.getFavorites().includes(factId);
  },

  // === 设置 ===
  getSettings() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.SETTINGS)) || {};
    } catch {
      return {};
    }
  },

  saveSettings(settings) {
    localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
  },

  getApiKey() {
    return this.getSettings().apiKey || '';
  },

  getApiProvider() {
    return this.getSettings().apiProvider || 'openai';
  },
};
