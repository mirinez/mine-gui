/*
  main.js - Minecraft GUI | Portfolio Project
*/

import { ITEMS } from './items.js';

/*
   0. CONSTANTS
*/

const IMG_PX       = 38;                                     
const DPR          = Math.round(window.devicePixelRatio) || 1;
const PHY          = IMG_PX * DPR;                           
const STORAGE_KEY  = 'mc-gui-inventory';                      
const ITEM_COUNTS  = [1, 2, 4, 8, 16, 32, 64];

/*
   1. DOM REFERENCES
*/

const tooltipEl         = document.getElementById('tooltip');
const inspectorOverlay  = document.getElementById('inspector-overlay');
const inspectorClose    = document.getElementById('inspector-close');
const inspectorCanvas   = document.getElementById('inspector-canvas');
const inspectorName     = document.getElementById('inspector-name');
const inspectorId       = document.getElementById('inspector-id');
const inspectorDesc     = document.getElementById('inspector-desc');
const btnShuffle        = document.getElementById('btn-shuffle');
const btnClear          = document.getElementById('btn-clear');
const btnInfo           = document.getElementById('btn-info');

/*
   2. GHOST CANVAS SETUP
*/

const ghost = document.createElement('canvas');
ghost.id     = 'drag-ghost-canvas';
ghost.width  = PHY;
ghost.height = PHY;
ghost.style.cssText = `
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  display: none;
  width: ${IMG_PX}px;
  height: ${IMG_PX}px;
  opacity: 0.9;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
`;
document.body.appendChild(ghost);

const ghostCtx = ghost.getContext('2d');
ghostCtx.imageSmoothingEnabled = false;

/*
   3. DRAG STATE
*/

let dragSrc = null; /* { el, id, name, src, count } */

/*
   4. IMAGE CACHE
*/

const cache = {};

function getImg(src) {
  if (cache[src]) return cache[src];
  const img = new Image();
  img.src = src;
  cache[src] = img;
  return img;
}

// Preload all item images as soon as the module runs
ITEMS.forEach(item => getImg(item.src));

/*
   5. PIXEL DRAW
*/

function drawPixel(canvas, src) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const img = getImg(src);

  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };

  // Draw immediately if cached, otherwise wait for onload
  if (img.complete && img.naturalWidth) {
    render();
  } else {
    img.onload = render;
  }
}

/*
   6. WEB AUDIO SOUND EFFECTS
*/

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function resumeAudio() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playPickup() {
  resumeAudio();
  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now  = audioCtx.currentTime;
  const freq = 340 + Math.random() * 80; // slight pitch variation each pick

  osc.type            = 'sine';
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.06);

  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

  osc.start(now);
  osc.stop(now + 0.1);
}

function playPlace() {
  resumeAudio();
  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now  = audioCtx.currentTime;
  const freq = 220 + Math.random() * 40;

  osc.type            = 'sine';
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.4, now + 0.07);

  gain.gain.setValueAtTime(0.14, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  osc.start(now);
  osc.stop(now + 0.12);
}

function playWhoosh() {
  resumeAudio();
  const bufSize = audioCtx.sampleRate * 0.12;
  const buffer  = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const data    = buffer.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);

  const src    = audioCtx.createBufferSource();
  const filter = audioCtx.createBiquadFilter();
  const gain   = audioCtx.createGain();

  src.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(600, audioCtx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(3000, audioCtx.currentTime + 0.1);
  filter.Q.value = 0.8;

  src.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

  src.start();
}

/*
   7. SLOT BUILDER
*/

function buildSlots(containerId, count, prefix) {
  const container = document.getElementById(containerId);
  for (let i = 0; i < count; i++) {
    const slot = document.createElement('div');
    slot.className    = 'slot';
    slot.dataset.slot = prefix + i;
    container.appendChild(slot);
  }
}

/*
   8. SLOT HELPERS
*/

function itemDataFrom(el) {
  const id    = el.dataset.itemId;
  const name  = el.dataset.itemName;
  const src   = el.dataset.itemSrc;
  const count = el.dataset.count ? Number(el.dataset.count) : null;
  if (!id) return null;
  return { id, name, src, count };
}

function placeItem(slot, id, name, src, count = null, animate = true) {
  slot.innerHTML = ''; /* clear any previous content */

  if (src.endsWith('.gif')) {
    // Animated GIF path
    const img   = document.createElement('img');
    img.src     = src;
    img.alt     = name;
    img.style.cssText = `
      display: block;
      pointer-events: none;
      user-select: none;
      width: ${IMG_PX}px;
      height: ${IMG_PX}px;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    `;
    if (animate) {
      img.classList.add('item-enter');
      img.addEventListener('animationend', () => img.classList.remove('item-enter'), { once: true });
    }
    slot.appendChild(img);

  } else {
    // Static PNG path, canvas nearest-neighbour
    const canvas  = document.createElement('canvas');
    canvas.width  = PHY;
    canvas.height = PHY;
    canvas.style.cssText = `
      display: block;
      pointer-events: none;
      user-select: none;
      width: ${IMG_PX}px;
      height: ${IMG_PX}px;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    `;
    if (animate) {
      canvas.classList.add('item-enter');
      canvas.addEventListener('animationend', () => canvas.classList.remove('item-enter'), { once: true });
    }
    slot.appendChild(canvas);
    drawPixel(canvas, src);
  }

  slot.dataset.itemId   = id;
  slot.dataset.itemName = name;
  slot.dataset.itemSrc  = src;

  // Set or remove the count badge
  if (count !== null && count > 1) {
    slot.dataset.count = count;
  } else {
    delete slot.dataset.count;
  }
}

