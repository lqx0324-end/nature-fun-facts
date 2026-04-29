const Router = {
  routes: {
    '/': () => App.renderHome(),
    '/explore': () => App.renderExplore(),
    '/favorites': () => App.renderFavorites(),
    '/quiz': () => App.renderQuiz(),
    '/settings': () => App.renderSettings(),
  },

  init() {
    window.addEventListener('hashchange', () => this._handleRoute());
    this._handleRoute();
  },

  _handleRoute() {
    const path = window.location.hash.slice(1) || '/';
    const handler = this.routes[path];
    if (handler) {
      handler();
      this._updateNav(path);
    } else {
      this.routes['/']();
      this._updateNav('/');
    }
  },

  _updateNav(path) {
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      const page = item.dataset.page;
      const route = page === 'home' ? '/' : `/${page}`;
      item.classList.toggle('active', route === path);
    });
  },
};