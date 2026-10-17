import {createAvatarPicker} from './avatar-picker.js';
import {bindMainMenu} from './menu-dialog.js';
import {bindPress, bindMovementPad} from './input-controls.js';
import {portraitStyle} from './styles.js';
import {preloader} from './preloader.js';

const $ = id => document.getElementById(id);
const stage = $('stage'),
  status = $('status'),
  play = $('play'),
  seek = $('seek'),
  auto = $('auto'),
  view = $('view'),
  experience = $('experience'),
  menu = $('menu'),
  video = $('sample'),
  artStyle = $('art-style'),
  immersionButton = $('immersion-mode'),
  touchActions = $('touch-actions'),
  touchJump = $('touch-jump'),
  touchImmersion = $('touch-immersion');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let r = null,
  playing = !reduced,
  time = 0,
  previous = null,
  dirty = true,
  mode = 'room',
  idleTimer,
  mediaLoad,
  mediaFailure = false,
  modeRevision = 0;

const state = window.eyeAndLight = {
  ready: false,
  fallback: false,
  get time() { return time; },
  get playing() { return playing; },
  get mode() { return mode; },
  get renderer() { return r; }
};

function wake() {
  document.body.classList.remove('idle');
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (!menu.open) document.body.classList.add('idle');
  }, 4000);
}

for (const event of ['pointermove', 'pointerdown', 'keydown'])
  document.addEventListener(event, wake, {passive: true});

const avatarPicker = createAvatarPicker({
  getRenderer: () => r,
  stage,
  status,
  onClose: wake,
  onSettled: () => {
    previous = null;
    dirty = true;
    update();
  }
});
bindMainMenu({
  dialog: menu,
  toggle: $('menu-toggle'),
  closeButton: $('menu-close'),
  beforeOpen: () => {
    avatarPicker.close();
    wake();
    r?.avatar.clear();
  },
  afterOpen: update,
  onClose: wake,
  onTouchStart: () => r?.avatar.clear()
});

const touchQuery = matchMedia('(any-pointer: coarse)');
let touchInput = touchQuery.matches;

function inputMode(touch) {
  if (touchInput !== touch || !document.body.dataset.input) {
    touchInput = touch;
    document.body.dataset.input = touch ? 'touch' : 'keyboard';
    syncImmersion();
  }
}

touchQuery.addEventListener('change', () => inputMode(touchQuery.matches));
document.addEventListener('pointerdown', e => {
  if (e.pointerType === 'touch') inputMode(true);
}, {passive: true});
document.addEventListener('keydown', e => {
  if (!e.isComposing && /^(Key[WASDFP]|Arrow(Up|Down|Left|Right)|Space)$/.test(e.code))
    inputMode(false);
});

function syncImmersion() {
  const walk = !!r?.avatar.ready && mode === 'room' && r.view === 'walk',
    disabled = !walk || !!r?.avatarChanging,
    pressed = String(!!r?.manualFirstPerson);
  for (const button of [immersionButton, touchImmersion]) {
    if (button.disabled !== disabled) button.disabled = disabled;
    if (button.getAttribute('aria-pressed') !== pressed)
      button.setAttribute('aria-pressed', pressed);
  }

  const label = r?.manualFirstPerson ? '没入モードを終了' : '没入モード',
    menuLabel = label + (touchInput ? '' : '（F）');
  if (immersionButton.textContent !== menuLabel) immersionButton.textContent = menuLabel;
  const touchLabel = r?.manualFirstPerson ? '戻る' : '没入';
  if (touchImmersion.textContent !== touchLabel) touchImmersion.textContent = touchLabel;
  const touchAria = r?.manualFirstPerson ? '三人称視点に戻る' : '没入モードで一人称視点にする';
  if (touchImmersion.getAttribute('aria-label') !== touchAria)
    touchImmersion.setAttribute('aria-label', touchAria);

  avatarPicker.updateAvailability(walk);
  touchActions.hidden = !walk || !touchInput;
  if (touchJump.disabled !== (!walk || !playing)) touchJump.disabled = !walk || !playing;
  const hint = walk
    ? (touchInput
      ? (playing ? '右下の▲で歩く · スワイプで見回す' : '停止中 · メニューから再生できます')
      : 'W A S D で歩く · Space でジャンプ · F で没入')
    : (touchInput ? 'スワイプで回転 · ピンチで拡大' : 'ドラッグで回転 · ホイールで拡大');
  if ($('hint').textContent !== hint) $('hint').textContent = hint;
  const stageLabel = walk
    ? (touchInput
      ? '3D空間。右下の移動ボタン、右下のジャンプ・没入ボタンで操作。スワイプで見回します。'
      : '3D空間。WASDで歩く。ドラッグで見回す。Fで没入。Spaceでジャンプ。Pで再生と停止。')
    : '3D空間。ドラッグやスワイプで回転。ホイールやピンチで拡大。';
  if (stage.getAttribute('aria-label') !== stageLabel)
    stage.setAttribute('aria-label', stageLabel);
}

