const Scene = {
  init() {
    const el = document.getElementById('scene');
    if (!el) return;

    // 渐变天空占位
    el.style.background = 'linear-gradient(180deg, #070d1f 0%, #0f1d3a 25%, #1a2f55 50%, #1e3a5f 75%, #2a4a6b 100%)';

    // 萤火虫（先添加，图片加载后也在）
    el.innerHTML = this._fireflies();

    // 加载 AI 生成的写实背景
    this._loadBackground(el);
  },

  _loadBackground(el) {
    const prompt = encodeURIComponent(
      'A breathtaking dreamy nighttime landscape, a winding S-shaped stream flowing through the entire scene from top to bottom, ' +
      'moonlight reflecting on the water surface with shimmering ripples, ' +
      'wildflowers and lush grass along both banks of the stream, ' +
      'distant misty mountains silhouetted against a starry sky, ' +
      'a large luminous moon casting soft silver light, ' +
      'fireflies glowing softly among the flowers, ' +
      'dewdrops on petals catching moonlight, ' +
      'peaceful serene atmosphere, all creatures living happily, ' +
      'photorealistic, highly detailed, 4k, cinematic lighting, magical realism'
    );

    const imageUrl = `/api/image?prompt=${prompt}&width=1080&height=1920&seed=42`;

    const img = new Image();
    img.onload = () => {
      el.style.backgroundImage = `url(${imageUrl})`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.style.transition = 'background-image 1.5s ease';
      // 强制重绘触发 transition
      void el.offsetWidth;
    };
    img.onerror = () => {
      // 加载失败保持渐变天空
    };
    img.src = imageUrl;
  },

  _fireflies() {
    let s = '';
    for (let i = 0; i < 10; i++) {
      const left = 5 + Math.random() * 90;
      const top = 25 + Math.random() * 55;
      const dur = 5 + Math.random() * 5;
      const delay = Math.random() * 8;
      const size = 3 + Math.random() * 2;
      s += `<div class="sc-firefly" style="left:${left}%;top:${top}%;width:${size}px;height:${size}px;animation-duration:${dur}s;animation-delay:${delay}s"></div>`;
    }
    return s;
  },
};
