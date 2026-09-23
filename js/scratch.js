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

// 6 Cards Definition using new Angpao assets (50$ and 100$ only)
const CARD_DATA = [
  { id: 1, name: 'អាំងប៉ាវ 50$', amount: '50$', icon: 'images/angpao_50.png', type: 'gold', godIndex: 1 },
  { id: 2, name: 'អាំងប៉ាវ 100$', amount: '100$', icon: 'images/angpao_100.png', type: 'grand', isGrand: true, godIndex: 2 },
  { id: 3, name: 'អាំងប៉ាវ 50$', amount: '50$', icon: 'images/angpao_50.png', type: 'cash', godIndex: 3 },
  { id: 4, name: 'អាំងប៉ាវ 100$', amount: '100$', icon: 'images/angpao_100.png', type: 'gold', godIndex: 4 },
  { id: 5, name: 'អាំងប៉ាវ 50$', amount: '50$', icon: 'images/angpao_50.png', type: 'god', godIndex: 5 },
  { id: 6, name: 'អាំងប៉ាវ 100$', amount: '100$', icon: 'images/angpao_100.png', type: 'cash', isGrand: true }
];



// Main Game Controller
class ScratchGame {
  constructor() {
    this.revealedCards = new Set();
    this.unlockedGods = 0;
    this.isAutoScratching = false;

    // Preload Money Bill banknote image for money rain/snow celebration
    this.moneyBillImg = new Image();
    this.moneyBillImg.src = 'images/money_bill.png';

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

    // Stage Play Again Button
    const scratchBtn = document.getElementById('btn-auto-scratch');
    if (scratchBtn) {
      scratchBtn.addEventListener('click', () => {
        this.resetGame();
      });
    }

    // Modal Retry / Play Again Buttons
    document.querySelectorAll('.modal-retry-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.resetGame();
      });
    });

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
        this.stopModalCongrats();
        this.stopModalXRay();
      });
    });

    // Close modal when clicking dark backdrop
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
          this.stopModalCongrats();
          this.stopModalXRay();
        }
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

    // Fast, security-safe coverage grid (12x12) to accurately calculate 30-50% scratch area
    // without ever failing due to CORS / file:/// canvas export restrictions!
    const GRID_SIZE = 12;
    const scratchedCells = new Set();
    const cellRadius = canvas.width / GRID_SIZE;
    const centerCell = (GRID_SIZE - 1) / 2;
    const circleRadiusInCells = (GRID_SIZE / 2) - 0.35;
    let totalValidCircleCells = 0;

    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const d = Math.hypot(gx - centerCell, gy - centerCell);
        if (d <= circleRadiusInCells) {
          totalValidCircleCells++;
        }
      }
    }

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

      // Mark scratched cells in grid
      const brushRadius = canvas.width * 0.16;
      const minGx = Math.max(0, Math.floor((pos.x - brushRadius) / cellRadius));
      const maxGx = Math.min(GRID_SIZE - 1, Math.floor((pos.x + brushRadius) / cellRadius));
      const minGy = Math.max(0, Math.floor((pos.y - brushRadius) / cellRadius));
      const maxGy = Math.min(GRID_SIZE - 1, Math.floor((pos.y + brushRadius) / cellRadius));

      for (let gy = minGy; gy <= maxGy; gy++) {
        for (let gx = minGx; gx <= maxGx; gx++) {
          const cellCenterX = (gx + 0.5) * cellRadius;
          const cellCenterY = (gy + 0.5) * cellRadius;
          if (Math.hypot(pos.x - cellCenterX, pos.y - cellCenterY) <= brushRadius * 1.05) {
            const dCenter = Math.hypot(gx - centerCell, gy - centerCell);
            if (dCenter <= circleRadiusInCells) {
              scratchedCells.add(`${gx},${gy}`);
            }
          }
        }
      }

      const coverageRatio = totalValidCircleCells > 0 ? (scratchedCells.size / totalValidCircleCells) : 0;

      // Real-time particle shavings
      this.emitScratchParticles(pos.screenX, pos.screenY);

      // If user scratched 35%+ (in 30-50% range requested by user), reveal card!
      if (coverageRatio >= 0.35) {
        this.revealCard(slot, card, index);
        return;
      }

      // Check threshold every 3 strokes for actual pixel ratio if available
      if (strokeCount % 3 === 0) {
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
      const coverageRatio = totalValidCircleCells > 0 ? (scratchedCells.size / totalValidCircleCells) : 0;
      if (coverageRatio >= 0.30) {
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
      // Require 35% (in the 30-50% range requested by user) scratched before complete reveal!
      if (ratio >= 0.35) {
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

    const headText = document.getElementById('win-gift-head-text');
    const tagText = document.getElementById('win-gift-tag-text');
    const desc = document.getElementById('win-gift-desc');
    const icon = document.getElementById('win-gift-icon');
    const amountNum = document.getElementById('win-gift-amount-num');
    const cta = document.getElementById('win-gift-cta');
    const ctaPrice = document.getElementById('win-gift-cta-price');

    const cleanNum = (card.amount || '50$').replace(/[^0-9]/g, '');

    if (headText) headText.textContent = 'កាតរង្វាន់សំណាង FAFA558';
    if (tagText) tagText.textContent = 'សូមអបអរសាទរ';
    if (desc) desc.textContent = 'ទទួលបានភ្លាមៗ';
    if (icon) {
      icon.src = 'images/popup_tickets_ring.png';
      icon.alt = 'កាតរង្វាន់';
    }
    if (amountNum) amountNum.textContent = cleanNum || '50';
    const ctaLabel = document.getElementById('win-gift-cta-label');
    if (ctaLabel) ctaLabel.textContent = 'ចុចទាមទាររង្វាន់';
    if (ctaPrice) ctaPrice.textContent = '';
    if (cta) {
      cta.setAttribute('data-cta-action', `Claim ${card.name}`);
      cta.href = CONFIG.telegramUrl;
      cta.onclick = (e) => {
        e.preventDefault();
        this.handleConversionClick(`Claim ${card.name}`);
      };
    }

    modal.classList.add('active');
    this.startModalXRay('xray-canvas-win-gift');
    this.startModalCongrats('congrats-canvas-win-gift');

    // Reveal stage "Play Again" button after scratching & win popup
    const controlsRow = document.getElementById('controls-row');
    if (controlsRow) {
      controlsRow.classList.add('active');
    }

    if (window.fbq) {
      fbq('trackCustom', 'Win_Prize', {
        prize_name: card.name,
        prize_amount: card.amount,
        card_id: card.id
      });
      fbq('track', 'Purchase', {
        value: card.amount === '100$' ? 100.00 : 50.00,
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

  resetGame() {
    this.revealedCards.clear();
    this.unlockedGods = 0;
    this.isAutoScratching = false;

    // Reset god badges if present
    for (let i = 1; i <= 5; i++) {
      const badge = document.getElementById(`god-badge-${i}`);
      if (badge) badge.classList.remove('unlocked');
    }

    // Stop and clear fireworks & modal congrats & xray
    this.fwRunning = false;
    this.stopModalCongrats();
    this.stopModalXRay();
    if (this.fwCtx) {
      const canvas = document.getElementById('fireworks-canvas');
      if (canvas) {
        this.fwCtx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    // Close any active modal
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.classList.remove('active');
    });

    // Re-initialize scratch slots cleanly
    this.initSlots();

    // Hide stage "Play Again" button so fresh game has no button
    const controlsRow = document.getElementById('controls-row');
    if (controlsRow) {
      controlsRow.classList.remove('active');
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
      this.startModalXRay('xray-canvas-grand-win');
      this.startModalCongrats('congrats-canvas-grand-win');

      const controlsRow = document.getElementById('controls-row');
      if (controlsRow) {
        controlsRow.classList.add('active');
      }

      if (window.fbq) {
        fbq('track', 'Purchase', {
          value: 100.00,
          currency: 'USD',
          content_name: '100$ Cash Grand Prize'
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

  /* Celebration Money Snow & Fluttering Dollar Bills Shower for Win Modals */
  startModalCongrats(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    this.stopModalCongrats();
    this.congratsRunning = true;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth : (this.stage ? this.stage.clientWidth : window.innerWidth);
    canvas.height = canvas.parentElement ? canvas.parentElement.clientHeight : (this.stage ? this.stage.clientHeight : window.innerHeight);

    if (!this.moneyBillImg) {
      this.moneyBillImg = new Image();
      this.moneyBillImg.src = 'images/money_bill.png';
    }

    const billAspect = 192 / 432; // height / width
    const particles = [];
    const billCount = 36;
    const coinCount = 16;
    const sparkleCount = 20;

    // Dollar Bills Particles (3D tumbling money snow)
    for (let i = 0; i < billCount; i++) {
      const w = (42 + Math.random() * 30) * (canvas.width / 390);
      const h = w * billAspect;
      particles.push({
        type: 'bill',
        x: Math.random() * canvas.width,
        y: (Math.random() * 1.5 - 0.5) * canvas.height,
        w: w,
        h: h,
        vy: 1.8 + Math.random() * 2.6,
        vx: (Math.random() - 0.5) * 1.4,
        rotZ: Math.random() * Math.PI * 2,
        rotSpeedZ: (Math.random() - 0.5) * 0.035,
        rotY: Math.random() * Math.PI * 2,
        rotSpeedY: 0.025 + Math.random() * 0.045,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.03 + Math.random() * 0.03,
        wobbleAmp: 1.2 + Math.random() * 1.8,
        opacity: 0.88 + Math.random() * 0.12,
        scale: 0.8 + Math.random() * 0.35
      });
    }

    // Shiny Gold Coins Particles
    for (let i = 0; i < coinCount; i++) {
      const radius = (10 + Math.random() * 8) * (canvas.width / 390);
      particles.push({
        type: 'coin',
        x: Math.random() * canvas.width,
        y: (Math.random() * 1.5 - 0.5) * canvas.height,
        radius: radius,
        vy: 2.0 + Math.random() * 2.8,
        vx: (Math.random() - 0.5) * 1.5,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05,
        flip: Math.random() * Math.PI * 2,
        flipSpeed: 0.04 + Math.random() * 0.06,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.04 + Math.random() * 0.04
      });
    }

    // Sparkling Gold Stars Particles
    for (let i = 0; i < sparkleCount; i++) {
      particles.push({
        type: 'sparkle',
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: (5 + Math.random() * 6) * (canvas.width / 390),
        vy: 1.0 + Math.random() * 2.0,
        vx: (Math.random() - 0.5) * 0.8,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.06 + Math.random() * 0.08,
        color: Math.random() > 0.3 ? '#ffd700' : '#ffffff'
      });
    }

    const drawGoldCoin = (cx, cy, r, flip) => {
      ctx.save();
      ctx.translate(cx, cy);
      const scaleX = Math.cos(flip);
      ctx.scale(Math.abs(scaleX) < 0.1 ? 0.1 : scaleX, 1);

      const grad = ctx.createLinearGradient(-r, -r, r, r);
      grad.addColorStop(0, '#fff6a9');
      grad.addColorStop(0.3, '#fbc02d');
      grad.addColorStop(0.7, '#f57f17');
      grad.addColorStop(1, '#ffeb3b');

      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.lineWidth = Math.max(1.5, r * 0.16);
      ctx.strokeStyle = '#fff9c4';
      ctx.stroke();

      ctx.beginPath();
      ctx.rect(-r * 0.35, -r * 0.35, r * 0.7, r * 0.7);
      ctx.strokeStyle = '#e65100';
      ctx.lineWidth = Math.max(1, r * 0.1);
      ctx.stroke();

      ctx.restore();
    };

    const drawSparkle = (cx, cy, s, alpha, color) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = color;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx, cy - s);
      ctx.lineTo(cx, cy + s);
      ctx.moveTo(cx - s, cy);
      ctx.lineTo(cx + s, cy);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    };

    const animate = () => {
      if (!this.congratsRunning) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (p.type === 'bill') {
          p.x += p.vx + Math.sin(p.wobble) * p.wobbleAmp;
          p.y += p.vy;
          p.rotZ += p.rotSpeedZ;
          p.rotY += p.rotSpeedY;
          p.wobble += p.wobbleSpeed;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotZ);

          const scaleY = Math.cos(p.rotY);
          const absScaleY = Math.max(0.12, Math.abs(scaleY));
          ctx.scale(p.scale, p.scale * absScaleY);

          ctx.globalAlpha = p.opacity;

          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
          ctx.shadowBlur = 6;
          ctx.shadowOffsetY = 4;

          if (this.moneyBillImg && this.moneyBillImg.complete && this.moneyBillImg.naturalWidth > 0) {
            ctx.drawImage(this.moneyBillImg, -p.w / 2, -p.h / 2, p.w, p.h);
          } else {
            ctx.fillStyle = '#85bb65';
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.strokeStyle = '#2e7d32';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
          }

          ctx.restore();

          if (p.y > canvas.height + 40) {
            p.y = -35;
            p.x = Math.random() * canvas.width;
            p.vy = 1.8 + Math.random() * 2.6;
            p.rotY = Math.random() * Math.PI * 2;
          }
        } else if (p.type === 'coin') {
          p.x += p.vx + Math.sin(p.wobble) * 0.8;
          p.y += p.vy;
          p.flip += p.flipSpeed;
          p.rot += p.rotSpeed;
          p.wobble += p.wobbleSpeed;

          drawGoldCoin(p.x, p.y, p.radius, p.flip);

          if (p.y > canvas.height + 30) {
            p.y = -25;
            p.x = Math.random() * canvas.width;
            p.vy = 2.0 + Math.random() * 2.8;
          }
        } else if (p.type === 'sparkle') {
          p.x += p.vx;
          p.y += p.vy;
          p.pulse += p.pulseSpeed;

          const alpha = 0.4 + Math.sin(p.pulse) * 0.5;
          drawSparkle(p.x, p.y, p.size, alpha, p.color);

          if (p.y > canvas.height + 20) {
            p.y = -15;
            p.x = Math.random() * canvas.width;
            p.vy = 1.0 + Math.random() * 2.0;
          }
        }
      }

      this.congratsAnimId = requestAnimationFrame(animate);
    };

    this.congratsAnimId = requestAnimationFrame(animate);
  }

  stopModalCongrats() {
    this.congratsRunning = false;
    if (this.congratsAnimId) {
      cancelAnimationFrame(this.congratsAnimId);
      this.congratsAnimId = null;
    }
    ['congrats-canvas-win-gift', 'congrats-canvas-grand-win'].forEach(id => {
      const c = document.getElementById(id);
      if (c) {
        const ctx = c.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, c.width, c.height);
      }
    });
  }

  /* Dynamic Volumetric God-Rays / X-Ray Engine (AAA Casino Heavenly Light Shafts + Sunburst Aura) */
  startModalXRay(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    this.stopModalXRay();
    this.xrayRunning = true;

    const ctx = canvas.getContext('2d');
    const stageWidth = this.stage ? this.stage.clientWidth : (canvas.parentElement ? canvas.parentElement.clientWidth : 360);
    const stageHeight = this.stage ? this.stage.clientHeight : (canvas.parentElement ? canvas.parentElement.clientHeight : 640);
    canvas.width = stageWidth;
    canvas.height = stageHeight;

    const cx = canvas.width / 2;
    const cy = canvas.height * 0.48; // Centered right behind the prize showcase box
    const maxRadius = Math.hypot(canvas.width, canvas.height) * 1.05;

    // FAFA Brand Soft Luxury Colors: Warm Solar Gold, Soft Champagne, Amber Glow
    // Layer 1: Clockwise Soft Golden God-Rays (Volumetric subtle beams)
    const primaryRays = [];
    const primaryCount = 20;
    const primaryColors = [
      '255, 215, 60',   // Warm Gold
      '255, 235, 140',  // Soft Champagne
      '255, 190, 40',   // Rich Amber
      '255, 245, 180',  // Cream Gold
      '255, 170, 30'    // Deep Warm Gold
    ];
    for (let i = 0; i < primaryCount; i++) {
      const isMajestic = (i % 2 === 0);
      primaryRays.push({
        baseAngle: (i / primaryCount) * Math.PI * 2,
        angularSpan: isMajestic ? 0.18 : 0.09,
        color: primaryColors[i % primaryColors.length],
        baseAlpha: isMajestic ? 0.18 : 0.12,
        pulseSpeed: 0.002 + Math.random() * 0.002,
        pulseOffset: Math.random() * Math.PI * 2,
        reachFactor: 0.95 + Math.random() * 0.2
      });
    }

    // Layer 2: Counter-Clockwise Gentle Radiant Light Beams
    const secondaryRays = [];
    const secondaryCount = 14;
    const secondaryColors = [
      '255, 240, 160',  // Soft Light Gold
      '255, 220, 100',  // Amber Ray
      '255, 250, 200'   // Warm Diamond
    ];
    for (let i = 0; i < secondaryCount; i++) {
      secondaryRays.push({
        baseAngle: (i / secondaryCount) * Math.PI * 2 + 0.22,
        angularSpan: (i % 2 === 0 ? 0.07 : 0.12),
        color: secondaryColors[i % secondaryColors.length],
        baseAlpha: 0.10 + Math.random() * 0.08,
        pulseSpeed: 0.0025 + Math.random() * 0.002,
        pulseOffset: Math.random() * Math.PI * 2,
        reachFactor: 0.85 + Math.random() * 0.2
      });
    }

    // Layer 3: Floating Golden Stardust & Twinkle Stars
    const motes = [];
    const moteCount = 24;
    for (let i = 0; i < moteCount; i++) {
      motes.push({
        x: cx + (Math.random() - 0.5) * canvas.width * 0.95,
        y: cy + (Math.random() - 0.5) * canvas.height * 0.95,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.5 - Math.random() * 0.8,
        size: 2.0 + Math.random() * 3.5,
        rot: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.03,
        color: Math.random() < 0.6 ? '#ffd700' : (Math.random() < 0.85 ? '#ffffff' : '#ffb700'),
        alpha: 0.3 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Expanding Energy Shockwave Rings
    const rings = [];
    let lastRingTime = 0;

    const startTime = performance.now();
    let rotCW = 0;
    let rotCCW = 0;

    // Helper to draw brilliant multi-pointed lens flare star
    const drawFlareStar = (x, y, radius, rot, color, alpha, points = 4, innerRatio = 0.18) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      const inner = radius * innerRatio;
      for (let s = 0; s < points; s++) {
        const a1 = (s * Math.PI * 2) / points;
        const a2 = a1 + (Math.PI / points);
        ctx.lineTo(Math.cos(a1) * radius, Math.sin(a1) * radius);
        ctx.lineTo(Math.cos(a2) * inner, Math.sin(a2) * inner);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const animateXRay = (now) => {
      if (!this.xrayRunning) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      const elapsed = now - startTime;
      rotCW += 0.0035;   // Slower, calmer rotation
      rotCCW -= 0.0028;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Additive blend mode for luminous ambient glow
      ctx.globalCompositeOperation = 'lighter';

      // 1. Central Celestial Supernova Halo (Soft warm ambient backdrop)
      const corePulse = 1 + 0.10 * Math.sin(elapsed * 0.003);
      const coreRadius = Math.max(canvas.width, canvas.height) * 0.55 * corePulse;
      const coreGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, coreRadius);
      coreGrad.addColorStop(0, 'rgba(255, 245, 210, 0.45)');
      coreGrad.addColorStop(0.25, 'rgba(255, 215, 60, 0.22)');
      coreGrad.addColorStop(0.55, 'rgba(255, 160, 20, 0.10)');
      coreGrad.addColorStop(0.85, 'rgba(255, 120, 0, 0.03)');
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Layer 1: Clockwise Soft Golden God-Rays
      for (let i = 0; i < primaryRays.length; i++) {
        const r = primaryRays[i];
        const aCenter = r.baseAngle + rotCW;
        const halfSpan = r.angularSpan / 2;
        const aStart = aCenter - halfSpan;
        const aEnd = aCenter + halfSpan;
        const pulse = 0.85 + 0.2 * Math.sin(elapsed * r.pulseSpeed + r.pulseOffset);
        const currentAlpha = r.baseAlpha * pulse;

        const rayDist = maxRadius * r.reachFactor;
        const rayGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, rayDist);
        rayGrad.addColorStop(0, `rgba(${r.color}, ${Math.min(1, currentAlpha * 1.3)})`);
        rayGrad.addColorStop(0.3, `rgba(${r.color}, ${currentAlpha})`);
        rayGrad.addColorStop(0.7, `rgba(${r.color}, ${currentAlpha * 0.35})`);
        rayGrad.addColorStop(1, `rgba(${r.color}, 0)`);

        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, rayDist, aStart, aEnd);
        ctx.closePath();
        ctx.fill();
      }

      // 3. Layer 2: Counter-Clockwise Gentle Radiant Light Beams
      for (let i = 0; i < secondaryRays.length; i++) {
        const r = secondaryRays[i];
        const aCenter = r.baseAngle + rotCCW;
        const halfSpan = r.angularSpan / 2;
        const aStart = aCenter - halfSpan;
        const aEnd = aCenter + halfSpan;
        const pulse = 0.8 + 0.25 * Math.sin(elapsed * r.pulseSpeed + r.pulseOffset);
        const currentAlpha = r.baseAlpha * pulse;

        const rayDist = maxRadius * r.reachFactor;
        const rayGrad = ctx.createRadialGradient(cx, cy, 25, cx, cy, rayDist);
        rayGrad.addColorStop(0, `rgba(${r.color}, ${Math.min(1, currentAlpha * 1.3)})`);
        rayGrad.addColorStop(0.35, `rgba(${r.color}, ${currentAlpha})`);
        rayGrad.addColorStop(0.75, `rgba(${r.color}, ${currentAlpha * 0.3})`);
        rayGrad.addColorStop(1, `rgba(${r.color}, 0)`);

        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, rayDist, aStart, aEnd);
        ctx.closePath();
        ctx.fill();
      }

      // 4. Subtle Anamorphic Center Horizontal Flare
      const anamorphicPulse = 1 + 0.15 * Math.sin(elapsed * 0.004);
      const anamorphicWidth = canvas.width * 1.1;
      const anamorphicHeight = 16 * anamorphicPulse;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.sin(elapsed * 0.001) * 0.05);
      const anamGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, anamorphicWidth / 2);
      anamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
      anamGrad.addColorStop(0.2, 'rgba(255, 230, 120, 0.30)');
      anamGrad.addColorStop(0.6, 'rgba(255, 180, 40, 0.08)');
      anamGrad.addColorStop(1, 'rgba(255, 180, 40, 0)');
      ctx.fillStyle = anamGrad;
      ctx.scale(1, anamorphicHeight / (anamorphicWidth / 2));
      ctx.beginPath();
      ctx.arc(0, 0, anamorphicWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 5. Central Soft 8-Point Lens Flare Star
      const flarePulse = 1 + 0.15 * Math.sin(elapsed * 0.004);
      const flareSize = 130 * flarePulse;
      drawFlareStar(cx, cy, flareSize, rotCW * 0.5, '#fff1a8', 0.22, 8, 0.15);

      // 6. Expanding Soft Concentric Energy Shockwave Rings
      if (elapsed - lastRingTime > 1400) {
        rings.push({ radius: 30, maxRadius: Math.max(canvas.width, canvas.height) * 0.75, alpha: 0.25 });
        lastRingTime = elapsed;
      }

      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i];
        ring.radius += 2.8;
        const progress = ring.radius / ring.maxRadius;
        const ringAlpha = ring.alpha * (1 - progress);

        if (progress >= 1) {
          rings.splice(i, 1);
          continue;
        }

        ctx.strokeStyle = `rgba(255, 230, 100, ${ringAlpha})`;
        ctx.lineWidth = 1.8 * (1 - progress * 0.5);
        ctx.beginPath();
        ctx.arc(cx, cy, ring.radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 7. Floating 4-Pointed Golden Twinkle Stars
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        m.x += m.vx;
        m.y += m.vy;
        m.rot += m.rotSpeed;
        m.phase += 0.04;
        const twinkle = 0.4 + 0.6 * Math.sin(m.phase);

        drawFlareStar(m.x, m.y, m.size * (0.8 + 0.35 * twinkle), m.rot, m.color, m.alpha * twinkle, 4, 0.2);

        // Recycle mote
        if (m.y < -25 || m.x < -25 || m.x > canvas.width + 25) {
          m.y = canvas.height + 15;
          m.x = cx + (Math.random() - 0.5) * canvas.width * 0.95;
        }
      }

      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = 'source-over';

      this.xrayAnimId = requestAnimationFrame(animateXRay);
    };

    this.xrayAnimId = requestAnimationFrame(animateXRay);
  }

  stopModalXRay() {
    this.xrayRunning = false;
    if (this.xrayAnimId) {
      cancelAnimationFrame(this.xrayAnimId);
      this.xrayAnimId = null;
    }
    ['xray-canvas-win-gift', 'xray-canvas-grand-win'].forEach(id => {
      const c = document.getElementById(id);
      if (c) {
        const ctx = c.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, c.width, c.height);
      }
    });
  }
}

// Start Game on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.game = new ScratchGame();
});
