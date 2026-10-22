/* ================================================================
   Holi Gift Box — script.js
   Single scene. Heavy zoom so box fills screen.
   ================================================================ */

const DEMO_SCENES = Object.freeze({full:'default',shop:'default','rupay-apply':'rupay-cc-apply','rupay-link':'rupay-cc-linking',wallet:'zapp-account','card-shop':'spc-cards'});
const requestedScene = new URLSearchParams(location.search).get('scene') || 'full';
const demoScene = Object.hasOwn(DEMO_SCENES, requestedScene) ? requestedScene : 'full';
const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;
let experienceReady = false;
const USER_AGENT = navigator.userAgent || '';
const IS_IOS_DEVICE = /iPad|iPhone|iPod/.test(USER_AGENT)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const IS_WEBKIT_ENGINE = /WebKit/i.test(USER_AGENT);
const IS_SAFARI_BROWSER = /Safari/i.test(USER_AGENT);
const HAS_NATIVE_CLOSE_HANDLER = Boolean(window.webkit?.messageHandlers?.close);
const IS_IOS_WEBVIEW = IS_IOS_DEVICE
  && (HAS_NATIVE_CLOSE_HANDLER || (IS_WEBKIT_ENGINE && !IS_SAFARI_BROWSER));
const LOW_PERF_MODE = IS_IOS_WEBVIEW;

if (LOW_PERF_MODE) {
  document.documentElement.classList.add('ios-perf');
}

const CONFIG = {
  userName: 'Vibhore',
  introDelay: 0.5,
  sprayParticleCount: LOW_PERF_MODE ? 96 : 160,
};

const HOLI_COLORS = [
  '#FF1493', '#FF6B35', '#FFD700', '#00E676',
  '#E040FB', '#FF4081', '#00BCD4', '#FFEB3B',
  '#F44336', '#7C4DFF', '#FF9800', '#4CAF50',
];

const PICHKARI_NOZZLE_POINT = { x: 0.34, y: 0.1 };
const PICHKARI_DIRECTION_OFFSET = -90;
const PICHKARI_LEVER_PRESS_Y = -12;
const PICHKARI_LEVER_PRESS_DURATION = 0.09;
const PICHKARI_LEVER_RELEASE_DURATION = 0.12;
const GULAL_POWDER_IMAGE_PATH = 'assets/coloured-powder.png';
const GULAL_BURST_DURATION = 1.2;
const GULAL_BURST_LITE_DURATION = LOW_PERF_MODE ? 0.72 : 0.9;
const INTERACTION_SOUND_PATHS = {
  pichkari: 'assets/water splash.mp3',
  gulal: 'assets/powder air.mp3',
  gujiya: 'assets/nom nom.mp3',
};
const INTERACTION_SOUND_POOL_SIZE = LOW_PERF_MODE ? 4 : 3;
const INTERACTION_SOUND_VOLUME = 0.5;
const SEGMENT_LETTER_COPY = {
  'rupay-cc-apply': [
    'You have made lot of UPI payments this year. This Holi, make them even more rewarding.',
    'Get a <strong>lifetime free UPI RuPay Credit Card</strong> and double your celebrations with <strong>₹500* worth benefits</strong>.',
  ],
  'default': [
    'Enjoy up to <strong>16% savings on e-vouchers</strong> exclusively on PayZapp Shop.',
    'Save on <strong>Food (Swiggy, Zomato etc), Groceries (Blinkit, Zepto etc)</strong> and more.',
  ],
  'zapp-account': [
    'Give your Zapp Account a fresh start this Holi & make your festive payments lightning fast!',
    'Use any credit card to load wallet and get <strong>flat ₹50 cashback</strong>.',
  ],
  'spc-cards': [
    'This Holi, enjoy up to <strong>16% savings</strong> on <strong>e-vouchers</strong> only on PayZapp Shop with your HDFC Bank card.',
    'Save on <strong>e-commerce (Amazon, Flipkart), gifting (IGP, FNP, Archies)</strong> and more.',
  ],
  'rupay-cc-linking': [
    'You use UPI regularly for your payments. Celebrate Holi with smarter payments.',
    'Link your RuPay Credit Card on PayZapp, complete 2 UPI payments, and <strong>earn ₹250 cashback</strong>.',
  ],
};
const DEFAULT_LETTER_COPY = [
  'Getting ready for Holi gatherings? Enjoy up to <strong>16% savings on e-vouchers</strong> exclusively on PayZapp Shop.',
  'Save on <strong>Food (Swiggy, Zomato etc), Groceries (Blinkit, Zepto etc)</strong> and more.',
];
const SEGMENT_LETTER_BADGE_IMAGE = {
  'default': 'assets/letter-img-1.png',
  'rupay-cc-apply': 'assets/letter-img-2.png',
  'rupay-cc-linking': 'assets/letter-img-5.png',
  'zapp-account': 'assets/letter-img-4.png',
  'spc-cards': 'assets/letter-img-3.png',
};
const SEGMENT_CTA_CONFIG = {
  'rupay-cc-apply': {
    label: 'Get the card',
    href: '#offer',
  },
  'default': {
    label: 'Buy Vouchers',
    href: '#offer',
  },
  'zapp-account': {
    label: 'Get Cashback',
    href: '#offer',
  },
  'spc-cards': {
    label: 'Buy Vouchers',
    href: '#offer',
  },
  'rupay-cc-linking': {
    label: 'Get Started',
    href: '#offer',
  },
};
const DEFAULT_CTA_CONFIG = {
  label: 'Explore Offer',
  href: '#offer',
};
const FINAL_BOX_COVERAGE = LOW_PERF_MODE
  ? { width: 1.58, height: 1.66 }
  : { width: 1.7, height: 1.8 };
const ASSET_ANIMATION_MARGIN = 14;
const GUJIYA_ASPECT_RATIO = 256 / 163;
const PRELOADER_MIN_DURATION_MS = LOW_PERF_MODE ? 1100 : 1400;
const BRIDGE_PAYLOAD_WAIT_TIMEOUT_MS = 5000;
const STATIC_IMAGE_ASSET_PATHS = [
  'assets/blob-bg.png',
  'assets/lid.png',
  'assets/box.png',
  'assets/gujiya.png',
  'assets/pichkari.png',
  'assets/pichkari-lever.png',
  'assets/gulal-empty.png',
  'assets/gulal-filled.png',
  'assets/happy-holi.png', // Added missing static asset
  'assets/letter-img-1.png', // Added segment badges
  'assets/letter-img-2.png',
  'assets/letter-img-3.png',
  'assets/letter-img-4.png',
  'assets/letter-img-5.png',
  'assets/heart.png', // Added bottom signoff asset
  GULAL_POWDER_IMAGE_PATH,
];

