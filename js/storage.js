const Storage = {
  KEYS: {
    FAVORITES: 'nature_facts_favorites',
    SETTINGS: 'nature_facts_settings',
    QUIZ_BEST: 'nature_facts_quiz_best',
    PET_MOOD: 'nature_facts_pet_mood',
    PET_LAST_VISIT: 'nature_facts_pet_last_visit',
  },

  // Fallback memory store when localStorage is unavailable (e.g. WeChat privacy mode)
  _memoryStore: {},
  _localStorageAvailable: null,

  _isAvailable() {
    if (this._localStorageAvailable !== null) return this._localStorageAvailable;
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      this._localStorageAvailable = true;
    } catch {
      this._localStorageAvailable = false;
    }
    return this._localStorageAvailable;
  },

  _getItem(key) {
    if (this._isAvailable()) {
      return localStorage.getItem(key);
    }
    return this._memoryStore[key] || null;
  },

  _setItem(key, value) {
    if (this._isAvailable()) {
      localStorage.setItem(key, value);
    } else {
      this._memoryStore[key] = value;
    }
  },

  // === 收藏 ===
  getFavorites() {
    try {
      return JSON.parse(this._getItem(this.KEYS.FAVORITES)) || [];
    } catch {
      return [];
    }
  },

  addFavorite(factId) {
    const favorites = this.getFavorites();
    if (!favorites.includes(factId)) {
      favorites.push(factId);
      this._setItem(this.KEYS.FAVORITES, JSON.stringify(favorites));
    }
  },

  removeFavorite(factId) {
    const favorites = this.getFavorites().filter(id => id !== factId);
    this._setItem(this.KEYS.FAVORITES, JSON.stringify(favorites));
  },

  isFavorite(factId) {
    return this.getFavorites().includes(factId);
  },

  // === 设置 ===
  getSettings() {
    try {
      return JSON.parse(this._getItem(this.KEYS.SETTINGS)) || {};
    } catch {
      return {};
    }
  },

  saveSettings(settings) {
    this._setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
  },

  getApiKey() {
    return this.getSettings().apiKey || '';
  },

  getApiProvider() {
    return this.getSettings().apiProvider || 'openai';
  },

  // === 测验 ===
  getBestQuizScore() {
    try {
      return parseInt(this._getItem(this.KEYS.QUIZ_BEST)) || 0;
    } catch {
      return 0;
    }
  },

  saveBestQuizScore(score) {
    this._setItem(this.KEYS.QUIZ_BEST, String(score));
  },

  // === 宠物 ===
  getPetMood() {
    try {
      return parseInt(this._getItem(this.KEYS.PET_MOOD)) || 0;
    } catch {
      return 0;
    }
  },

  savePetMood(mood) {
    this._setItem(this.KEYS.PET_MOOD, String(mood));
  },

  getPetLastVisit() {
    return this._getItem(this.KEYS.PET_LAST_VISIT) || '';
  },

  savePetLastVisit(date) {
    this._setItem(this.KEYS.PET_LAST_VISIT, date);
  },
};