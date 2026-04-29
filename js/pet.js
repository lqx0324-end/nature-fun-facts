const Pet = {
  _area: null,
  _svg: null,
  _x: 20,
  _dir: 1,
  _state: 'idle',
  _stateTimer: null,
  _walkTimer: null,
  _mood: 0,
  _destroyed: false,
  _grassPositions: [],
  _footprints: [],
  _blinkTimer: null,

  init(areaEl) {
    this._area = areaEl;
    this._destroyed = false;
    this._mood = Storage.getPetMood();
    this._x = 20;
    this._dir = 1;
    this._grassPositions = [15, 35, 55, 75, 90];
    this._footprints = [];

    this._updateMoodOnVisit();

    areaEl.innerHTML = `
      <div class="pet-mood">心情 <span class="pet-mood-bar"></span></div>
      <svg class="pet-svg" id="pet-svg" viewBox="0 0 80 60" width="80" height="60"></svg>
      <div class="pet-ground-decor" id="pet-ground-decor"></div>
      <div class="pet-ground"></div>
      <div class="pet-effects" id="pet-effects"></div>
    `;

    this._svg = document.getElementById('pet-svg');
    this._svg.innerHTML = this._createElephantSVG();

    this._renderGrass();
    this._updateMoodDots();
    this._positionElephant();

    this._svg.addEventListener('click', () => this._onTap());
    this._svg.style.cursor = 'pointer';

    this._startBehaviorLoop();
  },

  destroy() {
    this._destroyed = true;
    if (this._stateTimer) clearTimeout(this._stateTimer);
    if (this._walkTimer) clearInterval(this._walkTimer);
    if (this._blinkTimer) clearTimeout(this._blinkTimer);
  },

  _updateMoodOnVisit() {
    const today = new Date().toDateString();
    const lastVisit = Storage.getPetLastVisit();
    if (lastVisit !== today) {
      this._mood = Math.min(this._mood + 1, 5);
      Storage.savePetMood(this._mood);
      Storage.savePetLastVisit(today);
    }
  },

  _createElephantSVG() {
    return `
      <g id="el-group" transform="translate(0,0)">
        <!-- 尾巴 -->
        <path id="el-tail" d="M8,28 Q2,24 4,18" stroke="#8a8a8a" stroke-width="2" fill="none" stroke-linecap="round">
          <animateTransform attributeName="transform" type="rotate" values="-5,8,28;5,8,28;-5,8,28" dur="1.5s" repeatCount="indefinite"/>
        </path>
        <!-- 身体 -->
        <ellipse cx="32" cy="30" rx="22" ry="16" fill="#9e9e9e"/>
        <ellipse cx="32" cy="30" rx="22" ry="16" fill="url(#bodyShade)"/>
        <!-- 后腿 -->
        <rect id="el-leg-bl" x="14" y="42" width="7" height="14" rx="3" fill="#8a8a8a"/>
        <rect id="el-leg-br" x="24" y="42" width="7" height="14" rx="3" fill="#8a8a8a"/>
        <!-- 前腿 -->
        <rect id="el-leg-fl" x="36" y="42" width="7" height="14" rx="3" fill="#8a8a8a"/>
        <rect id="el-leg-fr" x="46" y="42" width="7" height="14" rx="3" fill="#8a8a8a"/>
        <!-- 脚 -->
        <ellipse cx="17.5" cy="56" rx="4.5" ry="2.5" fill="#7a7a7a"/>
        <ellipse cx="27.5" cy="56" rx="4.5" ry="2.5" fill="#7a7a7a"/>
        <ellipse cx="39.5" cy="56" rx="4.5" ry="2.5" fill="#7a7a7a"/>
        <ellipse cx="49.5" cy="56" rx="4.5" ry="2.5" fill="#7a7a7a"/>
        <!-- 头 -->
        <circle cx="56" cy="22" r="12" fill="#9e9e9e"/>
        <!-- 耳朵 -->
        <ellipse id="el-ear" cx="48" cy="18" rx="8" ry="10" fill="#b0b0b0" stroke="#8a8a8a" stroke-width="1">
          <animateTransform attributeName="transform" type="rotate" values="0,48,18;-8,48,18;0,48,18" dur="3s" repeatCount="indefinite"/>
        </ellipse>
        <!-- 眼睛 -->
        <g id="el-eye">
          <circle cx="60" cy="20" r="3" fill="white"/>
          <circle id="el-pupil" cx="61" cy="20" r="1.8" fill="#333"/>
        </g>
        <!-- 眨眼覆盖（默认隐藏） -->
        <line id="el-eye-closed" x1="57" y1="20" x2="63" y2="20" stroke="#333" stroke-width="2" stroke-linecap="round" visibility="hidden"/>
        <!-- 象牙 -->
        <path d="M58,28 Q56,32 54,30" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- 嘴巴 -->
        <path id="el-mouth" d="M56,27 Q60,30 64,27" stroke="#6a6a6a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <!-- 鼻子 -->
        <path id="el-trunk" d="M64,24 Q72,24 70,32 Q68,38 62,36" stroke="#9e9e9e" stroke-width="5" fill="none" stroke-linecap="round"/>
        <!-- 鼻尖 -->
        <circle id="el-trunk-tip" cx="62" cy="36" r="2.5" fill="#8a8a8a"/>
      </g>
      <defs>
        <radialGradient id="bodyShade" cx="40%" cy="30%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.1)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0.05)"/>
        </radialGradient>
      </defs>
    `;
  },

  _positionElephant() {
    if (!this._svg) return;
    this._svg.style.position = 'absolute';
    this._svg.style.bottom = '2px';
    this._svg.style.left = this._x + 'px';
    this._svg.style.transform = this._dir === -1 ? 'scaleX(-1)' : '';
  },

  _renderGrass() {
    const decor = document.getElementById('pet-ground-decor');
    if (!decor) return;
    decor.innerHTML = this._grassPositions.map((pct, i) =>
      `<span class="pet-grass" data-grass="${i}" style="left:${pct}%">🌿</span>`
    ).join('');
  },

  _startBehaviorLoop() {
    this._setState('walk');
  },

  _setState(state) {
    if (this._destroyed) return;
    this._state = state;

    if (this._stateTimer) clearTimeout(this._stateTimer);
    if (this._walkTimer) clearInterval(this._walkTimer);

    switch (state) {
      case 'walk': this._startWalk(); break;
      case 'eat': this._startEat(); break;
      case 'sleep': this._startSleep(); break;
      case 'happy': this._startHappy(); break;
      case 'spray': this._startSpray(); break;
      case 'idle': this._startIdle(); break;
    }
  },

  _startWalk() {
    this._showEye(true);
    this._setTrunk('normal');
    this._setMouth('smile');
    this._startWalkAnimation();

    const speed = 0.4 + this._mood * 0.12;
    this._walkTimer = setInterval(() => {
      if (this._destroyed) return;
      this._x += speed * this._dir;
      const maxX = this._area.offsetWidth - 80;
      if (this._x >= maxX) { this._dir = -1; }
      else if (this._x <= 0) { this._dir = 1; }
      this._positionElephant();

      if (Math.random() < 0.005) {
        this._addFootprint();
      }
    }, 40);

    const nextAction = () => {
      if (this._destroyed) return;
      const r = Math.random();
      if (r < 0.35) this._setState('eat');
      else if (r < 0.5) this._setState('idle');
      else if (r < 0.6) this._setState('spray');
      else if (r < 0.7) this._setState('sleep');
      else this._setState('walk');
    };

    this._stateTimer = setTimeout(nextAction, 3000 + Math.random() * 4000);
    this._startBlinking();
  },

  _startEat() {
    this._stopWalkAnimation();
    this._showEye(true);
    this._setTrunk('down');
    this._setMouth('eat');

    const nearGrass = this._findNearGrass();
    if (nearGrass !== -1) {
      this._spawnEffect('🌱', this._x + 40, 30);
      setTimeout(() => {
        const grassEl = this._area.querySelector(`[data-grass="${nearGrass}"]`);
        if (grassEl) {
          grassEl.style.opacity = '0.2';
          grassEl.style.transform = 'scale(0.5)';
          setTimeout(() => {
            grassEl.style.opacity = '1';
            grassEl.style.transform = '';
          }, 8000);
        }
      }, 500);
    }

    let chewCount = 0;
    const chewInterval = setInterval(() => {
      if (this._destroyed || this._state !== 'eat') { clearInterval(chewInterval); return; }
      this._setMouth(chewCount % 2 === 0 ? 'eat' : 'closed');
      chewCount++;
      if (chewCount >= 6) {
        clearInterval(chewInterval);
        this._setMouth('smile');
        this._setTrunk('normal');
      }
    }, 300);

    this._stateTimer = setTimeout(() => {
      if (!this._destroyed) this._setState('walk');
    }, 2500);
  },

  _startSleep() {
    this._stopWalkAnimation();
    this._showEye(false);
    this._setTrunk('rest');
    this._setMouth('closed');

    const group = this._svg.querySelector('#el-group');
    if (group) {
      group.style.transition = 'transform 0.5s';
      group.style.transform = 'translate(0, 3)';
    }

    let zzzCount = 0;
    const zzzInterval = setInterval(() => {
      if (this._destroyed || this._state !== 'sleep') { clearInterval(zzzInterval); return; }
      this._spawnEffect('💤', this._x + 50, 10 + zzzCount * 8);
      zzzCount++;
    }, 1500);

    this._stateTimer = setTimeout(() => {
      clearInterval(zzzInterval);
      if (!this._destroyed) {
        this._showEye(true);
        if (group) group.style.transform = 'translate(0, 0)';
        this._spawnEffect('☀️', this._x + 40, 5);
        this._setState('walk');
      }
    }, 5000 + Math.random() * 3000);
  },

  _startHappy() {
    this._stopWalkAnimation();
    this._showEye(true);
    this._setTrunk('up');
    this._setMouth('bigSmile');

    const svg = this._svg;
    svg.style.transition = 'transform 0.15s';
    svg.style.transform = (this._dir === -1 ? 'scaleX(-1) ' : '') + 'translateY(-10px)';
    setTimeout(() => {
      if (!this._destroyed) {
        svg.style.transform = (this._dir === -1 ? 'scaleX(-1) ' : '') + 'translateY(0)';
      }
    }, 200);
    setTimeout(() => {
      if (!this._destroyed) {
        svg.style.transform = (this._dir === -1 ? 'scaleX(-1) ' : '') + 'translateY(-5px)';
      }
    }, 350);
    setTimeout(() => {
      if (!this._destroyed) {
        svg.style.transform = this._dir === -1 ? 'scaleX(-1)' : '';
        svg.style.transition = '';
      }
    }, 500);

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        if (!this._destroyed) {
          this._spawnEffect('💕', this._x + 30 + Math.random() * 20, 15 + Math.random() * 15);
        }
      }, i * 150);
    }

    this._stateTimer = setTimeout(() => {
      if (!this._destroyed) this._setState('walk');
    }, 1500);
  },

  _startSpray() {
    this._stopWalkAnimation();
    this._showEye(true);
    this._setTrunk('up');
    this._setMouth('smile');

    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        if (this._destroyed || this._state !== 'spray') return;
        const offsetX = this._dir === 1 ? 70 : 5;
        this._spawnEffect('💦', this._x + offsetX, 20 + Math.random() * 10);
      }, i * 200);
    }

    this._stateTimer = setTimeout(() => {
      if (!this._destroyed) this._setState('walk');
    }, 1500);
  },

  _startIdle() {
    this._stopWalkAnimation();
    this._showEye(true);
    this._setTrunk('normal');
    this._setMouth('smile');
    this._startBlinking();

    this._stateTimer = setTimeout(() => {
      if (!this._destroyed) this._setState('walk');
    }, 2000 + Math.random() * 2000);
  },

  _onTap() {
    if (this._state === 'happy') return;

    this._mood = Math.min(this._mood + 1, 5);
    Storage.savePetMood(this._mood);
    this._updateMoodDots();

    this._setState('happy');
  },

  // === SVG 部件控制 ===

  _showEye(open) {
    const eye = this._svg.querySelector('#el-eye');
    const eyeClosed = this._svg.querySelector('#el-eye-closed');
    if (eye) eye.style.visibility = open ? 'visible' : 'hidden';
    if (eyeClosed) eyeClosed.style.visibility = open ? 'hidden' : 'visible';
  },

  _setTrunk(pose) {
    const trunk = this._svg.querySelector('#el-trunk');
    const tip = this._svg.querySelector('#el-trunk-tip');
    if (!trunk) return;

    const paths = {
      normal: { d: 'M64,24 Q72,24 70,32 Q68,38 62,36', tipX: 62, tipY: 36 },
      down:   { d: 'M64,24 Q72,24 70,34 Q68,42 64,44', tipX: 64, tipY: 44 },
      up:     { d: 'M64,24 Q72,20 74,14 Q74,8 70,6', tipX: 70, tipY: 6 },
      rest:   { d: 'M64,24 Q70,26 68,32 Q66,36 62,38', tipX: 62, tipY: 38 },
    };
    const p = paths[pose] || paths.normal;
    trunk.setAttribute('d', p.d);
    if (tip) { tip.setAttribute('cx', p.tipX); tip.setAttribute('cy', p.tipY); }
  },

  _setMouth(pose) {
    const mouth = this._svg.querySelector('#el-mouth');
    if (!mouth) return;

    const paths = {
      smile:    'M56,27 Q60,30 64,27',
      bigSmile: 'M55,26 Q60,32 65,26',
      eat:      'M57,27 Q60,30 63,27',
      closed:   'M57,28 L63,28',
    };
    mouth.setAttribute('d', paths[pose] || paths.smile);
  },

  _startWalkAnimation() {
    const legs = ['el-leg-fl', 'el-leg-fr', 'el-leg-bl', 'el-leg-br'];
    legs.forEach(id => {
      const el = this._svg.querySelector('#' + id);
      if (el) el.style.transition = '';
    });

    let frame = 0;
    this._walkAnimFrame = setInterval(() => {
      if (this._destroyed || this._state !== 'walk') {
        clearInterval(this._walkAnimFrame);
        legs.forEach(id => {
          const el = this._svg.querySelector('#' + id);
          if (el) el.setAttribute('y', '42');
        });
        return;
      }
      frame++;
      const offsets = [0, 2, 2, 0];
      const swing = Math.sin(frame * 0.4) * 3;
      legs.forEach((id, i) => {
        const el = this._svg.querySelector('#' + id);
        if (el) {
          const base = 42;
          const shift = (i % 2 === 0 ? swing : -swing);
          el.setAttribute('y', String(base + shift));
        }
      });
    }, 60);
  },

  _stopWalkAnimation() {
    if (this._walkAnimFrame) clearInterval(this._walkAnimFrame);
    const legs = ['el-leg-fl', 'el-leg-fr', 'el-leg-bl', 'el-leg-br'];
    legs.forEach(id => {
      const el = this._svg?.querySelector('#' + id);
      if (el) el.setAttribute('y', '42');
    });
  },

  _startBlinking() {
    if (this._blinkTimer) clearTimeout(this._blinkTimer);
    const blink = () => {
      if (this._destroyed || this._state === 'sleep' || this._state === 'happy') return;
      this._showEye(false);
      setTimeout(() => {
        if (!this._destroyed && this._state !== 'sleep') this._showEye(true);
      }, 150);
      this._blinkTimer = setTimeout(blink, 2000 + Math.random() * 3000);
    };
    this._blinkTimer = setTimeout(blink, 1500 + Math.random() * 2000);
  },

  // === 特效 ===

  _spawnEffect(emoji, x, y) {
    const effects = document.getElementById('pet-effects');
    if (!effects) return;
    const el = document.createElement('span');
    el.className = 'pet-effect';
    el.textContent = emoji;
    el.style.left = x + 'px';
    el.style.bottom = y + 'px';
    effects.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  },

  _findNearGrass() {
    const elX = this._x + 40;
    let closest = -1, minDist = Infinity;
    this._grassPositions.forEach((pct, i) => {
      const grassX = (pct / 100) * this._area.offsetWidth;
      const dist = Math.abs(elX - grassX);
      if (dist < minDist && dist < 60) { minDist = dist; closest = i; }
    });
    return closest;
  },

  _addFootprint() {
    const effects = document.getElementById('pet-effects');
    if (!effects || this._footprints.length > 6) return;
    const el = document.createElement('span');
    el.className = 'pet-footprint';
    el.style.left = (this._x + 20) + 'px';
    effects.appendChild(el);
    this._footprints.push(el);
    setTimeout(() => {
      el.remove();
      this._footprints = this._footprints.filter(f => f !== el);
    }, 5000);
  },

  _updateMoodDots() {
    const moodBar = this._area?.querySelector('.pet-mood-bar');
    if (!moodBar) return;
    const moodDots = 5;
    moodBar.innerHTML = Array.from({ length: moodDots }, (_, i) =>
      `<span class="pet-mood-dot${i < this._mood ? ' pet-mood-dot--active' : ''}"></span>`
    ).join('');
  },
};