inputMode(touchInput);

function jump() {
  if (mode === 'room' && !r?.avatarChanging && r?.view === 'walk' && playing && r.avatar.jump())
    dirty = true;
}

function toggleImmersion() {
  if (mode !== 'room' || r?.avatarChanging || !r?.toggleImmersion()) return;
  r.avatar.clear();
  dirty = true;
  syncImmersion();
}

immersionButton.onclick = () => {
  toggleImmersion();
  menu.close();
  stage.focus();
};
bindPress(touchImmersion, () => {
  toggleImmersion();
  stage.focus({preventScroll: true});
});
bindPress(touchJump, () => {
  jump();
  stage.focus({preventScroll: true});
});

function update() {
  syncImmersion();
  const label = playing ? '一時停止' : '再生',
    pressed = String(playing);
  if (play.textContent !== label) play.textContent = label;
  if (play.getAttribute('aria-pressed') !== pressed) play.setAttribute('aria-pressed', pressed);
  if (menu.open) {
    const t = time % 30,
      text = t.toFixed(1) + ' / 30秒',
      aria = t.toFixed(1) + '秒';
    if ($('time').value !== text) $('time').value = text;
    if (seek.value !== String(t)) seek.value = t;
    if (seek.getAttribute('aria-valuetext') !== aria) seek.setAttribute('aria-valuetext', aria);
  }
}

async function setPlaying(value) {
  playing = value;
  if (!value) r?.avatar.clear();
  previous = null;
  dirty = true;
  if (mode === 'film') {
    if (value) {
      try {
        await video.play();
      } catch {
        playing = false;
        status.textContent = 'メニューから再生してください';
      }
    } else video.pause();
  }
  update();
}

function mediaFrame() {
  if (video.readyState >= 2) return Promise.resolve();
  if (mediaFailure || video.error) return Promise.reject(Error('Video unavailable'));
  return new Promise((resolve, reject) => {
    const done = () => {
      video.removeEventListener('loadeddata', done);
      video.removeEventListener('error', failed, true);
      resolve();
    }, failed = () => {
      video.removeEventListener('loadeddata', done);
      video.removeEventListener('error', failed, true);
      reject(Error('Video unavailable'));
    };
    video.addEventListener('loadeddata', done, {once: true});
    video.addEventListener('error', failed, {once: true, capture: true});
  });
}

function ensureMedia() {
  if (video.readyState >= 1) return Promise.resolve();
  if (!mediaLoad) mediaLoad = new Promise((resolve, reject) => {
    video.addEventListener('loadedmetadata', resolve, {once: true});
    video.addEventListener('error', () => {
      mediaFailure = true;
      reject(Error('Video unavailable'));
    }, {once: true, capture: true});
    video.preload = 'auto';
    video.load();
  });
  return mediaLoad;
}

