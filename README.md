# FAFA558 - 818理财节 集齐五路财神 刮刮乐 Minigame Landing Page

A high-converting, mobile-first interactive scratch-card landing page built for **FAFA558** based 100% on the reference video `Pin on Disney Solitaire.mp4`.

## Features
- **Authentic Visual Fidelity**: Pixel-perfect reproduction of the reference video UI, including 60fps looping background characters (Five Gods of Wealth / 五路财神), floating golden coins, glowing badges, and golden prize trays.
- **HTML5 Canvas Interactive Scratch Mechanics**:
  - Realistic scratch-off physics supporting both touch (mobile) and mouse drag (desktop).
  - Scratch shavings / golden flake particles generated in real-time.
  - Automatic reveal detection when > 38% of foil is scratched.
- **"点我刮开" Auto-Scratch Routine**: Sequential auto-reveal across all 6 slots with golden chimes and shine bursts.
- **Progress Tracking ("集齐五路财神")**:
  - Top 5 Gods of Wealth banner progression badges dynamically light up with golden flame glow as Gods are revealed.
  - Unlocking all 5 Gods triggers the Grand Victory Jackpot modal.

- **Modals & Drawers**:
  - 🎊 Grand Victory Modal (`888元 现金大奖`) with fireworks particle engine.
  - 🏆 My Prizes Drawer (`我的奖品`) displaying won tickets and cash packets.
  - 🎁 Mid-Year Welfare Pack Modal (`年中福利包`) with special deposit bonus CTA.
- **Marketing & Tracking Ready**:
  - Meta / Facebook Pixel pre-configured (`PageView`, custom `CTA_Click`, `Purchase`).
  - Telegram bot conversion routing (`CONFIG.telegramUrl`).

## Quick Start
To run locally:
```bash
# In this directory:
python -m http.server 8088
```
Open `http://localhost:8088` in any browser or mobile device.

## Configuration
Edit `js/scratch.js`:
```javascript
const CONFIG = {
  telegramUrl: 'https://t.me/fafa558kh_bot?start=minigame',
  pixelId1: '1049062040632358',
  pixelId2: '1360977495406979',
  brandName: 'FAFA558'
};
```