function buildGujiyaBiteClipPath(bites) {
  const points = [];
  const samples = LOW_PERF_MODE ? 30 : 50;

  for (let i = 0; i <= samples; i++) {
    const x = (i / samples) * 100;
    let y = 0;

    for (const bite of bites) {
      const dx = x - bite.cx;
      if (Math.abs(dx) <= bite.r) {
        const depthOnX = Math.sqrt(bite.r ** 2 - dx ** 2);
        const depthOnY = depthOnX * GUJIYA_ASPECT_RATIO;
        y = Math.max(y, depthOnY);
      }
    }

    points.push(`${x.toFixed(2)}% ${Math.min(100, y).toFixed(2)}%`);
  }

  return `polygon(${points.join(', ')}, 100% 100%, 0% 100%)`;
}

function setGujiyaClipPath(target, path) {
  gsap.set(target, { clipPath: path, webkitClipPath: path });
}

const GUJIYA_BITE_DEFINITIONS = [
  [{ cx: 84, r: 32 }],
  [{ cx: 66, r: 33 }, { cx: 88, r: 32 }],
  [{ cx: 48, r: 34 }, { cx: 70, r: 33 }, { cx: 92, r: 32 }],
  [{ cx: 30, r: 35 }, { cx: 52, r: 34 }, { cx: 74, r: 33 }, { cx: 96, r: 32 }],
  [{ cx: 12, r: 36 }, { cx: 34, r: 35 }, { cx: 56, r: 34 }, { cx: 78, r: 33 }, { cx: 100, r: 32 }],
];

const GUJIYA_CLIPPATH = {
  full: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
  bites: GUJIYA_BITE_DEFINITIONS.map((bites) => buildGujiyaBiteClipPath(bites)),
  eaten: buildGujiyaBiteClipPath([
    { cx: 8, r: 48 },
    { cx: 28, r: 47 },
    { cx: 48, r: 46 },
    { cx: 68, r: 45 },
    { cx: 88, r: 44 },
  ]),
};

const GUJIYA_MOVE_TO_CENTER_DURATION = Math.max(0.22, 0.4 - GUJIYA_CLIPPATH.bites.length * 0.028);
const GUJIYA_BITE_SHAKE_DURATION = Math.max(0.03, 0.06 - GUJIYA_CLIPPATH.bites.length * 0.004);
const GUJIYA_BITE_HOLD_DURATION = Math.max(0.04, 0.14 - GUJIYA_CLIPPATH.bites.length * 0.016);
const GUJIYA_EATEN_POP_DURATION = Math.max(0.06, 0.12 - GUJIYA_CLIPPATH.bites.length * 0.01);
const GUJIYA_RETURN_DURATION = 0.22;
const TAP_AFFORDANCE_NUDGE = {
  assetGujiya: { dx: -4, dy: 3, dr: -2.2, duration: 1.62, delay: 0 },
  assetGujiya2: { dx: 3, dy: 3, dr: 1.7, duration: 1.7, delay: 0.18 },
  assetPichkari: { dx: -4, dy: -3, dr: -2.8, duration: 1.58, delay: 0.08 },
  assetGulal: { dx: 4, dy: -3, dr: 2.4, duration: 1.72, delay: 0.15 },
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const boxWrapper = $('#boxWrapper');
const boxLid = $('#boxLid');
const boxImage = $('.box-img');
const boxCastShadow = $('.box-cast-shadow');
const assetsLayer = $('#assetsLayer');
const assetBackdrop = $('#assetBackdrop');
const cancelBtn = $('#cancelBtn');
const sprayCanvas = $('#sprayCanvas');
const lidUserName = $('#lidUserName');
const bottomSignoff = $('#bottomSignoff');
const letterParagraphs = $$('#assetLetter .letter-content p');
const letterCta = $('#letterCta');
const letterProductBadge = $('#letterProductBadge');
const assetLetter = $('#assetLetter');
const preloader = $('#preloader');
const preloaderCopyMarquee = $('#preloaderCopyMarquee');
const preloaderCopyCurrent = $('#preloaderCopyCurrent');
const preloaderCopyNext = $('#preloaderCopyNext');
const PRELOADER_COPY_ROTATE_MS = 1800;
const PRELOADER_COPY_TRANSITION_MS = 380;
const LETTER_ASPECT_RATIO_BASE = '32 / 56';
const LETTER_ASPECT_RATIO_NUDGE = '32.5 / 56';
const PRELOADER_MESSAGES = [
  'Packing your Holi goodies...',
  'Adding your personal touch...',
  'Warming up the pichkari...'
];
let preloaderCopyRotationTimer = null;
let preloaderCopyTransitionTimer = null;
let preloaderCopyIndex = 0;

function sanitizeNamePart(value) {
  if (typeof value !== 'string') return '';
  return Array.from(value.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, ' ').trim().replace(/\s+/g, ' ')).slice(0,40).join('');
}

