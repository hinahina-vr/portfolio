export function bindDialogDismissal({dialog, toggle, closeButton, onClose, canClose = () => true}) {
  closeButton.onclick = () => dialog.close();
  dialog.addEventListener('close', () => {
    toggle.setAttribute('aria-expanded', 'false');
    onClose();
  });
  dialog.addEventListener('cancel', event => {
    if (!canClose()) event.preventDefault();
  });
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    const outside = event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom;
    if (canClose() && event.target === dialog && outside) dialog.close();
  });
}

export function bindMainMenu({dialog, toggle, closeButton, beforeOpen, afterOpen, onClose, onTouchStart}) {
  let touchPointer = null;
  let compatibilityClick = null;

  function open() {
    beforeOpen();
    dialog.showModal();
    afterOpen();
    toggle.setAttribute('aria-expanded', 'true');
  }

  toggle.onclick = open;
  toggle.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch') return;
    event.preventDefault();
    touchPointer = event.pointerId;
    onTouchStart();
  });
  toggle.addEventListener('pointerup', event => {
    if (touchPointer !== event.pointerId) return;
    touchPointer = null;
    event.preventDefault();
    const bounds = toggle.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) return;
    compatibilityClick = {
      id: event.pointerId, x: event.clientX, y: event.clientY,
      until: performance.now() + 700
    };
    open();
  });
  toggle.addEventListener('pointercancel', () => { touchPointer = null; });

  // A modal can retarget the opening touch's later click onto its backdrop.
  // Consume only that click; mouse, keyboard and subsequent taps still work.
  document.addEventListener('click', event => {
    const touch = compatibilityClick;
    if (!touch || event.detail === 0 || performance.now() > touch.until) return;
    if ((event.pointerId === touch.id || !('pointerId' in event)) &&
        Math.abs(event.clientX - touch.x) < 3 && Math.abs(event.clientY - touch.y) < 3) {
      compatibilityClick = null;
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  bindDialogDismissal({dialog, toggle, closeButton, onClose});
}
