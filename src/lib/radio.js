const STEP = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/**
 * Arrow keys for a `role="radiogroup"` built from buttons: moves to the neighbouring option and
 * selects it. Pair with `tabIndex={checked ? 0 : -1}` so Tab enters the group only once.
 */
export function onRadioKeys(e) {
  const step = STEP[e.key];
  if (!step) return;
  const radios = [...e.currentTarget.querySelectorAll('[role="radio"]')];
  const i = radios.indexOf(e.target);
  if (i < 0) return;
  e.preventDefault();
  const next = radios[(i + step + radios.length) % radios.length];
  next.focus();
  next.click();
}
