import { ITEMS } from './items.js';

/* 0. CONSTANTS */
const IMG_PX = 38;
const DPR = Math.round(window.devicePixelRatio) || 1;
const PHY = IMG_PX * DPR;
const STORAGE_KEY = 'mc-gui-inventory';
const ITEM_COUNTS = [1, 2, 4, 8, 16, 32, 64];

/* 1. DOM REFERENCES */
const tooltipEl = document.getElementById('tooltip');
const inspectorOverlay = document.getElementById('inspector-overlay');
const inspectorClose = document.getElementById('inspector-close');
const inspectorCanvas = document.getElementById('inspector-canvas');
const inspectorName = document.getElementById('inspector-name');
const inspectorId = document.getElementById('inspector-id');
const inspectorDesc = document.getElementById('inspector-desc');
const btnShuffle = document.getElementById('btn-shuffle');
const btnClear = document.getElementById('btn-clear');

/* 2. GHOST CANVAS SETUP */
const ghost = document.createElement('canvas');
ghost.id = 'drag-ghost-canvas';
ghost.width = ghost.height = PHY;
Object.assign(ghost.style, {
  position: 'fixed', pointerEvents: 'none', zIndex: '9999', display: 'none',
  width: `${IMG_PX}px`, height: `${IMG_PX}px`, opacity: '0.9', imageRendering: 'pixelated'
});
document.body.appendChild(ghost);
const ghostCtx = ghost.getContext('2d');
ghostCtx.imageSmoothingEnabled = false;

/* 3. DRAG STATE */
let dragSrc = null;

/* 4. IMAGE CACHE */
const cache = {};
const getImg = src => cache[src] || (cache[src] = Object.assign(new Image(), { src }));
ITEMS.forEach(item => getImg(item.src));

/* 5. PIXEL DRAW */
function drawPixel(canvas, src) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const img = getImg(src);
  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.complete && img.naturalWidth ? render() : img.onload = render;
}

/* 6. WEB AUDIO SOUND EFFECTS */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const resumeAudio = () => audioCtx.state === 'suspended' && audioCtx.resume();

function playOsc(freqStart, freqEnd, duration, gainStart) {
  resumeAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain).connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  osc.frequency.setValueAtTime(freqStart, now);
  osc.frequency.exponentialRampToValueAtTime(freqEnd, now + duration * 0.6);
  gain.gain.setValueAtTime(gainStart, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.start(now);
  osc.stop(now + duration);
}

const playPickup = () => playOsc(340 + Math.random() * 80, 170, 0.09, 0.18);
const playPlace = () => playOsc(220 + Math.random() * 40, 88, 0.1, 0.14);

function playWhoosh() {
  resumeAudio();
  const bufSize = audioCtx.sampleRate * 0.12, buffer = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = audioCtx.createBufferSource(), filter = audioCtx.createBiquadFilter(), gain = audioCtx.createGain();
  src.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(600, audioCtx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(3000, audioCtx.currentTime + 0.1);
  filter.Q.value = 0.8;
  src.connect(filter).connect(gain).connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, cyberCtx.currentTime + 0.15);
  src.start();
}

/* 7. SLOT BUILDER */
function buildSlots(containerId, count, prefix) {
  const container = document.getElementById(containerId);
  for (let i = 0; i < count; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.dataset.slot = prefix + i;
    container.appendChild(slot);
  }
}

/* 8. SLOT HELPERS */
const itemDataFrom = el => el.dataset.itemId ? { id: el.dataset.itemId, name: el.dataset.itemName, src: el.dataset.itemSrc, count: el.dataset.count ? Number(el.dataset.count) : null } : null;