function toTitleCaseName(value) {
  const normalized = sanitizeNamePart(value);
  if (!normalized) return '';
  return normalized
    .toLowerCase()
    .replace(/(^|[\s'-])[a-z]/g, (match) => match.toUpperCase());
}

function resolveFirstName(remoteData) {
  if (!remoteData || typeof remoteData !== 'object') return '';
  const fullName = sanitizeNamePart(remoteData.userName);
  if (!fullName) return '';
  return fullName.split(/\s+/)[0];
}

function resolveUserNameFromQuery() {
  try {
    const params = new URLSearchParams(window.location.search);
    const entries = [...params.entries()];

    const readByKeys = (keys) => {
      const lookup = new Set(keys.map((key) => key.toLowerCase()));
      for (const [key, rawValue] of entries) {
        if (!lookup.has(key.toLowerCase())) continue;
        const candidate = sanitizeNamePart(rawValue);
        if (candidate) return candidate;
      }
      return '';
    };

    const firstName = readByKeys([
      'firstName',
      'first_name',
      'firstname',
      'givenName',
      'given_name',
      'userFirstName',
      'user_first_name',
      'userName',
      'username',
      'user_name',
    ]);
    if (firstName) return firstName;

    const fullName = readByKeys(['fullName', 'full_name', 'name']);
    if (fullName) return fullName.split(/\s+/)[0];
  } catch (_error) {
    return '';
  }

  return '';
}

function resolveUserNameFromGlobalData() {
  const globalCandidates = [
    window.__PAYZAPP_REMOTE_DATA__,
    window.__PAYZAPP_CONTEXT__,
    window.__INITIAL_STATE__,
    window.__APP_DATA__,
    window.profile,
    window.user,
  ];

  for (const candidate of globalCandidates) {
    const resolved = resolveFirstName(candidate);
    if (resolved) return resolved;
  }

  return '';
}

function parseRemoteDataPayload(rawPayload) {
  let payload = rawPayload;

  for (let i = 0; i < 3; i++) {
    if (payload && typeof payload === 'object') return payload;
    if (typeof payload !== 'string') return null;

    const trimmed = payload.trim();
    if (!trimmed) return null;

    try {
      payload = JSON.parse(trimmed);
    } catch (_error) {
      return null;
    }
  }

  return payload && typeof payload === 'object' ? payload : null;
}

function applyUserName(userName) {
  const safeUserName = toTitleCaseName(userName);
  CONFIG.userName = safeUserName;
  if (lidUserName) {
    lidUserName.textContent = safeUserName;
  }
}

function fallbackCloseFlow() {
  stopDemoAudio();
  if(window.parent !== window) window.parent.postMessage({type:'holi:home'},location.origin);
  else location.href='index.html';
}
async function openCtaViaBridge() {
  document.getElementById('demoTitle').textContent = letterCta.textContent;
  document.getElementById('demoDialog').showModal();
}
async function dismissFlowViaBridge() { return false; }
function trackEvent() { /* Standalone prototype: no telemetry. */ }
async function hydrateUserNameFromBridge() {
  const profile = window.__HOLI_PROFILE__;
  if(profile && typeof profile === 'object' && typeof profile.userName === 'string') applyUserName(profile.userName.split(/\s+/)[0]);
}

gsap.defaults({ force3D: true });

const queryUserName = resolveUserNameFromQuery();
const globalUserName = queryUserName ? '' : resolveUserNameFromGlobalData();
if (queryUserName || globalUserName) {
  CONFIG.userName = queryUserName || globalUserName;
}

applyUserName(CONFIG.userName);

function getSegmentFromQuery() { return DEMO_SCENES[demoScene]; }

function applySegmentLetterCopy() {
  if (!letterParagraphs || letterParagraphs.length < 2) return;
  const segment = getSegmentFromQuery();
  const [firstParagraph, secondParagraph] = SEGMENT_LETTER_COPY[segment] || DEFAULT_LETTER_COPY;
  const ctaConfig = SEGMENT_CTA_CONFIG[segment] || DEFAULT_CTA_CONFIG;
  const badgeImagePath = SEGMENT_LETTER_BADGE_IMAGE[segment] || '';
  letterParagraphs[0].innerHTML = firstParagraph;
  letterParagraphs[1].innerHTML = secondParagraph;

  if (letterCta) {
    letterCta.textContent = ctaConfig.label;
    letterCta.href = '#offer';
  }
  if (letterProductBadge) {
    if (badgeImagePath) {
      letterProductBadge.src = badgeImagePath;
      letterProductBadge.classList.remove('is-hidden');
    } else {
      letterProductBadge.removeAttribute('src');
      letterProductBadge.classList.add('is-hidden');
    }
  }
}

applySegmentLetterCopy();

if (letterCta) {
  letterCta.addEventListener('click', (event) => {
    event.preventDefault();
    trackEvent('webview_landing_page_interacted', `holi2026_cta_click_${getSegmentFromQuery() || 'default'}`);
    void openCtaViaBridge(letterCta.href);
  });
}

const interactionSounds = Object.fromEntries(
  Object.entries(INTERACTION_SOUND_PATHS).map(([key, path]) => {
    const src = encodeURI(path);
    const pool = Array.from({ length: INTERACTION_SOUND_POOL_SIZE }, () => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.playsInline = true;
      audio.volume = INTERACTION_SOUND_VOLUME;
      return audio;
    });
    return [key, { pool, nextIndex: 0 }];
  }),
);
let interactionSoundsUnlocked = false;

function unlockInteractionSounds() {
  if (document.hidden) return;
  if (interactionSoundsUnlocked) return;
  interactionSoundsUnlocked = true;

  Object.values(interactionSounds).forEach((entry) => {
    const audio = entry?.pool?.[0];
    if (!audio) return;

    try {
      audio.muted = true;
      const playPromise = audio.play();
      if (playPromise?.then) {
        playPromise
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
            audio.muted = false;
          })
          .catch(() => {
            audio.muted = false;
          });
      } else {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      }
    } catch (_error) {
      audio.muted = false;
    }
  });
}

function getNextInteractionSoundInstance(soundKey) {
  const entry = interactionSounds[soundKey];
  if (!entry?.pool?.length) return null;

  const { pool } = entry;
  const startIndex = entry.nextIndex % pool.length;
  let selected = pool[startIndex];

  for (let i = 0; i < pool.length; i++) {
    const candidate = pool[(startIndex + i) % pool.length];
    const isIdle = candidate.paused || candidate.ended || candidate.currentTime === 0;
    if (isIdle) {
      selected = candidate;
      entry.nextIndex = (startIndex + i + 1) % pool.length;
      return selected;
    }
  }

  // If all are busy, reuse the next slot.
  entry.nextIndex = (startIndex + 1) % pool.length;
  return selected;
}

function installSoundUnlockHandlers() {
  const unlock = () => {
    unlockInteractionSounds();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('touchstart', unlock);
    window.removeEventListener('mousedown', unlock);
  };

  window.addEventListener('pointerdown', unlock, { once: true, passive: true });
  window.addEventListener('touchstart', unlock, { once: true, passive: true });
  window.addEventListener('mousedown', unlock, { once: true, passive: true });
}

installSoundUnlockHandlers();

function setPreloaderCopyText(message) {
  if (!preloaderCopyCurrent || typeof message !== 'string') return;
  preloaderCopyCurrent.textContent = message;
}

function transitionPreloaderCopyToNext() {
  if (!preloaderCopyMarquee || !preloaderCopyCurrent || !preloaderCopyNext) return;
  if (PRELOADER_MESSAGES.length <= 1) return;
  if (preloaderCopyTransitionTimer) return;

  const nextIndex = (preloaderCopyIndex + 1) % PRELOADER_MESSAGES.length;
  const nextMessage = PRELOADER_MESSAGES[nextIndex];
  if (!nextMessage) return;

  preloaderCopyNext.textContent = nextMessage;
  preloaderCopyMarquee.classList.add('is-animating');

  preloaderCopyTransitionTimer = setTimeout(() => {
    preloaderCopyIndex = nextIndex;

    // Reset to base positions without animating back from top.
    preloaderCopyMarquee.classList.add('is-resetting');
    preloaderCopyMarquee.classList.remove('is-animating');
    preloaderCopyCurrent.textContent = nextMessage;
    preloaderCopyNext.textContent = '';
    void preloaderCopyMarquee.offsetWidth;
    preloaderCopyMarquee.classList.remove('is-resetting');

    clearTimeout(preloaderCopyTransitionTimer);
    preloaderCopyTransitionTimer = null;
  }, PRELOADER_COPY_TRANSITION_MS + 60);
}

