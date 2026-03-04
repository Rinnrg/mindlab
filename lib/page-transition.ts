/**
 * macOS Liquid Glass page transition — scale + blur spring effect
 *
 * Inspired by macOS window open/close: content "zooms" up from the dock
 * position with a liquid‐blur that clears as it settles.
 */

export interface PageTransitionOptions {
  enteringEl: HTMLElement;
  leavingEl: HTMLElement;
  direction: 'forward' | 'back';
}

/**
 * Spring‐style easing approximation via cubic‐bezier.
 * Real springs aren't representable in CSS/WAAPI easings so we use an
 * aggressive overshoot curve that *feels* spring‑like.
 */
const SPRING_IN  = 'cubic-bezier(0.22, 1.0, 0.36, 1.0)';   // ease-out-quint with overshoot
const SPRING_OUT = 'cubic-bezier(0.55, 0.0, 0.68, 0.53)';   // ease-in-quint

export function runPageTransition(options: PageTransitionOptions): Promise<void> {
  const { enteringEl, leavingEl, direction } = options;

  const isForward = direction === 'forward';

  // ── Duration: macOS uses ~350 ms for open, ~250 ms for close ──
  const enterDuration = 300;
  const leaveDuration = 200;

  // ── Enter: page scales up from small + blurred (like opening from dock) ──
  // Reduced blur intensity for better GPU performance
  const enterFrom = {
    transform: isForward
      ? 'scale(0.95) translateY(20px)'
      : 'scale(1.02) translateY(-10px)',
    opacity: '0',
    filter: 'blur(6px)',
  };

  const enterTo = {
    transform: 'scale(1) translateY(0px)',
    opacity: '1',
    filter: 'blur(0px)',
  };

  // ── Leave: page shrinks / pushes away + blurs ──
  const leaveFrom = {
    transform: 'scale(1) translateY(0px)',
    opacity: '1',
    filter: 'blur(0px)',
  };

  const leaveTo = {
    transform: isForward
      ? 'scale(1.03) translateY(-12px)'
      : 'scale(0.95) translateY(20px)',
    opacity: '0',
    filter: 'blur(4px)',
  };

  // Set initial state
  Object.assign(enteringEl.style, enterFrom);
  Object.assign(leavingEl.style, leaveFrom);

  const enterAnim = enteringEl.animate(
    [
      enterFrom,
      enterTo,
    ],
    { duration: enterDuration, easing: SPRING_IN, fill: 'forwards' },
  );

  const leaveAnim = leavingEl.animate(
    [leaveFrom, leaveTo],
    { duration: leaveDuration, easing: SPRING_OUT, fill: 'forwards' },
  );

  return Promise.all([enterAnim.finished, leaveAnim.finished]).then(() => {
    // Cleanup
    for (const el of [enteringEl, leavingEl]) {
      el.style.transform = '';
      el.style.opacity   = '';
      el.style.filter    = '';
    }
  });
}
