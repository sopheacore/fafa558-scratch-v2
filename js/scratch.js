/**
 * FAFA558 Interactive Scratch Minigame Engine
 * 100% video-accurate scratch-off logic, Web Audio synthesizer, and conversion tracking
 */

const CONFIG = {
  telegramUrl: 'https://t.me/fafa558kh_bot?start=minigame',
  pixelId1: '1049062040632358',
  pixelId2: '1360977495406979',
  brandName: 'FAFA558'
};

// 6 Cards Definition with New Professional 3D Assets
const CARD_DATA = [
  { id: 1, name: '黄金票5份', amount: '5份', icon: 'images/ticket_gold_5_pro.png', type: 'gold', godIndex: 1 },
  { id: 2, name: '五路财神+1', amount: '财神', icon: 'images/ticket_god_pro.png', type: 'god', godIndex: 2 },
  { id: 3, name: '黄金票10份', amount: '10份', icon: 'images/ticket_gold_10_pro.png', type: 'gold', godIndex: 3 },
  { id: 4, name: '现金红包 88元', amount: '88元', icon: 'images/ticket_redpacket_pro.png', type: 'cash', godIndex: 4 },
  { id: 5, name: '五路财神+1', amount: '财神', icon: 'images/ticket_god_pro.png', type: 'god', godIndex: 5 },
  { id: 6, name: '现金大奖 888元', amount: '888元', icon: 'images/ticket_grand_888_pro.png', type: 'grand', isGrand: true }
];

// Web Audio Sound Synthesizer
class SoundSynthesizer {
  constructor() {
    this.ctx = null;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.step = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Realistic scratch friction noise
  playScratch() {
    this.init();
    if (!this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1400 + Math.random() * 600;
      filter.Q.value = 2.5;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      whiteNoise.start();
    } catch (e) {}
  }

  // Bell/Chime note for card reveal
  playChime(noteIndex = 0) {
    this.init();
    if (!this.ctx) return;
    try {
      const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]; // C5, D5, E5, G5, A5, C6
      const freq = pentatonic[noteIndex % pentatonic.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);
    } catch (e) {}
  }

  // Victory fanfare
  playFanfare() {
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.8);
        }, idx * 110);
      });
    } catch (e) {}
  }

  // Festive Chinese Pentatonic BGM Loop
  toggleBgm() {
    this.init();
    const btn = document.getElementById('music-toggle-btn');
    if (this.bgmPlaying) {
      this.bgmPlaying = false;
      if (this.bgmTimer) clearInterval(this.bgmTimer);
      if (btn) btn.classList.remove('playing');
    } else {
      this.bgmPlaying = true;
      if (btn) btn.classList.add('playing');
      const melody = [523, 523, 587, 659, 784, 659, 587, 523, 659, 784, 880, 784, 659, 523];
      this.step = 0;
      this.bgmTimer = setInterval(() => {
        if (!this.bgmPlaying || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(melody[this.step % melody.length], this.ctx.currentTime);
        gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
        this.step++;
      }, 320);
    }
  }
}

const sounds = new SoundSynthesizer();

// Main Game Controller
class ScratchGame {
  constructor() {
    this.revealedCards = new Set();
    this.unlockedGods = 0;
    this.isAutoScratching = false;
    this.stampImg = new Image();
    this.stampImg.src = 'images/stamp_circle_pro.png';
    this.stampReady = false;
    this.stampImg.onload = () => { this.stampReady = true; this.initSlots(); };

    this.initUI();
    this.initBackgroundCoins();
    this.initFireworks();
  }