function startPreloaderCopyRotation() {
  if (!preloaderCopyCurrent || PRELOADER_MESSAGES.length === 0) return;
  if (preloaderCopyRotationTimer) {
    clearInterval(preloaderCopyRotationTimer);
    preloaderCopyRotationTimer = null;
  }
  if (preloaderCopyTransitionTimer) {
    clearTimeout(preloaderCopyTransitionTimer);
    preloaderCopyTransitionTimer = null;
  }
  if (preloaderCopyMarquee) {
    preloaderCopyMarquee.classList.remove('is-animating');
    preloaderCopyMarquee.classList.remove('is-resetting');
  }
  if (preloaderCopyNext) {
    preloaderCopyNext.textContent = '';
  }

  preloaderCopyIndex = 0;
  setPreloaderCopyText(PRELOADER_MESSAGES[preloaderCopyIndex]);

  if (PRELOADER_MESSAGES.length === 1) return;

  preloaderCopyRotationTimer = setInterval(() => {
    transitionPreloaderCopyToNext();
  }, PRELOADER_COPY_ROTATE_MS);
}

function stopPreloaderCopyRotation() {
  if (preloaderCopyRotationTimer) {
    clearInterval(preloaderCopyRotationTimer);
    preloaderCopyRotationTimer = null;
  }
  if (preloaderCopyTransitionTimer) {
    clearTimeout(preloaderCopyTransitionTimer);
    preloaderCopyTransitionTimer = null;
  }
  if (preloaderCopyMarquee) {
    preloaderCopyMarquee.classList.remove('is-animating');
    preloaderCopyMarquee.classList.remove('is-resetting');
  }
  if (preloaderCopyNext) {
    preloaderCopyNext.textContent = '';
  }
}

function preloadImageAsset(path) {
  return new Promise((resolve) => {
    const img = new Image();
    const done = () => {
      img.onload = null;
      img.onerror = null;
      resolve();
    };
    img.onload = done;
    img.onerror = done;
    img.src = encodeURI(path);

    if (img.complete) done();
  });
}

function preloadAudioElement(audioElement) {
  return new Promise((resolve) => {
    if (!audioElement) {
      resolve();
      return;
    }

    let isDone = false;
    const onDone = () => {
      if (isDone) return;
      isDone = true;
      audioElement.removeEventListener('canplaythrough', onDone);
      audioElement.removeEventListener('loadeddata', onDone);
      audioElement.removeEventListener('error', onDone);
      clearTimeout(timeoutId);
      resolve();
    };
    const timeoutId = setTimeout(onDone, LOW_PERF_MODE ? 2600 : 2200);

    audioElement.addEventListener('canplaythrough', onDone, { once: true });
    audioElement.addEventListener('loadeddata', onDone, { once: true });
    audioElement.addEventListener('error', onDone, { once: true });

    try {
      audioElement.load();
    } catch (_error) {
      onDone();
    }
  });
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function preloadStaticAssets() {
  const imagePaths = [...new Set(STATIC_IMAGE_ASSET_PATHS)];
  const audioElements = Object.values(interactionSounds)
    .map((entry) => entry.pool[0])
    .filter(Boolean);
  const totalAssets = imagePaths.length + audioElements.length;
  if (totalAssets <= 0) return;

  await Promise.all([
    ...imagePaths.map((path) => preloadImageAsset(path)),
    ...audioElements.map((audioElement) => preloadAudioElement(audioElement)),
  ]);
}

function hidePreloader() {
  return new Promise((resolve) => {
    stopPreloaderCopyRotation();
    document.body.classList.remove('preloading');
    if (!preloader) {
      resolve();
      return;
    }

    preloader.classList.add('is-exiting');

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      preloader.remove();
      resolve();
    };

    preloader.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, 700);
  });
}

async function startExperience() {
  const startAt = Date.now();

  startPreloaderCopyRotation();
  const userNameHydrationPromise = hydrateUserNameFromBridge(BRIDGE_PAYLOAD_WAIT_TIMEOUT_MS);
  const staticAssetPreloadPromise = preloadStaticAssets();
  await Promise.allSettled([userNameHydrationPromise, staticAssetPreloadPromise]);

  const elapsedMs = Date.now() - startAt;
  const remainingMs = Math.max(0, PRELOADER_MIN_DURATION_MS - elapsedMs);
  if (remainingMs > 0) await sleep(remainingMs);

  await hidePreloader();
  trackEvent('webview_landing_page_viewed', 'holi2026_page_load');
  const intro = playIntro();
  if(demoScene !== 'full' || REDUCED_MOTION) intro.progress(1);
  document.documentElement.dataset.scene = demoScene;
}

function playInteractionSound(soundKey) {
  if (document.hidden) return;
  const audio = getNextInteractionSoundInstance(soundKey);
  if (!audio) return;

  try {
    audio.volume = INTERACTION_SOUND_VOLUME;
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise?.catch) {
      playPromise.catch(() => { });
    }
  } catch (_error) {
    // Ignore playback failures (e.g., platform-specific audio policy edge cases).
  }
}

function playInteractionSoundRepeated(soundKey, repeatCount = 1, intervalMs = 220) {
  unlockInteractionSounds();
  const safeCount = Math.max(1, repeatCount);
  playInteractionSound(soundKey);

  for (let i = 1; i < safeCount; i++) {
    setTimeout(() => playInteractionSound(soundKey), intervalMs * i);
  }
}

// ===== Cancel =====
cancelBtn.addEventListener('click', () => {
  trackEvent('webview_landing_page_interacted', 'holi2026_cancel_click');
  void (async () => {
    const dismissed = await dismissFlowViaBridge();
    if (!dismissed) fallbackCloseFlow();
  })();
});


/* ================================================================
   TARGET SCALE — box should fill most of the screen height
   ================================================================ */
function getTargetScale() {
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;
  const boxW = 336; // approx box width in px at base size
  const boxH = 406; // approx box height in px at base size

  // Zoom in more for readability, but still keep the box inside viewport.
  const scaleByHeight = (screenH * FINAL_BOX_COVERAGE.height) / boxH;
  const scaleByWidth = (screenW * FINAL_BOX_COVERAGE.width) / boxW;
  return Math.min(scaleByHeight, scaleByWidth);
}

function forceBoxWrapperRepaint() {
  if (!boxWrapper) return;
  gsap.set(boxWrapper, { x: '+=0.01' });
  requestAnimationFrame(() => {
    gsap.set(boxWrapper, { x: '-=0.01' });
  });
}

function runBoxWrapperRepaintHack() {
  forceBoxWrapperRepaint();
  if (!LOW_PERF_MODE) setTimeout(forceBoxWrapperRepaint, 90);
}

