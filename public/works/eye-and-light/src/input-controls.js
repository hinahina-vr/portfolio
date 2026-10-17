// Fire touch actions on contact, even for a second/third finger, exactly once.
export function bindPress(button, action) {
  let lastTouch = -Infinity;
  button.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' || button.disabled) return;
    event.preventDefault();
    lastTouch = performance.now();
    action();
  });
  button.onclick = event => {
    if (event.detail > 0 && performance.now() - lastTouch < 1000) return;
    action();
  };
}

export function bindMovementPad({buttons, stage, getAvatar, canMove}) {
  const pointers = new Map();

  function release(event) {
    const button = pointers.get(event.pointerId);
    if (!button) return;
    pointers.delete(event.pointerId);
    // Two fingers may hold the same direction: release only the last owner.
    if (![...pointers.values()].includes(button)) {
      getAvatar()?.touchKeys.delete(button.dataset.move);
      button.classList.remove('held');
    }
  }

  for (const button of buttons) {
    button.addEventListener('pointerdown', event => {
      if (!canMove() || event.button !== 0) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, button);
      getAvatar().touchKeys.add(button.dataset.move);
      button.classList.add('held');
      stage.focus({preventScroll: true});
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      button.addEventListener(event, release);
    }
  }

  stage.addEventListener('avatarinputclear', () => {
    const held = [...pointers];
    pointers.clear();
    for (const [id, button] of held) {
      button.classList.remove('held');
      if (button.hasPointerCapture(id)) button.releasePointerCapture(id);
    }
  });
}
