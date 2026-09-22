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
  { id: 1, name: 'សំបុត្រមាស 5សន្លឹក', amount: '5សន្លឹក', icon: 'images/ticket_gold_5_pro.png', type: 'gold', godIndex: 1 },
  { id: 2, name: 'ទេវតាទ្រព្យ+1', amount: 'ទេវតា', icon: 'images/ticket_god_pro.png', type: 'god', godIndex: 2 },
  { id: 3, name: 'សំបុត្រមាស 10សន្លឹក', amount: '10សន្លឹក', icon: 'images/ticket_gold_10_pro.png', type: 'gold', godIndex: 3 },
  { id: 4, name: 'ស្រោមក្រហម 88$', amount: '88$', icon: 'images/ticket_redpacket_pro.png', type: 'cash', godIndex: 4 },
  { id: 5, name: 'ទេវតាទ្រព្យ+1', amount: 'ទេវតា', icon: 'images/ticket_god_pro.png', type: 'god', godIndex: 5 },
  { id: 6, name: 'រង្វាន់ធំ 888$', amount: '888$', icon: 'images/ticket_grand_888_pro.png', type: 'grand', isGrand: true }
];



// Main Game Controller
class ScratchGame {
  constructor() {
    this.revealedCards = new Set();
    this.unlockedGods = 0;
    this.isAutoScratching = false;

    // Authentic FAFA558 circular stamp image
    this.stampImg = new Image();
    this.stampImg.src = 'images/stamp_circle-new.png';
    this.stampReady = false;
    this.stampImg.onload = () => {
      this.stampReady = true;
      this.initSlots();
    };
    this.stampImg.onerror = () => {
      this.stampReady = false;
      this.initSlots();
    };

    this.initUI();
    this.initBackgroundCoins();
    this.initFireworks();

    // Resize listener for responsive canvas buffer recalculation
    window.addEventListener('resize', () => {
      this.refreshCanvases();
    });
  }