function forceLetterAspectRatioRepaint() {
  if (!assetLetter) return;
  assetLetter.style.aspectRatio = LETTER_ASPECT_RATIO_NUDGE;
  void assetLetter.offsetHeight;
  requestAnimationFrame(() => {
    assetLetter.style.aspectRatio = LETTER_ASPECT_RATIO_BASE;
  });
}

function runLetterAspectRatioRepaintHack() {
  forceLetterAspectRatioRepaint();
  if (!LOW_PERF_MODE) setTimeout(forceLetterAspectRatioRepaint, 90);
}


/* ================================================================
   INTRO SEQUENCE
   ================================================================ */
function playIntro() {
  const targetScale = getTargetScale();

  const tl = gsap.timeline({
    delay: CONFIG.introDelay,
    onComplete: () => { experienceReady = true; document.documentElement.dataset.ready = 'true'; startTapAffordanceNudges(); },
  });
  if (bottomSignoff) gsap.set(bottomSignoff, { opacity: 1, y: 0 });

  // Step 1: Zoom toward the box
  tl.to(boxWrapper, {
    scale: 1,
    duration: 1.0,
    ease: 'power2.inOut',
  });

  // Step 2: Brief pause
  tl.to({}, { duration: 0.5 });

  // Step 2.5: Slight shake before opening (2 cycles)
  if (LOW_PERF_MODE) {
    tl.to(boxWrapper, { x: 6, rotation: 1.0, duration: 0.09, ease: 'power1.inOut' });
    tl.to(boxWrapper, { x: -5, rotation: -0.9, duration: 0.09, ease: 'power1.inOut' });
    tl.to(boxWrapper, { x: 0, rotation: 0, duration: 0.1, ease: 'power1.out' });
    tl.to({}, { duration: 0.24 });
    tl.to(boxWrapper, { x: 6, rotation: 1.0, duration: 0.09, ease: 'power1.inOut' });
    tl.to(boxWrapper, { x: -5, rotation: -0.9, duration: 0.09, ease: 'power1.inOut' });
    tl.to(boxWrapper, { x: 0, rotation: 0, duration: 0.1, ease: 'power1.out' });
  } else {
    tl.to(boxWrapper, { x: 8, rotation: 1.3, duration: 0.07, ease: 'power1.inOut' });
    tl.to(boxWrapper, { x: -7, rotation: -1.1, duration: 0.07, ease: 'power1.inOut' });
    tl.to(boxWrapper, { x: 5, rotation: 0.8, duration: 0.06, ease: 'power1.inOut' });
    tl.to(boxWrapper, { x: -3, rotation: -0.5, duration: 0.06, ease: 'power1.inOut' });
    tl.to(boxWrapper, { x: 0, rotation: 0, duration: 0.08, ease: 'power1.out' });
    tl.to({}, { duration: 0.3 });
    tl.to(boxWrapper, { x: 8, rotation: 1.3, duration: 0.07, ease: 'power1.inOut' });
    tl.to(boxWrapper, { x: -7, rotation: -1.1, duration: 0.07, ease: 'power1.inOut' });
    tl.to(boxWrapper, { x: 5, rotation: 0.8, duration: 0.06, ease: 'power1.inOut' });
    tl.to(boxWrapper, { x: -3, rotation: -0.5, duration: 0.06, ease: 'power1.inOut' });
    tl.to(boxWrapper, { x: 0, rotation: 0, duration: 0.08, ease: 'power1.out' });
  }

  // Step 3: Lid rotates and slides off to the left
  tl.addLabel('lidStart');
  tl.to(boxLid, {
    rotation: -32,
    x: '-120vw',
    y: '-42vh',
    duration: 0.9,
    ease: 'power2.in',
  }, 'lidStart');
  if (bottomSignoff) {
    tl.to(bottomSignoff, {
      opacity: 0,
      y: 18,
      duration: 0.4,
      ease: 'power2.out',
    }, 'lidStart');
  }

  // Step 3.5: Color Burst Shot
  const introColorBurstLayer = document.getElementById('introColorBurst');
  if (introColorBurstLayer) gsap.set(introColorBurstLayer, { opacity: 1, scale: 1, y: 0 });

  const introColors = document.querySelectorAll('.intro-color-img');
  if (introColors.length) {
    const img = introColors[0];

    // Animate the single powder image bursting outwards (no rotation)
    tl.fromTo(img,
      { scale: 0, opacity: 0, xPercent: -50, yPercent: -50, x: 0, y: 0, rotation: 0 },
      {
        scale: 2.8,
        opacity: 0.9,
        y: -120, // explode upwards
        rotation: 0,
        duration: 1.4, // extended duration
        ease: 'power2.out',
      },
      'lidStart+=0.2' // start after the lid has started moving
    );

    // Fade out the wrapper right before zoom finishes
    if (introColorBurstLayer) {
      tl.to(introColorBurstLayer, {
        opacity: 0,
        y: -20,
        scale: 1.15,
        duration: 0.8, // slower fade
        ease: 'power1.inOut'
      }, 'lidStart+=0.8'); // start fading out later
    }
  }

  // Step 4: Big zoom — box fills most of the screen. No fade.
  // Explicitly tie it to lidStart so the color burst tweens do not delay the zoom
  tl.to(boxWrapper, {
    scale: targetScale,
    duration: 1.2,
    ease: 'power2.inOut',
  }, 'lidStart+=0.6');

  if (assetsLayer) {
    tl.to(assetsLayer, {
      top: '4%',
      duration: 1.2,
      ease: 'power2.inOut',
    }, '<');
  }

  // Move assets to "viewport fit" positions during the zoom
  tl.to('#assetGujiya, #assetGujiya2', {
    rotation: 21,
    scale: 1,
    duration: 1.2,
    ease: 'power2.inOut',
  }, '<');

  tl.to('#assetPichkari', {
    rotation: -12,
    scale: 1,
    duration: 1.2,
    ease: 'power2.inOut',
  }, '<');

  tl.to('#assetGulal', {
    rotation: 9,
    scale: 1,
    duration: 1.2,
    ease: 'power2.inOut',
  }, '<');

  tl.to('#assetLetter', {
    rotation: 0,
    scale: 0.97,
    duration: 1.2,
    ease: 'power2.inOut',
  }, '<');

  // Slowly fade out box artwork + cast shadow while letter/assets settle in.
  tl.to([boxImage, boxCastShadow].filter(Boolean), {
    opacity: 0,
    duration: 1.35,
    ease: 'power2.out',
  }, '<');

  // Hacky but effective: nudge wrapper width after zoom to force crisp rerasterization.
  if (!LOW_PERF_MODE) tl.call(runBoxWrapperRepaintHack);
  tl.call(runLetterAspectRatioRepaintHack);
  return tl;
}