async function setMode(next) {
  r?.avatar.clear();
  if (next === 'room' && !r) return;
  const revision = ++modeRevision;
  if (mode === 'film' && video.readyState >= 1) time = video.currentTime;
  mode = next;
  document.body.dataset.mode = next;
  $('film').hidden = next !== 'film';
  stage.setAttribute('aria-hidden', String(next === 'film'));
  stage.tabIndex = next === 'film' ? -1 : 0;
  $('film-mode').textContent = next === 'film' ? '3D空間に戻る' : '旧映像サンプルを見る';
  view.disabled = next === 'film';
  artStyle.disabled = next === 'film';
  $('cycle-note').hidden = next === 'film' || !r?.autoStyle;
  $('style-note').hidden = next !== 'film';
  auto.disabled = next === 'film' || r?.view === 'walk';
  $('walk-pad').hidden = next === 'film' || r?.view !== 'walk';
  dirty = true;
  previous = null;

  if (next === 'film') {
    try {
      await ensureMedia();
      if (revision !== modeRevision) return;
      video.currentTime = time % 60;
      await setPlaying(playing);
    } catch {
      playing = false;
      status.textContent = '映像を読み込めませんでした';
      update();
    }
  } else {
    video.pause();
    update();
  }
}

play.onclick = () => setPlaying(!playing);
seek.oninput = () => {
  time = Number(seek.value);
  if (mode === 'film' && video.readyState >= 1) video.currentTime = time;
  dirty = true;
  update();
};

function syncArtworkSelection() {
  const url = new URL(location.href);
  url.searchParams.set('style', r.style);
  url.searchParams.set('cycle', r.autoStyle ? 'auto' : 'off');
  history.replaceState(null, '', url);
  artStyle.value = r.autoStyle ? 'auto' : r.style;
  $('cycle-note').hidden = !r.autoStyle;
  dirty = true;
}

artStyle.onchange = async () => {
  const requested = artStyle.value;
  artStyle.disabled = true;
  $('style-error').hidden = true;
  try {
    const applied = requested === 'auto' ? await r.enableStyleCycle() : await r.setStyle(requested);
    if (applied) {
      syncArtworkSelection();
    }
  } catch {
    artStyle.value = r.autoStyle ? 'auto' : r.style;
    $('style-error').textContent = '素材を読み込めませんでした。もう一度選んでください。';
    $('style-error').hidden = false;
  } finally {
    artStyle.disabled = mode === 'film' || !r;
  }
};

view.onchange = () => {
  if (r) {
    r.avatar.clear();
    r.view = view.value;
    r.resetImmersion();
    syncImmersion();
    auto.checked = true;
    auto.disabled = r.view === 'walk';
    $('walk-pad').hidden = r.view !== 'walk';
    document.body.dataset.view = r.view;
    dirty = true;
  }
};
auto.onchange = () => dirty = true;

$('reset').onclick = () => {
  time = 0;
  if (r) {
    r.avatar.reset();
    r.styleEpoch = 0;
    r.proximity = 0;
    r.resetImmersion();
    r.view = view.value = 'walk';
    r.avatar.follow(r.camera, 1 / 60, true);
  }
  auto.checked = true;
  auto.disabled = true;
  $('walk-pad').hidden = mode === 'film';
  document.body.dataset.view = 'walk';
  if (mode === 'film' && video.readyState >= 1) video.currentTime = 0;
  dirty = true;
  update();
};
$('film-mode').onclick = async () => {
  await setMode(mode === 'film' ? 'room' : 'film');
  menu.close();
};

document.addEventListener('keydown', e => {
  if (!state.ready || e.repeat || e.isComposing || e.ctrlKey || e.metaKey || e.altKey ||
      menu.open || avatarPicker.isOpen || r?.avatarChanging ||
      e.target.closest('button,input,textarea,select,a,summary,[contenteditable]')) return;
  if (e.code === 'KeyF') {
    e.preventDefault();
    toggleImmersion();
    return;
  }
  if (e.code === 'Space') {
    e.preventDefault();
    if (mode === 'room' && r?.view === 'walk') {
      jump();
    } else setPlaying(!playing);
    return;
  }
  if (e.code === 'KeyP') {
    e.preventDefault();
    setPlaying(!playing);
  }
});