function clearSlot(slot) {
  slot.innerHTML = '';
  delete slot.dataset.itemId;
  delete slot.dataset.itemName;
  delete slot.dataset.itemSrc;
  delete slot.dataset.count;
}

/*
   9. LOCALSTORAGE PERSISTENCE
*/

function saveState() {
  const state = {};
  document.querySelectorAll('.slot').forEach(slot => {
    const key  = slot.dataset.slot;
    const data = itemDataFrom(slot);
    if (data) state[key] = data;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;

  let state;
  try {
    state = JSON.parse(raw);
  } catch {
    return false;
  }
  
  if (Object.keys(state).length === 0) return false;

  Object.entries(state).forEach(([key, data]) => {
    const slot = document.querySelector(`.slot[data-slot="${key}"]`);
    if (slot && data?.id) placeItem(slot, data.id, data.name, data.src, data.count ?? null, false);
  });

  return true;
}

/*
   10. FILL INVENTORY
*/

function fillInventory() {
  const inventorySlots = [
    ...document.querySelectorAll('#inventory-slots .slot'),
    ...document.querySelectorAll('#hotbar-slots .slot'),
  ];

  // Clear all slots including the bag
  document.querySelectorAll('.slot').forEach(clearSlot);

  const shuffled = [...ITEMS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Stagger placement slightly for a wave animation effect
  shuffled.forEach((item, i) => {
    if (i >= inventorySlots.length) return;
    const count = ITEM_COUNTS[Math.floor(Math.random() * ITEM_COUNTS.length)];
    setTimeout(() => {
      placeItem(inventorySlots[i], item.id, item.name, item.src, count, true);
    }, i * 18); // 18 ms delay per slot produces a ~432 ms wave across 24 items
  });

  saveState();
}

/*
   11. TOOLTIP
*/

document.addEventListener('mousemove', e => {
  if (dragSrc) {
    tooltipEl.style.display = 'none';
    return;
  }

  const t    = e.target.closest('.slot[data-item-name]');
  const name = t?.dataset?.itemName;

  if (!name) {
    tooltipEl.style.display = 'none';
    return;
  }

  tooltipEl.textContent   = name;
  tooltipEl.style.display = 'block';
  tooltipEl.style.left    = (e.clientX + 14) + 'px';
  tooltipEl.style.top     = (e.clientY + 14) + 'px';
});

/*
   12. GHOST POSITIONING
*/

function moveGhost(x, y) {
  ghost.style.left = (x - IMG_PX / 2) + 'px';
  ghost.style.top  = (y - IMG_PX / 2) + 'px';
}

document.addEventListener('mousemove', e => {
  if (dragSrc) moveGhost(e.clientX, e.clientY);
});

/*
   13. DRAG & DROP
*/

document.addEventListener('pointerdown', e => {
  const el = e.target.closest('.slot');
  if (!el) return;

  const data = itemDataFrom(el);
  if (!data) return;
  e.preventDefault();
  dragSrc = { el, ...data };

  ghostCtx.clearRect(0, 0, PHY, PHY);
  drawPixel(ghost, data.src);
  moveGhost(e.clientX, e.clientY);
  ghost.style.display     = 'block';
  el.style.opacity        = '0.3';
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

    if (target.dataset.itemId) {
      placeItem(el, target.dataset.itemId, target.dataset.itemName, target.dataset.itemSrc,
        target.dataset.count ? Number(target.dataset.count) : null);
    } else {
      clearSlot(el);
    }

    placeItem(target, id, name, src, count);
    playPlace();
    saveState();
  }

  dragSrc = null;
});

document.addEventListener('pointercancel', () => {
  if (!dragSrc) return;
  dragSrc.el.style.opacity = '1';
  ghost.style.display      = 'none';
  document.querySelectorAll('.slot.drag-over').forEach(s => s.classList.remove('drag-over'));
  dragSrc = null;
});

/*
   14. RIGHT-CLICK TO CLEAR
*/

document.addEventListener('contextmenu', e => {
  const slot = e.target.closest('.slot');
  if (!slot) return;
  e.preventDefault();
  if (slot.dataset.itemId) {
    clearSlot(slot);
    saveState();
  }
});

/*
   15. DOUBLE-CLICK INSPECTOR
*/

/* Short flavour descriptions keyed by item id */
const DESCRIPTIONS = {
  arrow:                    'Fired from a bow. Stacks up to 64. Watch your fingers.',
  bamboo:                   'Grows fast. Eaten by pandas. Great for scaffolding.',
  blue_egg:                 'Laid by a blue chicken... probably. Handle with care.',
  bush:                     'A humble plant. Decorative and surprisingly flammable.',
  emerald:                  'The currency of villagers everywhere. Very shiny.',
  eye_of_ender:             'Points toward the nearest stronghold. Slightly unsettling.',
  flow_banner_pattern:      'A rare pattern that gives banners a flowing, liquid look.',
  iron_hoe:                 'For tilling soil. Tragically underrated by adventurers.',
  locked_map:               'A map sealed by a cartographer. Contents: unknown.',
  mangrove_propagule:       'Plant it in water and watch a mangrove tree grow slowly.',
  milk_bucket:              'Cures all status effects. Also good with cookies.',
  music_disc:               'Play it in a jukebox and set the mood for mining.',
  name_tag:                 'Rename any mob. Name a sheep "jeb_" for a surprise.',
  painting:                 'Covers an ugly wall. One of 48 possible artworks.',
  potion_of_oozing:         'Causes the drinker to spawn slimes on death. Gross.',
  sea_pickle:               'Glows underwater. Not actually a pickle.',
  seagrass:                 'Grows in oceans. Turtles love to eat it.',
  slime_spawn_egg:          'Spawns a slime. Bouncy, sticky, and oddly endearing.',
  sugar_cane:               'Grows near water. Turns into sugar or paper.',
  torchflower_seed:         'Plant it and a glowing torchflower will bloom.',
  turtle_egg:               'Fragile. Hatch it on a beach. Do not stomp.',
  weathered_copper_lantern: 'A lantern worn green by time. Still lights the way.',
  white_candle:             'Gentle light source. Burns beautifully in the dark.',
  world:                    'A mysterious orb containing an entire world inside.',
};

function openInspector(data) {
  inspectorName.textContent = data.name;
  inspectorId.textContent   = `ID: ${data.id}`;
  inspectorDesc.textContent = DESCRIPTIONS[data.id] ?? 'A mysterious item from the world of Minecraft.';

  // Draw a large preview into the inspector canvas
  const ctx = inspectorCanvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  if (data.src.endsWith('.gif')) {
    inspectorCanvas.style.display = 'none';
    let gifPreview = inspectorOverlay.querySelector('.inspector-gif-preview');
    if (!gifPreview) {
      gifPreview = document.createElement('img');
      gifPreview.className = 'inspector-gif-preview';
      gifPreview.style.cssText = `
        width: 48px; height: 48px;
        image-rendering: pixelated;
        image-rendering: crisp-edges;
      `;
      inspectorCanvas.parentNode.appendChild(gifPreview);
    }
    gifPreview.src   = data.src;
    gifPreview.style.display = 'block';
  } else {
    // PNG - draw into the canvas
    inspectorCanvas.style.display = 'block';
    const gifPreview = inspectorOverlay.querySelector('.inspector-gif-preview');
    if (gifPreview) gifPreview.style.display = 'none';
    drawPixel(inspectorCanvas, data.src);
  }

  inspectorOverlay.hidden = false;
}

function closeInspector() {
  inspectorOverlay.hidden = true;
}

document.addEventListener('dblclick', e => {
  const slot = e.target.closest('.slot');
  if (!slot) return;
  const data = itemDataFrom(slot);
  if (!data) return;
  openInspector(data);
});

inspectorClose.addEventListener('click', closeInspector);

/* Close inspector when clicking the dark overlay outside the panel */
inspectorOverlay.addEventListener('click', e => {
  if (e.target === inspectorOverlay) closeInspector();
});

/* Close inspector with Escape key */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !inspectorOverlay.hidden) closeInspector();
});