function normalizeGujiyaLayers() {
  $$('.asset-gujiya').forEach((el) => {
    el.querySelectorAll('.asset-img-gujiya-shadow').forEach((node) => node.remove());
    const img = el.querySelector('.asset-img');
    if (img) img.classList.remove('asset-img-gujiya-main');
  });
}

normalizeGujiyaLayers();


/* ================================================================
   SPRAY PARTICLE SYSTEM (for Pichkari)
   ================================================================ */
const sprayCtx = sprayCanvas.getContext('2d', { alpha: true, desynchronized: true });
let sprayParticles = [];
let sprayAnimId = null;

function resizeSprayCanvas() {
  const maxDpr = LOW_PERF_MODE ? 2 : 3;
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  sprayCanvas.width = window.innerWidth * dpr;
  sprayCanvas.height = window.innerHeight * dpr;
  sprayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function createSprayParticle(originX, originY, angle, splashStrength = 1) {
  const spread = (Math.random() - 0.5) * 0.85;
  const finalAngle = angle + spread;
  const speed = (5 + Math.random() * 14) * splashStrength;
  const chunkyDrop = Math.random() > 0.75;
  return {
    x: originX, y: originY,
    vx: Math.cos(finalAngle) * speed,
    vy: Math.sin(finalAngle) * speed,
    size: chunkyDrop ? 3 + Math.random() * 6.5 : 1.8 + Math.random() * 3.4,
    color: HOLI_COLORS[Math.floor(Math.random() * HOLI_COLORS.length)],
    alpha: 0.85 + Math.random() * 0.15,
    gravity: 0.11 + Math.random() * 0.08,
    friction: 0.97 + Math.random() * 0.015,
    life: 1,
    decay: chunkyDrop ? 0.007 + Math.random() * 0.008 : 0.014 + Math.random() * 0.014,
  };
}

function animateSpray() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  sprayCtx.clearRect(0, 0, w, h);

  for (let i = sprayParticles.length - 1; i >= 0; i--) {
    const p = sprayParticles[i];
    p.vx += (Math.random() - 0.5) * 0.06;
    p.vy += p.gravity;
    p.vx *= p.friction;
    p.vy *= p.friction;
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    p.alpha = Math.max(0, p.life * 0.9);

    if (p.life <= 0) { sprayParticles.splice(i, 1); continue; }

    sprayCtx.globalAlpha = p.alpha;
    sprayCtx.fillStyle = p.color;
    sprayCtx.beginPath();
    sprayCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    sprayCtx.fill();
  }
  sprayCtx.globalAlpha = 1;

  if (sprayParticles.length > 0) {
    sprayAnimId = requestAnimationFrame(animateSpray);
  } else {
    sprayAnimId = null;
  }
}

function sprayColorSplash(originX, originY, angle) {
  resizeSprayCanvas();
  stopGulalPowderImageEffect();

  for (let i = 0; i < CONFIG.sprayParticleCount; i++) {
    sprayParticles.push(createSprayParticle(originX, originY, angle));
  }

  for (let i = 0; i < CONFIG.sprayParticleCount * 0.22; i++) {
    sprayParticles.push(createSprayParticle(originX, originY, angle, 0.72));
  }

  if (!sprayAnimId) animateSpray();
}

function getPichkariNozzleData(element) {
  const rect = element.getBoundingClientRect();
  const nozzleX = rect.left + rect.width * PICHKARI_NOZZLE_POINT.x;
  const nozzleY = rect.top + rect.height * PICHKARI_NOZZLE_POINT.y;
  const rotation = Number(gsap.getProperty(element, 'rotation')) || 0;
  const sprayAngle = ((rotation + PICHKARI_DIRECTION_OFFSET) * Math.PI) / 180;

  return { nozzleX, nozzleY, sprayAngle };
}

function queuePichkariSpray(timeline, pichkariElement, leverElement) {
  if (leverElement) {
    timeline.to(leverElement, {
      y: PICHKARI_LEVER_PRESS_Y,
      duration: PICHKARI_LEVER_PRESS_DURATION,
      ease: 'power2.in',
    });
  }

  timeline.call(() => {
    playInteractionSound('pichkari');
    const { nozzleX, nozzleY, sprayAngle } = getPichkariNozzleData(pichkariElement);
    sprayColorSplash(nozzleX, nozzleY, sprayAngle);
  });

  if (leverElement) {
    timeline.to(leverElement, {
      y: 0,
      duration: PICHKARI_LEVER_RELEASE_DURATION,
      ease: 'power2.out',
    });
  }
}


/* ================================================================
   GULAL POWDER CLOUD (single-image overlay)
   ================================================================ */
function createGulalPowderOverlay() {
  const existing = document.getElementById('gulalPowderOverlay');
  if (existing) return existing;

  const image = document.createElement('img');
  image.id = 'gulalPowderOverlay';
  image.className = 'gulal-powder-overlay';
  image.src = GULAL_POWDER_IMAGE_PATH;
  image.alt = '';
  image.setAttribute('aria-hidden', 'true');
  document.body.appendChild(image);
  return image;
}

let gulalPowderOverlay = null;

function getGulalPowderOverlay() {
  if (!gulalPowderOverlay) {
    gulalPowderOverlay = createGulalPowderOverlay();
  }
  return gulalPowderOverlay;
}

function stopGulalPowderImageEffect() {
  if (!gulalPowderOverlay) return;
  gsap.killTweensOf(gulalPowderOverlay);
  gsap.set(gulalPowderOverlay, {
    display: 'none',
    opacity: 0,
    x: 0,
    y: 0,
  });
}

function getGulalPowderSize() {
  const viewportBase = Math.min(window.innerWidth, window.innerHeight);
  return Math.max(260, Math.min(560, viewportBase * 0.74));
}

function createBurstParticle(originX, originY) {
  const angle = Math.random() * Math.PI * 2;
  const speed = 2.4 + Math.random() * 8.6;
  const chunkyDrop = Math.random() > 0.8;

  return {
    x: originX,
    y: originY,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 1.2,
    size: chunkyDrop ? 3.8 + Math.random() * 4.2 : 2.1 + Math.random() * 2.7,
    color: HOLI_COLORS[Math.floor(Math.random() * HOLI_COLORS.length)],
    alpha: 0.82 + Math.random() * 0.18,
    gravity: 0.09 + Math.random() * 0.08,
    friction: 0.965 + Math.random() * 0.02,
    life: 1,
    decay: chunkyDrop ? 0.01 + Math.random() * 0.01 : 0.016 + Math.random() * 0.014,
  };
}