  initUI() {


    // More info button
    const moreBtn = document.querySelector('.nav-btn-more');
    if (moreBtn) {
      moreBtn.addEventListener('click', () => this.openWelfareModal());
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

      // Setup Canvas Scratch Engine
      this.setupCanvas(canvas, slot, card, index);
    });
  }

  refreshCanvases() {
    CARD_DATA.forEach((card) => {
      if (this.revealedCards.has(card.id)) return;
      const slot = document.getElementById(`slot-${card.id}`);
      if (!slot) return;
      const canvas = slot.querySelector('.scratch-canvas');
      if (!canvas) return;
      const rect = slot.getBoundingClientRect();
      const size = Math.round(rect.width) || 100;
      const dpr = Math.min(window.devicePixelRatio || 2, 2.5);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      const ctx = canvas.getContext('2d');
      this.renderFoil(ctx, canvas.width, canvas.height);
    });
  }

  setupCanvas(canvas, slot, card, index) {
    const rect = slot.getBoundingClientRect();
    const size = Math.round(rect.width) || 100;
    const dpr = Math.min(window.devicePixelRatio || 2, 2.5);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
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

      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
      ctx.strokeStyle = '#000000';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const radius = canvas.width * 0.16; // scratch radius
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fill();

      if (lastPoint) {
        ctx.beginPath();
        ctx.lineWidth = radius * 2;
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
      ctx.restore();

      lastPoint = pos;
      strokeCount++;

      // Real-time particle shavings
      this.emitScratchParticles(pos.screenX, pos.screenY);

      // Instant stroke-based detection (4 strokes = ~10-15% scratched)
      if (strokeCount >= 4) {
        this.revealCard(slot, card, index);
        return;
      }

      // Check threshold every 2 strokes for pixel ratio
      if (strokeCount % 2 === 0) {
        this.checkScratchProgress(canvas, slot, card, index);
      }
    };

    const start = (e) => {
      if (this.revealedCards.has(card.id)) return;
      if (e.cancelable) e.preventDefault();
      isDrawing = true;
      lastPoint = getPos(e);
      scratch(lastPoint);
    };

    const move = (e) => {
      if (!isDrawing || this.revealedCards.has(card.id)) return;
      if (e.cancelable) e.preventDefault();
      const pos = getPos(e);
      scratch(pos);
    };

    const end = () => {
      if (!isDrawing) return;
      isDrawing = false;
      lastPoint = null;
      if (strokeCount >= 2) {
        this.revealCard(slot, card, index);
      } else {
        this.checkScratchProgress(canvas, slot, card, index);
      }
    };

    canvas.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);

    canvas.addEventListener('touchstart', start, { passive: false });
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
    window.addEventListener('touchcancel', end);
  }

  renderFoil(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.save();

    // Perfect circle clip
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - 1, 0, Math.PI * 2);
    ctx.clip();

    // Metallic gold gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#fef0c8');
    grad.addColorStop(0.25, '#f6c97a');
    grad.addColorStop(0.5, '#d48a3c');
    grad.addColorStop(0.75, '#aa571c');
    grad.addColorStop(1, '#6f2409');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Draw authentic 818 stamp
    if (this.stampReady && this.stampImg.complete && this.stampImg.naturalWidth > 0) {
      const pad = w * 0.04;
      ctx.drawImage(this.stampImg, pad, pad, w - pad * 2, h - pad * 2);
    } else {
      this.drawVectorStamp(ctx, w, h);
    }

    // Outer subtle gold bevel ring
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.85)';
    ctx.lineWidth = w * 0.03;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - w * 0.02, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  drawVectorStamp(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const r = w * 0.44;

    ctx.save();
    // Inner red seal
    ctx.fillStyle = '#a81818';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2);
    ctx.fill();

    // White outer ring
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = w * 0.025;
    ctx.stroke();

    // Gold star
    ctx.fillStyle = '#fff9c4';
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.36, r * 0.16, 0, Math.PI * 2);
    ctx.fill();

    // FAFA558 text
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.round(w * 0.14)}px 'Outfit', -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FAFA558', cx, cy + r * 0.1);

    ctx.restore();
  }

  checkScratchProgress(canvas, slot, card, index) {
    if (this.revealedCards.has(card.id)) return;

    try {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const r = w / 2 - 2;
      const rSq = r * r;

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      let circlePixels = 0;
      let transparentPixels = 0;
      const step = 8;

      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const dx = x - cx;
          const dy = y - cy;
          if (dx * dx + dy * dy <= rSq) {
            circlePixels++;
            const idx = (y * w + x) * 4 + 3;
            if (data[idx] < 45) {
              transparentPixels++;
            }
          }
        }
      }

      if (circlePixels === 0) return;
      const ratio = transparentPixels / circlePixels;
      // When 10% to 20% of the circle is scratched (threshold 10%), trigger complete 100% reveal!
      if (ratio >= 0.10) {
        this.revealCard(slot, card, index);
      }
    } catch (e) {}
  }

  revealCard(slot, card, index) {
    if (this.revealedCards.has(card.id)) return;
    this.revealedCards.add(card.id);

    slot.classList.add('revealed');

    // Fade out and clear scratch canvas completely so gift is 100% visible
    const canvas = slot.querySelector('.scratch-canvas');
    if (canvas) {
      canvas.classList.add('cleared');
      canvas.style.opacity = '0';
      canvas.style.pointerEvents = 'none';
      setTimeout(() => {
        try {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        } catch (e) {}
      }, 350);
    }

    // Sparkle burst element
    const sparkle = document.createElement('div');
    sparkle.className = 'revealed-sparkle';
    slot.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 800);

    // Mini celebration fireworks
    this.startFireworks(1500);

    // Track scratch event
    if (window.fbq) {
      fbq('trackCustom', 'Scratch_Card', {
        card_id: card.id,
        card_name: card.name,
        revealed_count: this.revealedCards.size
      });
    }

    // After 1.5s (1-3s), popup message win that gift and has button claim with link
    setTimeout(() => {
      this.openWinGiftModal(card);
    }, 1500);
  }

  openWinGiftModal(card) {
    const modal = document.getElementById('modal-win-gift');
    if (!modal) return;

    const tag = document.getElementById('win-gift-tag');
    const title = document.getElementById('win-gift-title');
    const desc = document.getElementById('win-gift-desc');
    const icon = document.getElementById('win-gift-icon');
    const amount = document.getElementById('win-gift-amount');
    const cta = document.getElementById('win-gift-cta');

    if (tag) tag.textContent = '🎉 សូមអបអរសាទរ 🎉';
    if (title) title.textContent = `អ្នកបានឈ្នះ ${card.name}!`;
    if (desc) desc.textContent = 'សូមចុចទទួលយករង្វាន់របស់អ្នកឥឡូវនេះ';
    if (icon) {
      icon.src = card.icon;
      icon.alt = card.name;
    }
    if (amount) amount.textContent = card.amount || card.name;
    if (cta) {
      cta.setAttribute('data-cta-action', `Claim ${card.name}`);
      cta.href = CONFIG.telegramUrl;
      cta.onclick = (e) => {
        e.preventDefault();
        this.handleConversionClick(`Claim ${card.name}`);
      };
    }

    modal.classList.add('active');

    if (window.fbq) {
      fbq('trackCustom', 'Win_Prize', {
        prize_name: card.name,
        prize_amount: card.amount,
        card_id: card.id
      });
      fbq('track', 'Purchase', {
        value: card.isGrand ? 888.00 : 10.00,
        currency: 'USD',
        content_name: `Win ${card.name}`
      });
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
      container.innerHTML = '<div style="text-align:center; padding: 20px; color:#888;">មិនទាន់បានកោសរង្វាន់ណាមួយទេ សូមចុចកោសឥឡូវនេះ!</div>';
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
            <span class="prize-item-status">ទទួលបានហើយ ✓</span>
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