/*
   16. TOOLBAR ACTIONS
*/

btnInfo.addEventListener('click', () => {
  hintPanel.classList.remove('hint-hiding');
  hintPanel.hidden = false;
  document.addEventListener('pointerdown', onHintDismiss);
  setTimeout(dismissHint, 6000);
});

btnShuffle.addEventListener('click', () => {
  playWhoosh();
  fillInventory();
});

btnClear.addEventListener('click', () => {
  document.querySelectorAll('.slot').forEach(clearSlot);
  saveState();
});

/*
   17. INIT
*/

buildSlots('inventory-slots', 27, 'inv');
buildSlots('hotbar-slots',     9, 'hot'); 

const restored = loadState();
if (!restored) fillInventory();

/* 
   18. FIRST-VISIT HINT PANEL
*/

const HINT_KEY  = 'mc-gui-hint-seen';
const hintPanel = document.getElementById('hint-panel');

function dismissHint() {
  hintPanel.classList.add('hint-hiding');
  hintPanel.addEventListener('animationend', () => {
    hintPanel.hidden = true;
    hintPanel.classList.remove('hint-hiding');
  }, { once: true });
  localStorage.setItem(HINT_KEY, '1');
  document.removeEventListener('pointerdown', onHintDismiss);
}

function onHintDismiss() { dismissHint(); }

if (!localStorage.getItem(HINT_KEY)) {
  setTimeout(() => {
    hintPanel.hidden = false;
    document.addEventListener('pointerdown', onHintDismiss);
    setTimeout(dismissHint, 6000);
  }, 400);
}