$('fullscreen').onclick = async () => {
  menu.close();
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await experience.requestFullscreen();
  } catch {
    status.textContent = '全画面表示はこの環境では使えません';
  }
};
document.addEventListener('fullscreenchange', () => {
  $('fullscreen').textContent = document.fullscreenElement ? '全画面を終了' : '全画面にする';
  dirty = true;
});
document.addEventListener('visibilitychange', () => {
  previous = null;
  r?.avatar.clear();
  dirty = true;
});

bindMovementPad({
  buttons: document.querySelectorAll('[data-move]'),
  stage,
  getAvatar: () => r?.avatar,
  canMove: () => state.ready && r?.avatar.ready && r.view === 'walk' && !menu.open &&
    !avatarPicker.isOpen && !r.avatarChanging && mode !== 'film' && playing
});

function enable() {
  experience.inert = false;
  $('menu-toggle').disabled = false;
  for (const e of menu.querySelectorAll('button,input,select')) e.disabled = false;
  if (!document.fullscreenEnabled) $('fullscreen').hidden = true;
  document.body.classList.add('ready');
  state.ready = true;
  avatarPicker.sync();
  artStyle.disabled = !r || mode === 'film';
  if (r) {
    artStyle.value = r.autoStyle ? 'auto' : r.style;
    $('cycle-note').hidden = !r.autoStyle;
    view.value = r.view;
    document.body.dataset.view = r.view;
    auto.disabled = r.view === 'walk';
    $('walk-pad').hidden = r.view !== 'walk';
  }
  update();
  wake();
}

function frame(now) {
  requestAnimationFrame(frame);
  if (document.hidden) {
    previous = null;
    return;
  }
  if (mode === 'film') {
    if (video.readyState >= 1) {
      time = video.currentTime;
      update();
    }
    return;
  }
  if (!r || r.avatarChanging) {
    previous = null;
    return;
  }
  if (previous === null) previous = now;
  const dt = Math.min(.1, (now - previous) / 1000);
  previous = now;
  if (playing) {
    time = (time + dt) % 420;
    dirty = true;
  }
  if (r.step(dt, playing && !menu.open && !avatarPicker.isOpen && !r.avatarChanging))
    dirty = true;
  if (dirty) {
    r.render(time, {auto: auto.checked});
    update();
    dirty = false;
  }
}

preloader.update(2, '光を準備しています');
try {
  const {MeditationRenderer} = await import('./renderer.js');
  r = new MeditationRenderer(stage);
  r.onArtworkReturn = syncArtworkSelection;
  window.meditationRenderer = r;
  await r.prepare(portraitStyle(new URL(location.href).searchParams.get('style')).id, {
    cycle: new URL(location.href).searchParams.get('cycle') !== 'off',
    onProgress: preloader.update
  });
  if (r.styleLoadError) {
    $('style-error').textContent = '選択したタッチを読み込めませんでした。もう一度選んでください。';
    $('style-error').hidden = false;
  }
  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    const scale = Math.min(devicePixelRatio || 1, 2, 1920 / w, 1080 / h);
    r.resize(Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale)));
    dirty = true;
  };
  new ResizeObserver(resize).observe(stage);
  resize();
  r.render(0);
  r.controls.addEventListener('start', () => {
    if (r.view !== 'walk') auto.checked = false;
    dirty = true;
  });
  r.controls.addEventListener('change', () => dirty = true);
  enable();
  status.textContent = r.avatarError ? 'アバターを読み込めません。室内表示を続けています。' : '';
  if (location.hash === '#movie') {
    preloader.update(95, '映像を読み込んでいます');
    await setMode('film');
    await mediaFrame();
  }
  await preloader.finish();
} catch (error) {
  r = null;
  state.fallback = true;
  preloader.update(95, '映像を読み込んでいます');
  $('walk-pad').hidden = true;
  $('fallback').hidden = false;
  $('film-mode').hidden = true;
  try {
    await setMode('film');
    await mediaFrame();
    enable();
    status.textContent = '';
    await preloader.finish();
  } catch {
    preloader.fail();
  }
  console.warn('3D unavailable; fullscreen film enabled.', error.message);
}
requestAnimationFrame(frame);
