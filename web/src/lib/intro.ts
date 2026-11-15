/**
 * The first-load intro (motion.css `.intro …`). index.html adds `intro` to
 * <html> before anything paints; this clears it once the frame has arrived
 * and the content has risen, so later page switches don't replay it.
 */
export function scheduleIntroEnd(): void {
  const root = document.documentElement;
  if (!root.classList.contains('intro')) return;

  const end = () => {
    root.classList.remove('intro');
    document.removeEventListener('animationstart', onStart);
    document.removeEventListener('animationend', onEnd);
    window.clearTimeout(fallback);
  };
  const onStart = (e: AnimationEvent) => {
    if (e.animationName === 'motion-frame-in') window.clearTimeout(fallback);
  };
  const onEnd = (e: AnimationEvent) => {
    // Leave time for the staggered content after the frame lands.
    if (e.animationName === 'motion-frame-in') window.setTimeout(end, 1200);
  };

  document.addEventListener('animationstart', onStart);
  document.addEventListener('animationend', onEnd);
  // Pages without the glass frame (login, landing), or a frame that never animates.
  const fallback = window.setTimeout(end, 2500);
}