function triggerColorBurstLite(element, onComplete) {
  stopGulalPowderImageEffect();
  sprayParticles = [];
  if (sprayAnimId) {
    cancelAnimationFrame(sprayAnimId);
    sprayAnimId = null;
  }

  resizeSprayCanvas();
  const rect = element.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height * 0.5;
  const burstCount = LOW_PERF_MODE ? 88 : 110;

  for (let i = 0; i < burstCount; i++) {
    sprayParticles.push(createBurstParticle(cx, cy));
  }

  if (!sprayAnimId) animateSpray();
  if (typeof onComplete === 'function') {
    setTimeout(onComplete, GULAL_BURST_LITE_DURATION * 1000);
  }
}

function triggerColorBurst(element, onComplete) {
  const overlay = getGulalPowderOverlay();
  if (!overlay) {
    triggerColorBurstLite(element, onComplete);
    return;
  }

  stopGulalPowderImageEffect();
  sprayParticles = [];
  if (sprayAnimId) {
    cancelAnimationFrame(sprayAnimId);
    sprayAnimId = null;
  }
  sprayCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  const rect = element.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height * 0.52;
  const driftX = (Math.random() - 0.5) * 48;
  const driftY = -(96 + Math.random() * 42);
  const startRotation = (Math.random() - 0.5) * 10;
  const endRotation = startRotation + (Math.random() - 0.5) * 18;

  gsap.set(overlay, {
    display: 'block',
    left: cx,
    top: cy,
    width: getGulalPowderSize(),
    xPercent: -50,
    yPercent: -50,
    x: 0,
    y: 0,
    scale: 0.5,
    rotation: startRotation,
    opacity: 1,
  });

  gsap.to(overlay, {
    opacity: 0,
    scale: 5,
    x: driftX,
    y: driftY,
    rotation: endRotation,
    duration: GULAL_BURST_DURATION,
    ease: 'sine.out',
    onComplete: () => {
      stopGulalPowderImageEffect();
      if (typeof onComplete === 'function') onComplete();
    },
  });
}


/* ================================================================
   Z-INDEX MANAGEMENT
   ================================================================ */
let activeAsset = null;
let tapAffordanceEnabled = false;
const tapAffordanceTweens = new Map();

function getTapAffordanceConfig(asset) {
  if (!asset?.id) return null;
  return TAP_AFFORDANCE_NUDGE[asset.id] || null;
}

function stopTapAffordanceForAsset(asset) {
  const tween = tapAffordanceTweens.get(asset);
  if (!tween) return;
  tween.kill();
  tapAffordanceTweens.delete(asset);
}

function startTapAffordanceForAsset(asset) {
  if (REDUCED_MOTION) return;
  if (!asset || !tapAffordanceEnabled || activeAsset === asset) return;
  const config = getTapAffordanceConfig(asset);
  if (!config) return;

  stopTapAffordanceForAsset(asset);

  const multiplier = LOW_PERF_MODE ? 0.75 : 1;
  const baseX = Number(gsap.getProperty(asset, 'x')) || 0;
  const baseY = Number(gsap.getProperty(asset, 'y')) || 0;
  const baseRotation = Number(gsap.getProperty(asset, 'rotation')) || 0;

  const tween = gsap.to(asset, {
    x: baseX + config.dx * multiplier,
    y: baseY + config.dy * multiplier,
    rotation: baseRotation + config.dr * multiplier,
    duration: config.duration,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    delay: config.delay,
    overwrite: 'auto',
  });

  tapAffordanceTweens.set(asset, tween);
}

function startTapAffordanceNudges() {
  tapAffordanceEnabled = true;
  ['#assetGujiya', '#assetGujiya2', '#assetPichkari', '#assetGulal']
    .map((selector) => $(selector))
    .filter(Boolean)
    .forEach((asset) => startTapAffordanceForAsset(asset));
}

function bringToFront(asset, options = {}) {
  const { useBackdrop = true } = options;
  if (activeAsset && activeAsset !== asset) return;
  stopTapAffordanceForAsset(asset);
  activeAsset = asset;
  asset.style.zIndex = 50;
  asset.classList.add('interacting');
  if (useBackdrop) assetBackdrop.classList.add('active');
}

function resetAsset(asset) {
  asset.style.zIndex = '';
  asset.classList.remove('interacting');
  assetBackdrop.classList.remove('active');
  activeAsset = null;
  startTapAffordanceForAsset(asset);
}

function clampTranslationToViewport(element, targetX, targetY, margin = ASSET_ANIMATION_MARGIN) {
  const currentX = Number(gsap.getProperty(element, 'x')) || 0;
  const currentY = Number(gsap.getProperty(element, 'y')) || 0;
  const rect = element.getBoundingClientRect();
  const deltaX = targetX - currentX;
  const deltaY = targetY - currentY;

  let clampedX = targetX;
  let clampedY = targetY;

  const nextLeft = rect.left + deltaX;
  const nextRight = rect.right + deltaX;
  const nextTop = rect.top + deltaY;
  const nextBottom = rect.bottom + deltaY;

  if (nextLeft < margin) clampedX += margin - nextLeft;
  if (nextRight > window.innerWidth - margin) clampedX -= nextRight - (window.innerWidth - margin);
  if (nextTop < margin) clampedY += margin - nextTop;
  if (nextBottom > window.innerHeight - margin) clampedY -= nextBottom - (window.innerHeight - margin);

  return { x: clampedX, y: clampedY };
}

function getBoxWrapperScale() {
  const rect = boxWrapper.getBoundingClientRect();
  const scaleX = rect.width / boxWrapper.offsetWidth || 1;
  const scaleY = rect.height / boxWrapper.offsetHeight || 1;
  return { scaleX, scaleY };
}

function getCenteredLocalTarget(element) {
  const rect = element.getBoundingClientRect();
  const currentX = Number(gsap.getProperty(element, 'x')) || 0;
  const currentY = Number(gsap.getProperty(element, 'y')) || 0;
  const viewportCenterX = window.innerWidth / 2;
  const viewportCenterY = window.innerHeight / 2;
  const elementCenterX = rect.left + rect.width / 2;
  const elementCenterY = rect.top + rect.height / 2;
  const deltaViewportX = viewportCenterX - elementCenterX;
  const deltaViewportY = viewportCenterY - elementCenterY;
  const { scaleX, scaleY } = getBoxWrapperScale();

  return {
    x: currentX + deltaViewportX / scaleX,
    y: currentY + deltaViewportY / scaleY,
  };
}


/* ================================================================
   ASSET: PICHKARI
   ================================================================ */