  initUI() {
    // Navigation music button
    const musicBtn = document.getElementById('music-toggle-btn');
    if (musicBtn) {
      musicBtn.addEventListener('click', () => sounds.toggleBgm());
    }

    // Auto-play background video
    const video = document.getElementById('hero-gods-video');
    if (video) {
      video.play().catch(() => {});
      document.addEventListener('touchstart', () => video.play().catch(() => {}), { once: true });
      document.addEventListener('click', () => video.play().catch(() => {}), { once: true });
    }

    // Auto Scratch Button ("点我刮开")
    const scratchBtn = document.getElementById('btn-auto-scratch');
    if (scratchBtn) {
      scratchBtn.addEventListener('click', () => this.autoScratchAll());
    }

    // "我的奖品" (My Prizes) Button
    const myPrizeBtn = document.getElementById('btn-my-prize');
    if (myPrizeBtn) {
      myPrizeBtn.addEventListener('click', () => this.openMyPrizesModal());
    }

    // "年中福利包" (Mid-Year Welfare) Button
    const welfareBtn = document.getElementById('btn-welfare');
    if (welfareBtn) {
      welfareBtn.addEventListener('click', () => this.openWelfareModal());
    }

    // Bottom Promo Card
    const bottomPromo = document.getElementById('bottom-promo-card');
    if (bottomPromo) {
      bottomPromo.addEventListener('click', () => this.handleConversionClick('Bottom Promo Banner'));
    }

    // Modal Close Buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
      });
    });

    // Close modal when clicking dark backdrop
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
      });
    });

    // Tracking CTA clicks
    document.querySelectorAll('[data-cta-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const actionName = btn.getAttribute('data-cta-action') || 'CTA Button';
        this.handleConversionClick(actionName);
      });
    });
  }

  initSlots() {
    const grid = document.getElementById('scratch-grid');
    if (!grid) return;
    grid.innerHTML = '';

    CARD_DATA.forEach((card, index) => {
      const slot = document.createElement('div');
      slot.className = 'card-slot';
      slot.id = `slot-${card.id}`;

      // Underlying Prize Card
      const prizeLayer = document.createElement('div');
      prizeLayer.className = 'prize-card-layer';
      const prizeImg = document.createElement('img');
      prizeImg.className = 'prize-card-img';
      prizeImg.src = card.icon;
      prizeImg.alt = card.name;
      prizeLayer.appendChild(prizeImg);
      slot.appendChild(prizeLayer);

      // Scratch Canvas Layer
      const canvas = document.createElement('canvas');
      canvas.className = 'scratch-canvas';
      slot.appendChild(canvas);

      grid.appendChild(slot);

      // Setup Canvas
      this.setupCanvas(canvas, slot, card, index);
    });
  }

  setupCanvas(canvas, slot, card, index) {
    const rect = slot.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height) || 100;
    canvas.width = size * 2; // HiDPI
    canvas.height = size * 2;
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    const ctx = canvas.getContext('2d');
    this.renderFoil(ctx, canvas.width, canvas.height);

    let isDrawing = false;
    let lastPoint = null;
    let strokeCount = 0;

    const getPos = (e) => {
      const b = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - b.left) * (canvas.width / b.width),
        y: (clientY - b.top) * (canvas.height / b.height),
        screenX: clientX,
        screenY: clientY
      };
    };

    const scratch = (pos) => {
      if (this.revealedCards.has(card.id)) return;

      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      const radius = canvas.width * 0.16; // scratch radius
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fill();

      if (lastPoint) {
        ctx.beginPath();
        ctx.lineWidth = radius * 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }

      lastPoint = pos;
      strokeCount++;

      // Sound and particles
      sounds.playScratch();
      this.emitScratchParticles(pos.screenX, pos.screenY);

      // Check threshold every 8 strokes
      if (strokeCount % 8 === 0) {
        this.checkScratchProgress(canvas, slot, card, index);
      }
    };

    const start = (e) => {
      if (this.revealedCards.has(card.id)) return;
      sounds.init();
      isDrawing = true;
      lastPoint = getPos(e);
      scratch(lastPoint);
    };

    const move = (e) => {
      if (!isDrawing || this.revealedCards.has(card.id)) return;
      e.preventDefault();
      const pos = getPos(e);
      scratch(pos);
    };

    const end = () => {
      if (!isDrawing) return;
      isDrawing = false;
      lastPoint = null;
      this.checkScratchProgress(canvas, slot, card, index);
    };

    canvas.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);

    canvas.addEventListener('touchstart', start, { passive: false });
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
  }

  renderFoil(ctx, w, h) {
    // Clear and draw base metallic foil circle
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2);
    ctx.clip();

    // Metallic gold gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#f9d29f');
    grad.addColorStop(0.3, '#d3874b');
    grad.addColorStop(0.7, '#b75b28');
    grad.addColorStop(1, '#8a3311');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Draw the circular stamp image centered
    if (this.stampReady) {
      ctx.drawImage(this.stampImg, 0, 0, w, h);
    }
    ctx.restore();
  }

  checkScratchProgress(canvas, slot, card, index) {
    if (this.revealedCards.has(card.id)) return;

    try {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      // Sample 32x32 grid to compute transparent percentage
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      let transparent = 0;
      const step = 4 * 8; // sample every 8th pixel
      let total = 0;

      for (let i = 3; i < data.length; i += step) {
        total++;
        if (data[i] < 40) {
          transparent++;
        }
      }

      const ratio = transparent / total;
      // If scratched > 38%, trigger complete reveal
      if (ratio > 0.38) {
        this.revealCard(slot, card, index);
      }
    } catch (e) {}
  }

  revealCard(slot, card, index) {
    if (this.revealedCards.has(card.id)) return;
    this.revealedCards.add(card.id);

    slot.classList.add('revealed');

    // Add sparkle burst element
    const sparkle = document.createElement('div');
    sparkle.className = 'revealed-sparkle';
    slot.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 800);

    // Play chime sound
    sounds.playChime(this.revealedCards.size);

    // Update 5 Gods of Wealth progress
    if (this.unlockedGods < 5) {
      this.unlockedGods++;
      this.unlockGodBadge(this.unlockedGods);
    }

    // Track scratch event
    if (window.fbq) {
      fbq('trackCustom', 'Scratch_Card', {
        card_id: card.id,
        card_name: card.name,
        revealed_count: this.revealedCards.size
      });
    }

    // If all cards or grand card revealed: trigger Grand Victory!
    if (this.revealedCards.size === CARD_DATA.length || card.isGrand) {
      setTimeout(() => {
        this.triggerGrandVictory();
      }, 700);
    }
  }

  unlockGodBadge(godIndex) {
    const badgeSlot = document.getElementById(`god-badge-${godIndex}`);
    if (badgeSlot) {
      badgeSlot.classList.add('unlocked');
    }
  }

  autoScratchAll() {
    if (this.isAutoScratching) return;
    this.isAutoScratching = true;
    sounds.init();

    const unrevealed = CARD_DATA.filter(c => !this.revealedCards.has(c.id));
    if (unrevealed.length === 0) {
      this.triggerGrandVictory();
      this.isAutoScratching = false;
      return;
    }

    unrevealed.forEach((card, idx) => {
      setTimeout(() => {
        const slot = document.getElementById(`slot-${card.id}`);
        if (slot) {
          this.revealCard(slot, card, idx);
        }
        if (idx === unrevealed.length - 1) {
          this.isAutoScratching = false;
        }
      }, idx * 320);
    });
  }

  triggerGrandVictory() {
    sounds.playFanfare();
    this.startFireworks(4500);

    // Unlock all 5 gods
    for (let i = 1; i <= 5; i++) {
      this.unlockGodBadge(i);
    }

    // Open Grand Prize Modal
    setTimeout(() => {
      const modal = document.getElementById('modal-grand-win');
      if (modal) modal.classList.add('active');

      if (window.fbq) {
        fbq('track', 'Purchase', {
          value: 888.00,
          currency: 'USD',
          content_name: '888 Cash Grand Prize'
        });
      }
    }, 900);
  }

  openMyPrizesModal() {
    const modal = document.getElementById('modal-my-prizes');
    const container = document.getElementById('prizes-list-content');
    if (!modal || !container) return;

    container.innerHTML = '';
    if (this.revealedCards.size === 0) {
      container.innerHTML = '<div style="text-align:center; padding: 20px; color:#888;">尚未刮开任何奖品，快点击刮开吧！</div>';
    } else {
      CARD_DATA.forEach(card => {
        if (this.revealedCards.has(card.id)) {
          const row = document.createElement('div');
          row.className = 'prize-item-row';
          row.innerHTML = `
            <div class="prize-item-left">
              <img class="prize-item-thumb" src="${card.icon}" alt="${card.name}">
              <span class="prize-item-name">${card.name}</span>
            </div>
            <span class="prize-item-status">已获得 ✓</span>
          `;
          container.appendChild(row);
        }
      });
    }

    modal.classList.add('active');
  }

  openWelfareModal() {
    const modal = document.getElementById('modal-welfare');
    if (modal) modal.classList.add('active');
  }

  handleConversionClick(eventName) {
    if (window.fbq) {
      fbq('trackCustom', 'CTA_Click', {
        content_name: eventName,
        content_category: 'FAFA558 Landing',
        event_source: 'button_click'
      });
      fbq('track', 'Purchase', {
        value: 1.00,
        currency: 'USD',
        content_name: eventName
      });
    }

    setTimeout(() => {
      window.open(CONFIG.telegramUrl, '_blank');
    }, 280);
  }

  emitScratchParticles(x, y) {
    const container = document.getElementById('particles-container');
    if (!container) return;

    for (let i = 0; i < 3; i++) {
      const flake = document.createElement('div');
      flake.className = 'flake';
      const size = 3 + Math.random() * 5;
      flake.style.width = `${size}px`;
      flake.style.height = `${size}px`;
      flake.style.left = `${x}px`;
      flake.style.top = `${y}px`;

      const dx = (Math.random() - 0.5) * 60;
      const dy = 20 + Math.random() * 40;
      flake.style.setProperty('--dx', `${dx}px`);
      flake.style.setProperty('--dy', `${dy}px`);

      container.appendChild(flake);
      setTimeout(() => flake.remove(), 600);
    }
  }

  initBackgroundCoins() {
    const container = document.getElementById('floating-coins-layer');
    if (!container) return;

    for (let i = 0; i < 14; i++) {
      const coin = document.createElement('div');
      coin.className = 'floating-coin';
      const size = 8 + Math.random() * 14;
      coin.style.width = `${size}px`;
      coin.style.height = `${size}px`;
      coin.style.left = `${Math.random() * 100}%`;
      coin.style.animationDuration = `${4 + Math.random() * 6}s`;
      coin.style.animationDelay = `${Math.random() * 5}s`;
      container.appendChild(coin);
    }
  }

  initFireworks() {
    const canvas = document.getElementById('fireworks-canvas');
    if (!canvas) return;
    this.fwCtx = canvas.getContext('2d');
    this.fireworks = [];
    this.fwRunning = false;

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);
  }

  startFireworks(duration = 4000) {
    const canvas = document.getElementById('fireworks-canvas');
    if (!canvas || this.fwRunning) return;
    this.fwRunning = true;

    const colors = ['#ffd700', '#ff3366', '#33ccff', '#ff9900', '#ffffff', '#ff0055'];
    const particles = [];

    const spawnBurst = () => {
      const cx = canvas.width * (0.2 + Math.random() * 0.6);
      const cy = canvas.height * (0.2 + Math.random() * 0.5);
      const color = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < 45; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          alpha: 1,
          size: 2 + Math.random() * 3
        });
      }
    };

    const interval = setInterval(spawnBurst, 250);
    spawnBurst();

    const animate = () => {
      if (!this.fwRunning) {
        this.fwCtx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      this.fwCtx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        p.alpha -= 0.016;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
        this.fwCtx.save();
        this.fwCtx.globalAlpha = p.alpha;
        this.fwCtx.fillStyle = p.color;
        this.fwCtx.beginPath();
        this.fwCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.fwCtx.fill();
        this.fwCtx.restore();
      }
      requestAnimationFrame(animate);
    };
    animate();

    setTimeout(() => {
      clearInterval(interval);
      setTimeout(() => {
        this.fwRunning = false;
      }, 1000);
    }, duration);
  }
}

// Start Game on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.game = new ScratchGame();
});
