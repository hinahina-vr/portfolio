import {AVATARS, avatarById} from './avatars.js';
import {bindDialogDismissal} from './menu-dialog.js';

// Own the selector DOM and loading/error UI. Model replacement belongs to the renderer.
export function createAvatarPicker({getRenderer, stage, status, onSettled, onClose}) {
  const byId = id => document.getElementById(id);
  const toggle = byId('avatar-toggle');
  const dialog = byId('avatar-menu');
  const slots = byId('avatar-slots');
  const closeButton = byId('avatar-close');
  const error = byId('avatar-error');
  const loading = byId('avatar-loading');
  const progress = byId('avatar-progress');
  const loadingLabel = byId('avatar-loading-label');
  const currentImage = byId('avatar-current-image');

  function sync() {
    const config = avatarById(getRenderer()?.avatar.avatarId);
    if (!config) return;
    currentImage.src = config.thumbnail;
    toggle.setAttribute('aria-label', 'アバターを選ぶ：' + config.shortName);
    for (const button of slots.children) {
      button.setAttribute('aria-pressed', String(button.dataset.avatar === config.id));
    }
  }

  function updateProgress(value, label) {
    progress.setAttribute('aria-valuenow', Math.round(value));
    progress.firstElementChild.style.transform = 'scaleX(' + value / 100 + ')';
    loadingLabel.textContent = label;
  }

  async function select(config) {
    const renderer = getRenderer();
    if (!renderer || renderer.avatarChanging) return;
    if (renderer.avatar.avatarId === config.id) {
      dialog.close();
      stage.focus({preventScroll: true});
      return;
    }

    renderer.avatar.clear();
    error.hidden = true;
    // Close the top-layer dialog first so it cannot obscure the loading bar.
    dialog.close();
    loading.hidden = false;
    dialog.inert = true;
    try {
      await renderer.selectAvatar(config.id, updateProgress);
      sync();
      dialog.close();
      status.textContent = config.shortName + 'に切り替えました';
    } catch {
      dialog.showModal();
      toggle.setAttribute('aria-expanded', 'true');
      error.textContent = '読み込めませんでした。今のアバターを続けています。もう一度選んでください。';
      error.hidden = false;
    } finally {
      loading.hidden = true;
      dialog.inert = false;
      onSettled();
      (dialog.open ? closeButton : stage).focus({preventScroll: true});
    }
  }

  for (const config of AVATARS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'avatar-slot';
    button.dataset.avatar = config.id;
    button.setAttribute('aria-pressed', 'false');
    const image = document.createElement('img');
    image.src = config.thumbnail;
    image.alt = '';
    const text = document.createElement('span');
    const slot = document.createElement('small');
    const name = document.createElement('strong');
    slot.textContent = config.slot;
    name.textContent = config.shortName;
    text.append(slot, name);
    const dot = document.createElement('i');
    dot.setAttribute('aria-hidden', 'true');
    button.append(image, text, dot);
    button.onclick = () => select(config);
    slots.append(button);
  }

  toggle.onclick = () => {
    if (toggle.disabled) return;
    getRenderer().avatar.clear();
    sync();
    dialog.showModal();
    toggle.setAttribute('aria-expanded', 'true');
  };
  bindDialogDismissal({
    dialog, toggle, closeButton, onClose,
    canClose: () => !getRenderer()?.avatarChanging
  });

  return {
    sync,
    close: () => dialog.close(),
    get isOpen() { return dialog.open; },
    updateAvailability(walk) {
      if (toggle.hidden === walk) toggle.hidden = !walk;
      const disabled = !walk || !!getRenderer()?.avatarChanging;
      if (toggle.disabled !== disabled) toggle.disabled = disabled;
    }
  };
}
