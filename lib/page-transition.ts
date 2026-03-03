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
  const enterDuration = 380;
  const leaveDuration = 260;

  // ── Enter: page scales up from small + blurred (like opening from dock) ──
  const enterFrom = {
    transform: isForward
      ? 'scale(0.92) translateY(30px)'
      : 'scale(1.04) translateY(-14px)',
    opacity: '0',
    filter: 'blur(16px)',
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
      ? 'scale(1.05) translateY(-18px)'
      : 'scale(0.92) translateY(30px)',
    opacity: '0',
    filter: 'blur(14px)',
  };

  // Set initial state
  Object.assign(enteringEl.style, enterFrom);
  Object.assign(leavingEl.style, leaveFrom);

  const enterAnim = enteringEl.animate(
    [
      enterFrom,
      // slight overshoot at 60 %
      {
        transform: isForward
          ? 'scale(1.012) translateY(-3px)'
          : 'scale(0.994) translateY(2px)',
        opacity: '0.95',
        filter: 'blur(0.5px)',
        offset: 0.6,
      },
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
