const Scene = {
  init() {
    const el = document.getElementById('scene');
    if (!el) return;

    // 蓝天占位
    el.style.background = 'linear-gradient(180deg, #4a90d9 0%, #7ab8e8 30%, #a8d8f0 60%, #c8e8c0 85%, #90c870 100%)';

    el.innerHTML = this._butterflies();

    this._loadBackground(el);
  },

  _loadBackground(el) {
    const prompt = encodeURIComponent(
      'A breathtaking dreamy daytime landscape under clear blue sky, ' +
      'a narrow winding S-shaped stream flowing through the entire scene from top to bottom, ' +
      'sunlight reflecting on the water surface with gentle sparkles, ' +
      'colorful wildflowers and lush green grass along both banks of the stream, ' +
      'distant green mountains under a bright sky with soft white clouds, ' +
      'butterflies fluttering among the flowers, ' +
      'peaceful serene happy atmosphere, all creatures living joyfully, ' +
      'photorealistic, highly detailed, 4k, golden hour soft lighting, magical realism'
    );

    const imageUrl = `/api/image?prompt=${prompt}&width=1080&height=1920&seed=88`;

    const img = new Image();
    img.onload = () => {
      el.style.backgroundImage = `url(${imageUrl})`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.style.transition = 'background-image 1.5s ease';
      void el.offsetWidth;
    };
    img.onerror = () => {};
    img.src = imageUrl;
  },

  _butterflies() {
    let s = '';
    for (let i = 0; i < 6; i++) {
      const left = 10 + Math.random() * 80;
      const top = 20 + Math.random() * 60;
      const dur = 6 + Math.random() * 6;
      const delay = Math.random() * 8;
      s += `<div class="sc-butterfly" style="left:${left}%;top:${top}%;animation-duration:${dur}s;animation-delay:${delay}s"></div>`;
    }
    return s;
  },
};
