(() => {
  'use strict';

  const root = document.documentElement;
  const motionButton = document.querySelector('.motion-toggle');
  const artwork = document.querySelector('.artwork');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const storageKey = 'lee-hyun-motion';
  let manuallyPaused = false;
  let motionEnabled = true;
  let tiltFrame = 0;
  let pointerPosition = null;

  try {
    manuallyPaused = window.localStorage.getItem(storageKey) === 'paused';
  } catch {
    // The control also works when browser storage is unavailable.
  }

  const resetArtwork = () => {
    if (tiltFrame) window.cancelAnimationFrame(tiltFrame);
    tiltFrame = 0;
    pointerPosition = null;
    if (!artwork) return;
    artwork.style.setProperty('--tilt-x', '0deg');
    artwork.style.setProperty('--tilt-y', '0deg');
  };

  const updateMotion = () => {
    motionEnabled = !reducedMotion.matches && !manuallyPaused;
    root.classList.toggle('motion-off', !motionEnabled);
    if (!motionEnabled) resetArtwork();
    if (!motionButton) return;

    motionButton.hidden = false;
    motionButton.disabled = reducedMotion.matches;
    motionButton.setAttribute('aria-label', '애니메이션 일시 정지');
    motionButton.setAttribute('aria-pressed', String(!motionEnabled));
    motionButton.title = reducedMotion.matches
      ? '기기의 동작 줄이기 설정에 따라 애니메이션이 꺼져 있습니다.'
      : motionEnabled ? '애니메이션 일시 정지' : '애니메이션 재생';
  };

  motionButton?.addEventListener('click', () => {
    if (reducedMotion.matches) return;
    manuallyPaused = !manuallyPaused;
    try {
      window.localStorage.setItem(storageKey, manuallyPaused ? 'paused' : 'playing');
    } catch {
      // The current-page preference still works without persistence.
    }
    updateMotion();
  });

  const watchMedia = (query, callback) => {
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', callback);
    } else if (typeof query.addListener === 'function') {
      query.addListener(callback);
    }
  };

  watchMedia(reducedMotion, updateMotion);
  watchMedia(finePointer, () => {
    if (!finePointer.matches) resetArtwork();
  });
  updateMotion();

  if (!artwork) return;

  const paintTilt = () => {
    tiltFrame = 0;
    if (!motionEnabled || !finePointer.matches || !pointerPosition) return;
    const rect = artwork.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = Math.min(1, Math.max(-1, (pointerPosition.x - rect.left) / rect.width * 2 - 1));
    const y = Math.min(1, Math.max(-1, (pointerPosition.y - rect.top) / rect.height * 2 - 1));
    artwork.style.setProperty('--tilt-x', `${(-y * 1.5).toFixed(2)}deg`);
    artwork.style.setProperty('--tilt-y', `${(x * 1.5).toFixed(2)}deg`);
  };

  artwork.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch' || !motionEnabled || !finePointer.matches) return;
    pointerPosition = { x: event.clientX, y: event.clientY };
    if (!tiltFrame) tiltFrame = window.requestAnimationFrame(paintTilt);
  }, { passive: true });
  artwork.addEventListener('pointerleave', resetArtwork);
  artwork.addEventListener('mouseleave', resetArtwork);
  artwork.addEventListener('pointercancel', resetArtwork);
  window.addEventListener('blur', resetArtwork);
})();
