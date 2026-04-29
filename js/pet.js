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
      <svg class="pet-svg" id="pet-svg" viewBox="0 0 100 80" width="100" height="80"></svg>
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
        <g id="el-tail-group">
          <path id="el-tail" d="M12,36 C6,32 4,26 6,22 C7,20 9,21 8,24 C7,27 8,30 12,34"
                fill="#b8b8b8" stroke="#a0a0a0" stroke-width="0.5"/>
          <path d="M6,22 C5,19 7,17 8,19" fill="#c4c4c4" stroke="#a0a0a0" stroke-width="0.5"/>
        </g>

        <!-- 身体 -->
        <ellipse cx="38" cy="38" rx="26" ry="18" fill="#c4c4c4"/>
        <ellipse cx="38" cy="38" rx="26" ry="18" fill="url(#bodyGrad)"/>

        <!-- 后腿 -->
        <rect id="el-leg-bl" x="18" y="52" width="9" height="18" rx="4" fill="#b8b8b8"/>
        <rect id="el-leg-br" x="30" y="52" width="9" height="18" rx="4" fill="#b8b8b8"/>
        <!-- 前腿 -->
        <rect id="el-leg-fl" x="44" y="52" width="9" height="18" rx="4" fill="#b8b8b8"/>
        <rect id="el-leg-fr" x="56" y="52" width="9" height="18" rx="4" fill="#b8b8b8"/>
        <!-- 脚趾 -->
        <ellipse cx="22.5" cy="70" rx="5" ry="3" fill="#a8a8a8"/>
        <ellipse cx="34.5" cy="70" rx="5" ry="3" fill="#a8a8a8"/>
        <ellipse cx="48.5" cy="70" rx="5" ry="3" fill="#a8a8a8"/>
        <ellipse cx="60.5" cy="70" rx="5" ry="3" fill="#a8a8a8"/>

        <!-- 头 -->
        <circle cx="72" cy="28" r="16" fill="#c4c4c4"/>
        <circle cx="72" cy="28" r="16" fill="url(#headGrad)"/>

        <!-- 耳朵 -->
        <g id="el-ear-group">
          <ellipse cx="58" cy="22" rx="12" ry="14" fill="#d0d0d0" stroke="#b0b0b0" stroke-width="1"/>
          <ellipse cx="58" cy="22" rx="8" ry="10" fill="#e8c8c8" opacity="0.6"/>
        </g>

        <!-- 腮红 -->
        <circle id="el-blush" cx="68" cy="34" r="4" fill="#f0b0b0" opacity="0.4"/>

        <!-- 眼睛 -->
        <g id="el-eye">
          <circle cx="78" cy="26" r="5" fill="white"/>
          <circle cx="79.5" cy="25.5" r="3.5" fill="#3a3a3a"/>
          <circle cx="81" cy="24" r="1.5" fill="white"/>
          <circle cx="78" cy="27" r="1" fill="white" opacity="0.5"/>
        </g>
        <!-- 眨眼（闭眼弧线） -->
        <path id="el-eye-closed" d="M73,26 Q78,30 83,26" stroke="#3a3a3a" stroke-width="2.5" fill="none" stroke-linecap="round" visibility="hidden"/>

        <!-- 象牙 -->
        <path d="M74,38 Q72,42 70,40" stroke="#f5f5f0" stroke-width="2.5" fill="none" stroke-linecap="round"/>

        <!-- 嘴巴 -->
        <path id="el-mouth" d="M70,35 Q74,38 78,35" stroke="#888" stroke-width="1.5" fill="none" stroke-linecap="round"/>

        <!-- 鼻子 -->
        <path id="el-trunk" d="M82,28 C88,28 90,34 88,40 C86,46 82,48 78,46"
              stroke="#c4c4c4" stroke-width="6" fill="none" stroke-linecap="round"/>
        <!-- 鼻尖 -->
        <ellipse id="el-trunk-tip" cx="78" cy="46" rx="4" ry="3" fill="#b8b8b8"/>
      </g>
      <defs>
        <radialGradient id="bodyGrad" cx="35%" cy="30%" r="60%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.15)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0.03)"/>
        </radialGradient>
        <radialGradient id="headGrad" cx="40%" cy="35%" r="55%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.12)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0.02)"/>
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
    this._setBlush(0.4);
    this._startWalkAnimation();

    const speed = 0.4 + this._mood * 0.12;
    this._walkTimer = setInterval(() => {
      if (this._destroyed) return;
      this._x += speed * this._dir;
      const maxX = this._area.offsetWidth - 100;
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
    this._setBlush(0.6);

    const nearGrass = this._findNearGrass();
    if (nearGrass !== -1) {
      this._spawnEffect('🌱', this._x + 50, 35);
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
    this._setBlush(0.2);

    const group = this._svg.querySelector('#el-group');
    if (group) {
      group.style.transition = 'transform 0.5s';
      group.style.transform = 'translate(0, 3)';
    }

    let zzzCount = 0;
    const zzzInterval = setInterval(() => {
      if (this._destroyed || this._state !== 'sleep') { clearInterval(zzzInterval); return; }
      this._spawnEffect('💤', this._x + 60, 10 + zzzCount * 8);
      zzzCount++;
    }, 1500);

    this._stateTimer = setTimeout(() => {
      clearInterval(zzzInterval);
      if (!this._destroyed) {
        this._showEye(true);
        if (group) group.style.transform = 'translate(0, 0)';
        this._spawnEffect('☀️', this._x + 50, 5);
        this._setState('walk');
      }
    }, 5000 + Math.random() * 3000);
  },

  _startHappy() {
    this._stopWalkAnimation();
    this._showEye(true);
    this._setTrunk('up');
    this._setMouth('bigSmile');
    this._setBlush(0.7);

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
          this._spawnEffect('💕', this._x + 40 + Math.random() * 20, 20 + Math.random() * 15);
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
    this._setBlush(0.3);

    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        if (this._destroyed || this._state !== 'spray') return;
        const offsetX = this._dir === 1 ? 90 : 5;
        this._spawnEffect('💦', this._x + offsetX, 25 + Math.random() * 10);
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
    this._setBlush(0.4);
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
      normal: { d: 'M82,28 C88,28 90,34 88,40 C86,46 82,48 78,46', tipCx: 78, tipCy: 46, tipRx: 4, tipRy: 3 },
      down:   { d: 'M82,28 C88,28 90,36 88,44 C86,50 84,54 80,52', tipCx: 80, tipCy: 52, tipRx: 4, tipRy: 3 },
      up:     { d: 'M82,28 C88,22 92,16 90,10 C88,6 84,4 80,6',   tipCx: 80, tipCy: 6,  tipRx: 4, tipRy: 3 },
      rest:   { d: 'M82,28 C86,30 88,36 86,42 C84,46 80,48 78,46', tipCx: 78, tipCy: 46, tipRx: 4, tipRy: 3 },
    };
    const p = paths[pose] || paths.normal;
    trunk.setAttribute('d', p.d);
    if (tip) {
      tip.setAttribute('cx', p.tipCx);
      tip.setAttribute('cy', p.tipCy);
      tip.setAttribute('rx', p.tipRx);
      tip.setAttribute('ry', p.tipRy);
    }
  },

  _setMouth(pose) {
    const mouth = this._svg.querySelector('#el-mouth');
    if (!mouth) return;

    const paths = {
      smile:    'M70,35 Q74,38 78,35',
      bigSmile: 'M69,34 Q74,40 79,34',
      eat:      'M71,35 Q74,38 77,35',
      closed:   'M71,36 L77,36',
    };
    mouth.setAttribute('d', paths[pose] || paths.smile);
  },

  _setBlush(opacity) {
    const blush = this._svg.querySelector('#el-blush');
    if (blush) blush.style.opacity = opacity;
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
          if (el) el.setAttribute('y', '52');
        });
        return;
      }
      frame++;
      const swing = Math.sin(frame * 0.4) * 3;
      legs.forEach((id, i) => {
        const el = this._svg.querySelector('#' + id);
        if (el) {
          const shift = (i % 2 === 0 ? swing : -swing);
          el.setAttribute('y', String(52 + shift));
        }
      });
    }, 60);
  },

  _stopWalkAnimation() {
    if (this._walkAnimFrame) clearInterval(this._walkAnimFrame);
    const legs = ['el-leg-fl', 'el-leg-fr', 'el-leg-bl', 'el-leg-br'];
    legs.forEach(id => {
      const el = this._svg?.querySelector('#' + id);
      if (el) el.setAttribute('y', '52');
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
    const elX = this._x + 50;
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
    el.style.left = (this._x + 25) + 'px';
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