function placeItem(slot, id, name, src, count = null, animate = true) {
  slot.innerHTML = '';
  const isGif = src.endsWith('.gif');
  const el = document.createElement(isGif ? 'img' : 'canvas');
  if (isGif) el.src = src; else el.width = el.height = PHY;
  el.alt = name;
  Object.assign(el.style, { display: 'block', pointerEvents: 'none', userSelect: 'none', width: `${IMG_PX}px`, height: `${IMG_PX}px`, imageRendering: 'pixelated' });
  if (animate) {
    el.classList.add('item-enter');
    el.addEventListener('animationend', () => el.classList.remove('item-enter'), { once: true });
  }
  slot.appendChild(el);
  if (!isGif) drawPixel(el, src);
  Object.assign(slot.dataset, { itemId: id, itemName: name, itemSrc: src });
  count && count > 1 ? slot.dataset.count = count : delete slot.dataset.count;
}

function clearSlot(slot) {
  slot.innerHTML = '';
  delete slot.dataset.itemId; delete slot.dataset.itemName; delete slot.dataset.itemSrc; delete slot.dataset.count;
}

/* 9. LOCALSTORAGE PERSISTENCE */
function saveState() {
  const state = {};
  document.querySelectorAll('.slot').forEach(s => { const d = itemDataFrom(s); if (d) state[s.dataset.slot] = d; });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!state || !Object.keys(state).length) return false;
    Object.entries(state).forEach(([k, d]) => {
      const s = document.querySelector(`.slot[data-slot="${k}"]`);
      if (s && d?.id) placeItem(s, d.id, d.name, d.src, d.count, false);
    });
    return true;
  } catch { return false; }
}

/* 10. FILL INVENTORY */
function fillInventory() {
  const slots = [...document.querySelectorAll('#inventory-slots .slot, #hotbar-slots .slot')];
  document.querySelectorAll('.slot').forEach(clearSlot);
  const shuffled = [...ITEMS].sort(() => Math.random() - 0.5);
  shuffled.forEach((item, i) => {
    if (i >= slots.length) return;
    const count = ITEM_COUNTS[Math.floor(Math.random() * ITEM_COUNTS.length)];
    setTimeout(() => placeItem(slots[i], item.id, item.name, item.src, count, true), i * 18);
  });
  saveState();
}

/* 11. TOOLTIP */
document.addEventListener('mousemove', e => {
  if (dragSrc) return tooltipEl.style.display = 'none';
  const t = e.target.closest('.slot[data-item-name]');
  if (!t) return tooltipEl.style.display = 'none';
  tooltipEl.textContent = t.dataset.itemName;
  Object.assign(tooltipEl.style, { display: 'block', left: `${e.clientX + 14}px`, top: `${e.clientY + 14}px` });
});

/* 12. GHOST POSITIONING */
const moveGhost = (x, y) => Object.assign(ghost.style, { left: `${x - IMG_PX / 2}px`, top: `${y - IMG_PX / 2}px` });
document.addEventListener('mousemove', e => dragSrc && moveGhost(e.clientX, e.clientY));

/* 13. DRAG & DROP */
document.addEventListener('pointerdown', e => {
  const el = e.target.closest('.slot');
  const data = el ? itemDataFrom(el) : null;
  if (!data) return;
  e.preventDefault();
  dragSrc = { el, ...data };
  ghostCtx.clearRect(0, 0, PHY, PHY);
  drawPixel(ghost, data.src);
  moveGhost(e.clientX, e.clientY);
  ghost.style.display = 'block';
  el.style.opacity = '0.3';
  tooltipEl.style.display = 'none';
  playPickup();
});

document.addEventListener('pointermove', e => {
  if (!dragSrc) return;
  e.preventDefault();
  moveGhost(e.clientX, e.clientY);
  document.querySelectorAll('.slot.drag-over').forEach(s => s.classList.remove('drag-over'));
  document.elementFromPoint(e.clientX, e.clientY)?.closest('.slot')?.classList.add('drag-over');
});

document.addEventListener('pointerup', e => {
  if (!dragSrc) return;
  ghost.style.display = 'none';
  document.querySelectorAll('.slot.drag-over').forEach(s => s.classList.remove('drag-over'));
  dragSrc.el.style.opacity = '1';
  const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('.slot');
  if (target && target !== dragSrc.el) {
    const { id, name, src, count, el } = dragSrc;
    const targetData = itemDataFrom(target);
    targetData ? placeItem(el, targetData.id, targetData.name, targetData.src, targetData.count) : clearSlot(el);
    placeItem(target, id, name, src, count);
    playPlace();
    saveState();
  }
  dragSrc = null;
});