$('#assetPichkari').addEventListener('click', () => {
  if (activeAsset || !experienceReady) return;
  trackEvent('webview_landing_page_interacted', 'holi2026_pichkari_click');
  unlockInteractionSounds();
  const el = $('#assetPichkari');
  const leverEl = el.querySelector('.asset-pichkari-lever');
  bringToFront(el, { useBackdrop: false });

  const baseRotation = Number(gsap.getProperty(el, 'rotation')) || -10;
  gsap.killTweensOf([el, leverEl].filter(Boolean));
  if (leverEl) gsap.set(leverEl, { y: 0 });

  const tl = gsap.timeline({ onComplete: () => resetAsset(el) });

  tl.to(el, {
    scale: 1.17,
    y: -12,
    duration: 0.24,
    ease: 'power2.out',
  });

  queuePichkariSpray(tl, el, leverEl);

  tl.to({}, { duration: 0.16 });
  tl.to(el, {
    x: () => clampTranslationToViewport(el, -100, 60).x,
    y: () => clampTranslationToViewport(el, -100, 60).y,
    rotation: baseRotation - 20,
    duration: 0.4,
    ease: 'power2.inOut',
  });

  queuePichkariSpray(tl, el, leverEl);

  tl.to({}, { duration: 0.14 });
  tl.to(el, {
    x: () => clampTranslationToViewport(el, -30, 150).x,
    y: () => clampTranslationToViewport(el, -30, 150).y,
    rotation: baseRotation + 18,
    duration: 0.42,
    ease: 'power2.inOut',
  });

  queuePichkariSpray(tl, el, leverEl);

  tl.to({}, { duration: 0.22 });
  tl.to(el, {
    scale: 1,
    rotation: baseRotation,
    x: 0,
    y: 0,
    duration: 0.45,
    ease: 'power2.out',
  });
});


/* ================================================================
   ASSET: GUJIYA
   ================================================================ */
function bindGujiyaInteraction(selector) {
  const el = $(selector);
  if (!el) return;

  el.addEventListener('click', () => {
    if (activeAsset || !experienceReady) return;
    trackEvent('webview_landing_page_interacted', 'holi2026_gujiya_click');
    unlockInteractionSounds();
    const biteTarget = el.querySelector('.asset-img');
    if (!biteTarget) return;
    bringToFront(el, { useBackdrop: false });
    gsap.killTweensOf(el);
    const baseRotation = Number(gsap.getProperty(el, 'rotation')) || -7;
    const centerTarget = getCenteredLocalTarget(el);

    const tl = gsap.timeline({ onComplete: () => resetAsset(el) });

    tl.to(el, {
      x: centerTarget.x,
      y: centerTarget.y,
      scale: 1.8,
      duration: GUJIYA_MOVE_TO_CENTER_DURATION,
      ease: 'power2.out',
    });
    tl.call(() => setGujiyaClipPath(biteTarget, GUJIYA_CLIPPATH.full));
    tl.set(el, { opacity: 1 });
    tl.call(() => playInteractionSoundRepeated('gujiya', 3, 220));

    GUJIYA_CLIPPATH.bites.forEach((bitePath, index) => {
      const shakeAmplitude = Math.max(2.2, 5 - index * 0.6);

      tl.to(el, { rotation: baseRotation - shakeAmplitude, duration: GUJIYA_BITE_SHAKE_DURATION });
      tl.to(el, { rotation: baseRotation + shakeAmplitude, duration: GUJIYA_BITE_SHAKE_DURATION });
      tl.to(el, { rotation: baseRotation, duration: GUJIYA_BITE_SHAKE_DURATION * 0.85 });
      tl.call(() => setGujiyaClipPath(biteTarget, bitePath));
      tl.to({}, { duration: GUJIYA_BITE_HOLD_DURATION });
    });

    tl.call(() => setGujiyaClipPath(biteTarget, GUJIYA_CLIPPATH.eaten));
    tl.to({}, { duration: 0.06 });
    tl.to(el, {
      opacity: 0,
      scale: 1.7,
      duration: GUJIYA_EATEN_POP_DURATION,
      ease: 'power1.in',
    });
    tl.call(() => setGujiyaClipPath(biteTarget, GUJIYA_CLIPPATH.full));
    tl.set(el, {
      x: -30,
      y: 50,
      rotation: baseRotation,
      opacity: 0,
      scale: 1,
    });

    tl.to(el, {
      x: 0,
      y: 0,
      opacity: 1,
      duration: GUJIYA_RETURN_DURATION,
      ease: 'power2.out',
    });
  });
}

bindGujiyaInteraction('#assetGujiya');
bindGujiyaInteraction('#assetGujiya2');


/* ================================================================
   ASSET: GULAL
   ================================================================ */
$('#assetGulal').addEventListener('click', () => {
  if (activeAsset || !experienceReady) return;
  trackEvent('webview_landing_page_interacted', 'holi2026_gulal_click');
  unlockInteractionSounds();
  const el = $('#assetGulal');
  const gulalFillLayer = el.querySelector('.asset-gulal-fill');
  if (!gulalFillLayer) return;
  bringToFront(el, { useBackdrop: false });
  gsap.killTweensOf([el, gulalFillLayer]);
  const baseRotation = Number(gsap.getProperty(el, 'rotation')) || 9;
  const centerTarget = getCenteredLocalTarget(el);

  const tl = gsap.timeline({
    onComplete: () => resetAsset(el),
  });
  tl.set(gulalFillLayer, { opacity: 1 });

  tl.to(el, {
    x: centerTarget.x,
    y: centerTarget.y,
    scale: 1.5,
    duration: 0.45,
    ease: 'power2.out',
  });

  tl.to(el, { scale: 1.6, duration: 0.15, ease: 'power2.out' });
  tl.to(el, { rotation: baseRotation - 8, duration: 0.06, ease: 'power1.inOut' });
  tl.to(el, { rotation: baseRotation + 8, duration: 0.06, ease: 'power1.inOut' });
  tl.to(el, { rotation: baseRotation - 4, duration: 0.06, ease: 'power1.inOut' });
  tl.to(el, { rotation: baseRotation, duration: 0.05, ease: 'power1.out' });
  tl.call(() => {
    playInteractionSound('gulal');
    triggerColorBurst(el, () => {
      if (tl.paused()) tl.resume();
    });
  });
  tl.to(gulalFillLayer, { opacity: 0, duration: 0.16, ease: 'power1.out' });
  tl.addPause();
  tl.to(el, {
    x: 0,
    y: 0,
    scale: 1,
    rotation: baseRotation,
    duration: 0.45,
    ease: 'power2.inOut',
  });
  tl.to(gulalFillLayer, { opacity: 1, duration: 0.2, ease: 'power1.inOut' });
});


/* ================================================================
   RESIZE
   ================================================================ */
window.addEventListener('resize', resizeSprayCanvas);
resizeSprayCanvas();
void startExperience();

function stopDemoAudio() {
  Object.values(interactionSounds).forEach(({pool})=>pool.forEach(audio=>{audio.pause();audio.currentTime=0;}));
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopDemoAudio();});
window.addEventListener('pagehide',stopDemoAudio);
