const Scene = {
  W: 480,
  H: 800,

  init() {
    const el = document.getElementById('scene');
    if (!el) return;

    let svg = '';
    svg += this._sky();
    svg += this._stars();
    svg += this._moon();
    svg += this._clouds();
    svg += this._mountains();
    svg += this._trees();
    svg += this._meadow();
    svg += this._stream();
    svg += this._streamReflection();
    svg += this._rocks();
    svg += this._flowers();
    svg += this._grassBlades();
    svg += this._dewdrops();

    el.innerHTML = `
      <svg class="scene-svg" viewBox="0 0 ${this.W} ${this.H}" preserveAspectRatio="xMidYMid slice">${svg}</svg>
      ${this._fireflies()}
    `;
  },

  _sky() {
    return `<defs>
      <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#070d1f"/>
        <stop offset="25%" stop-color="#0f1d3a"/>
        <stop offset="50%" stop-color="#1a2f55"/>
        <stop offset="75%" stop-color="#1e3a5f"/>
        <stop offset="100%" stop-color="#2a4a6b"/>
      </linearGradient>
      <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#fffde7"/>
        <stop offset="60%" stop-color="#f5e6a3"/>
        <stop offset="100%" stop-color="rgba(245,230,163,0)"/>
      </radialGradient>
      <linearGradient id="streamGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="rgba(120,180,220,0.15)"/>
        <stop offset="50%" stop-color="rgba(180,220,255,0.3)"/>
        <stop offset="100%" stop-color="rgba(120,180,220,0.15)"/>
      </linearGradient>
      <filter id="blur2"><feGaussianBlur stdDeviation="2"/></filter>
      <filter id="blur4"><feGaussianBlur stdDeviation="4"/></filter>
    </defs>
    <rect width="${this.W}" height="${this.H}" fill="url(#skyGrad)"/>`;
  },

  _stars() {
    let s = '';
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * this.W;
      const y = Math.random() * this.H * 0.45;
      const r = 0.3 + Math.random() * 1.2;
      const opacity = 0.3 + Math.random() * 0.7;
      const delay = Math.random() * 5;
      s += `<circle cx="${x}" cy="${y}" r="${r}" fill="white" opacity="${opacity}">
        <animate attributeName="opacity" values="${opacity};${opacity*0.4};${opacity}" dur="${2+Math.random()*4}s" begin="${delay}s" repeatCount="indefinite"/>
      </circle>`;
    }
    return `<g class="sc-stars">${s}</g>`;
  },

  _moon() {
    const cx = 380, cy = 80, r = 30;
    return `<g class="sc-moon">
      <circle cx="${cx}" cy="${cy}" r="${r*3}" fill="rgba(255,253,200,0.04)" filter="url(#blur4)"/>
      <circle cx="${cx}" cy="${cy}" r="${r*2}" fill="rgba(255,253,200,0.08)" filter="url(#blur2)"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#moonGlow)"/>
      <circle cx="${cx-8}" cy="${cy-5}" r="${r*0.25}" fill="rgba(200,190,150,0.3)"/>
      <circle cx="${cx+6}" cy="${cy+8}" r="${r*0.15}" fill="rgba(200,190,150,0.2)"/>
    </g>`;
  },

  _clouds() {
    const clouds = [
      { x: 60, y: 100, s: 1 },
      { x: 250, y: 60, s: 0.7 },
      { x: 400, y: 130, s: 0.5 },
    ];
    let s = '';
    clouds.forEach((c, i) => {
      s += `<g class="sc-cloud" style="animation-delay:${-i*8}s">
        <ellipse cx="${c.x}" cy="${c.y}" rx="${30*c.s}" ry="${10*c.s}" fill="rgba(180,200,220,0.06)"/>
        <ellipse cx="${c.x+15*c.s}" cy="${c.y-3*c.s}" rx="${25*c.s}" ry="${8*c.s}" fill="rgba(180,200,220,0.05)"/>
        <ellipse cx="${c.x-10*c.s}" cy="${c.y+2*c.s}" rx="${20*c.s}" ry="${7*c.s}" fill="rgba(180,200,220,0.04)"/>
      </g>`;
    });
    return s;
  },

  _mountains() {
    const layers = [
      { y: 280, color: '#0e1e38', amp: 60, freq: 0.008, offset: 0 },
      { y: 320, color: '#132844', amp: 50, freq: 0.01, offset: 100 },
      { y: 360, color: '#183050', amp: 40, freq: 0.012, offset: 200 },
      { y: 390, color: '#1c3858', amp: 35, freq: 0.015, offset: 50 },
    ];
    let s = '';
    layers.forEach(l => {
      let d = `M0,${l.y}`;
      for (let x = 0; x <= this.W; x += 10) {
        const y = l.y - l.amp * Math.sin(l.freq * x + l.offset) - l.amp * 0.5 * Math.sin(l.freq * 2.3 * x + l.offset * 1.7);
        d += ` L${x},${y}`;
      }
      d += ` L${this.W},${this.H} L0,${this.H} Z`;
      s += `<path d="${d}" fill="${l.color}"/>`;
    });
    return s;
  },

  _trees() {
    const trees = [
      { x: 30, y: 400, h: 50, type: 'pine' },
      { x: 70, y: 395, h: 65, type: 'pine' },
      { x: 110, y: 402, h: 45, type: 'pine' },
      { x: 350, y: 398, h: 55, type: 'pine' },
      { x: 400, y: 393, h: 70, type: 'pine' },
      { x: 450, y: 400, h: 48, type: 'pine' },
      { x: 180, y: 405, h: 40, type: 'willow' },
      { x: 300, y: 403, h: 45, type: 'willow' },
    ];
    let s = '';
    trees.forEach(t => {
      if (t.type === 'pine') {
        s += `<g class="sc-pine">
          <rect x="${t.x-2}" y="${t.y-t.h*0.3}" width="4" height="${t.h*0.3}" fill="#0a1a0a"/>
          <polygon points="${t.x},${t.y-t.h} ${t.x-12},${t.y-t.h*0.25} ${t.x+12},${t.y-t.h*0.25}" fill="#0e2210"/>
          <polygon points="${t.x},${t.y-t.h*0.85} ${t.x-10},${t.y-t.h*0.35} ${t.x+10},${t.y-t.h*0.35}" fill="#102814"/>
        </g>`;
      } else {
        s += `<g class="sc-willow">
          <rect x="${t.x-2}" y="${t.y-t.h*0.5}" width="4" height="${t.h*0.5}" fill="#0a1a0a"/>
          <ellipse cx="${t.x}" cy="${t.y-t.h*0.55}" rx="${t.h*0.3}" ry="${t.h*0.25}" fill="#0e2210"/>
          <path d="M${t.x-t.h*0.2},${t.y-t.h*0.5} Q${t.x-t.h*0.35},${t.y-t.h*0.2} ${t.x-t.h*0.25},${t.y}" stroke="#0e2210" stroke-width="1.5" fill="none"/>
          <path d="M${t.x+t.h*0.2},${t.y-t.h*0.5} Q${t.x+t.h*0.35},${t.y-t.h*0.2} ${t.x+t.h*0.25},${t.y}" stroke="#0e2210" stroke-width="1.5" fill="none"/>
        </g>`;
      }
    });
    return s;
  },

  _meadow() {
    let d = `M0,440`;
    for (let x = 0; x <= this.W; x += 5) {
      const y = 440 - 8 * Math.sin(0.02 * x) - 5 * Math.sin(0.05 * x + 1) - 3 * Math.sin(0.1 * x + 2);
      d += ` L${x},${y}`;
    }
    d += ` L${this.W},${this.H} L0,${this.H} Z`;
    return `<path d="${d}" fill="#122a18"/>
            <path d="${d.replace(/440/g,'443').replace(/4/g,'4')}" fill="#0e2212" opacity="0.5"/>`;
  },

  _stream() {
    const streamY = 468;
    const streamW = 14;
    let s = '';

    // 溪面主体
    let topEdge = `M0,${streamY-streamW/2}`;
    let botEdge = `M0,${streamY+streamW/2}`;
    for (let x = 0; x <= this.W; x += 5) {
      const wave = 3 * Math.sin(0.03 * x) + 2 * Math.sin(0.07 * x + 1);
      topEdge += ` L${x},${streamY - streamW/2 + wave}`;
      botEdge += ` L${x},${streamY + streamW/2 + wave}`;
    }
    botEdge += ` L${this.W},${streamY+streamW/2} L0,${streamY+streamW/2} Z`;
    s += `<path d="${topEdge} L${this.W},${streamY-streamW/2} L${this.W},${streamY+streamW/2} ${botEdge.replace(/M0.*/,'')}" fill="url(#streamGrad)" opacity="0.6"/>`;

    // 波纹线
    for (let i = 0; i < 5; i++) {
      const yOff = -streamW/2 + 2 + i * 3;
      const delay = i * 0.6;
      let d = `M-10,${streamY+yOff}`;
      for (let x = 0; x <= this.W + 10; x += 5) {
        const wave = 3 * Math.sin(0.03 * x) + 2 * Math.sin(0.07 * x + 1);
        const ripple = 1.5 * Math.sin(0.08 * x + i * 1.2);
        d += ` L${x},${streamY + yOff + wave + ripple}`;
      }
      s += `<path d="${d}" fill="none" stroke="rgba(180,220,255,0.15)" stroke-width="1" class="sc-ripple" style="animation-delay:${delay}s"/>`;
    }

    // 水面反光点
    for (let i = 0; i < 20; i++) {
      const x = 20 + Math.random() * (this.W - 40);
      const baseY = streamY + 3 * Math.sin(0.03 * x) + 2 * Math.sin(0.07 * x + 1);
      const y = baseY - streamW/2 + Math.random() * streamW;
      const delay = Math.random() * 4;
      s += `<circle cx="${x}" cy="${y}" r="${0.5+Math.random()}" fill="rgba(220,240,255,0.4)" class="sc-sparkle" style="animation-delay:${delay}s"/>`;
    }

    return `<g class="sc-stream">${s}</g>`;
  },

  _streamReflection() {
    return `<circle cx="380" cy="470" r="8" fill="rgba(255,253,200,0.06)" filter="url(#blur2)" class="sc-moon-reflection"/>
            <ellipse cx="380" cy="470" rx="20" ry="3" fill="rgba(255,253,200,0.04)" class="sc-moon-streak"/>`;
  },

  _rocks() {
    const rocks = [
      { x: 140, y: 460, rx: 8, ry: 5 },
      { x: 148, y: 462, rx: 5, ry: 3 },
      { x: 310, y: 458, rx: 7, ry: 4 },
      { x: 318, y: 461, rx: 4, ry: 3 },
      { x: 440, y: 462, rx: 6, ry: 4 },
    ];
    let s = '';
    rocks.forEach(r => {
      s += `<ellipse cx="${r.x}" cy="${r.y}" rx="${r.rx}" ry="${r.ry}" fill="#1a2a1e"/>
            <ellipse cx="${r.x-1}" cy="${r.y-1}" rx="${r.rx*0.7}" ry="${r.ry*0.6}" fill="#223428"/>`;
    });
    return s;
  },

  _flowers() {
    const flowerTypes = ['daisy', 'tulip', 'bell', 'lavender'];
    const colors = {
      daisy: ['#e8d0f0', '#f0e0f8', '#d8c0e8'],
      tulip: ['#f0a0b0', '#e08090', '#f0b0c0'],
      bell: ['#c0e0f0', '#a0d0e8', '#b0d8f0'],
      lavender: ['#c0a0e0', '#b090d0', '#d0b0f0'],
    };
    let s = '';

    // 溪边两侧大量花
    const positions = [];
    for (let x = 20; x < this.W - 20; x += 15 + Math.random() * 20) {
      const side = Math.random() > 0.5 ? -1 : 1;
      const yBase = 458 + Math.random() * 12;
      positions.push({ x, y: yBase });
    }

    positions.forEach((p, i) => {
      const type = flowerTypes[i % flowerTypes.length];
      const color = colors[type][Math.floor(Math.random() * 3)];
      const scale = 0.6 + Math.random() * 0.6;

      if (type === 'daisy') {
        // 五瓣花
        const petalR = 3 * scale;
        for (let j = 0; j < 5; j++) {
          const angle = (j / 5) * Math.PI * 2 - Math.PI / 2;
          const px = p.x + Math.cos(angle) * petalR;
          const py = p.y - 4 * scale + Math.sin(angle) * petalR;
          s += `<ellipse cx="${px}" cy="${py}" rx="${petalR*0.6}" ry="${petalR*0.35}" fill="${color}" transform="rotate(${j*72},${px},${py})"/>`;
        }
        s += `<circle cx="${p.x}" cy="${p.y-4*scale}" r="${1.2*scale}" fill="#f0d060"/>`;
        s += `<line x1="${p.x}" y1="${p.y-2*scale}" x2="${p.x}" y2="${p.y+4*scale}" stroke="#2a5a2a" stroke-width="${0.8*scale}"/>`;
      } else if (type === 'tulip') {
        // 郁金香
        s += `<path d="M${p.x},${p.y-8*scale} Q${p.x-3*scale},${p.y-4*scale} ${p.x},${p.y-2*scale} Q${p.x+3*scale},${p.y-4*scale} ${p.x},${p.y-8*scale}" fill="${color}"/>`;
        s += `<line x1="${p.x}" y1="${p.y-2*scale}" x2="${p.x}" y2="${p.y+4*scale}" stroke="#2a5a2a" stroke-width="${0.8*scale}"/>`;
      } else if (type === 'bell') {
        // 铃兰
        s += `<circle cx="${p.x}" cy="${p.y-6*scale}" r="${2*scale}" fill="${color}"/>`;
        s += `<path d="M${p.x-1.5*scale},${p.y-5*scale} Q${p.x},${p.y-2*scale} ${p.x+1.5*scale},${p.y-5*scale}" fill="${color}" opacity="0.8"/>`;
        s += `<line x1="${p.x}" y1="${p.y-4*scale}" x2="${p.x}" y2="${p.y+4*scale}" stroke="#2a5a2a" stroke-width="${0.6*scale}"/>`;
      } else {
        // 薰衣草 - 几个小圆
        for (let j = 0; j < 4; j++) {
          s += `<circle cx="${p.x+(j-1.5)*1.5*scale}" cy="${p.y-5*scale-j*1.5*scale}" r="${1.2*scale}" fill="${color}" opacity="${0.7+j*0.08}"/>`;
        }
        s += `<line x1="${p.x}" y1="${p.y-3*scale}" x2="${p.x}" y2="${p.y+4*scale}" stroke="#2a5a2a" stroke-width="${0.6*scale}"/>`;
      }
    });

    return `<g class="sc-flowers">${s}</g>`;
  },

  _grassBlades() {
    let s = '';
    for (let i = 0; i < 40; i++) {
      const x = 10 + Math.random() * (this.W - 20);
      const y = 455 + Math.random() * 15;
      const h = 6 + Math.random() * 10;
      const curve = (Math.random() - 0.5) * 6;
      s += `<path d="M${x},${y} Q${x+curve},${y-h*0.6} ${x+curve*1.5},${y-h}" stroke="#1a4a1a" stroke-width="${0.8+Math.random()*0.5}" fill="none" stroke-linecap="round"/>`;
    }
    return `<g class="sc-grass">${s}</g>`;
  },

  _dewdrops() {
    let s = '';
    for (let i = 0; i < 12; i++) {
      const x = 30 + Math.random() * (this.W - 60);
      const y = 450 + Math.random() * 15;
      const delay = Math.random() * 5;
      s += `<circle cx="${x}" cy="${y}" r="${0.6+Math.random()*0.6}" fill="rgba(200,230,255,0.5)" class="sc-dew" style="animation-delay:${delay}s"/>`;
    }
    return `<g class="sc-dewdrops">${s}</g>`;
  },

  _fireflies() {
    let s = '';
    for (let i = 0; i < 15; i++) {
      const left = 5 + Math.random() * 90;
      const top = 30 + Math.random() * 50;
      const dur = 5 + Math.random() * 5;
      const delay = Math.random() * 8;
      const size = 3 + Math.random() * 2;
      s += `<div class="sc-firefly" style="left:${left}%;top:${top}%;width:${size}px;height:${size}px;animation-duration:${dur}s;animation-delay:${delay}s"></div>`;
    }
    return s;
  },
};