document.addEventListener('pointercancel', () => {
  if (!dragSrc) return;
  dragSrc.el.style.opacity = '1';
  ghost.style.display = 'none';
  document.querySelectorAll('.slot.drag-over').forEach(s => s.classList.remove('drag-over'));
  dragSrc = null;
});

/* 14. RIGHT-CLICK TO CLEAR */
document.addEventListener('contextmenu', e => {
  const slot = e.target.closest('.slot');
  if (slot?.dataset.itemId) {
    e.preventDefault();
    clearSlot(slot);
    saveState();
  }
});

/* 15. DOUBLE-CLICK INSPECTOR */
const DESCRIPTIONS = {
  flow_banner_pattern: 'Used in a loom to apply the Flow pattern to a banner.',
  iron_hoe: 'Used to till soil, harvest specific blocks, or prepare farmland.',
  milk_bucket: 'Obtained from cows. Drinking it removes all status effects.',
  name_tag: 'Used to name namable mobs, preventing them from despawning naturally.',
  painting: 'A decorative item that can be placed on walls to display artwork.',
  white_candle: 'A light source that can be placed on blocks or cakes and lit.',
  arrow: 'Ammunition for bows, crossbows, and dispensers.',
  cauldron: 'Can hold water, lava, powder snow, or potions to wash or fill items.',
  glass_bottle: 'An empty bottle used to collect water, potions, or dragon\'s breath.',
  goat_horn: 'Dropped by goats. Can be blown to make a loud sound.',
  lingering_water_bottle: 'Creates a lingering cloud when thrown, extinguishing fires.',
  music_disc: 'Can be inserted into a jukebox to play a unique musical track.',
  photo: 'A snapshot capturing a pixelated memory from past adventures.',
  wind_charge: 'Dropped by breezes. Can be thrown to create a burst of wind.',
  black_bed: 'Allows players to sleep through the night and reset spawn points.',
  deepslate_tiles: 'A durable and dark decorative building block made from deepslate.'
};

function openInspector(data) {
  inspectorName.textContent = data.name;
  inspectorId.textContent = `ID: ${data.id}`;
  inspectorDesc.textContent = DESCRIPTIONS[data.id] || 'A mysterious item from the world of Minecraft.';
  const isGif = data.src.endsWith('.gif');
  inspectorCanvas.style.display = isGif ? 'none' : 'block';
  let preview = inspectorOverlay.querySelector('.inspector-gif-preview');
  if (isGif) {
    if (!preview) {
      preview = Object.assign(document.createElement('img'), { className: 'inspector-gif-preview' });
      Object.assign(preview.style, { width: '48px', height: '48px', imageRendering: 'pixelated' });
      inspectorCanvas.parentNode.appendChild(preview);
    }
    preview.src = data.src;
    preview.style.display = 'block';
  } else {
    if (preview) preview.style.display = 'none';
    drawPixel(inspectorCanvas, data.src);
  }
  inspectorOverlay.hidden = false;
}

const closeInspector = () => inspectorOverlay.hidden = true;
document.addEventListener('dblclick', e => { const s = e.target.closest('.slot'); const d = s ? itemDataFrom(s) : null; d && openInspector(d); });
inspectorClose.addEventListener('click', closeInspector);
inspectorOverlay.addEventListener('click', e => e.target === inspectorOverlay && closeInspector());
document.addEventListener('keydown', e => e.key === 'Escape' && !inspectorOverlay.hidden && closeInspector());

/* 16. TOOLBAR ACTIONS */
btnShuffle.addEventListener('click', () => { playWhoosh(); fillInventory(); });
btnClear.addEventListener('click', () => { document.querySelectorAll('.slot').forEach(clearSlot); saveState(); });

/* 17. INIT */
buildSlots('inventory-slots', 27, 'inv');
buildSlots('hotbar-slots', 9, 'hot');
if (!loadState()) fillInventory();
