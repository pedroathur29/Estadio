import { money } from '../lib/format';
import { useStore } from '../store';

/** Switch between choosing seats inside the stadium and on the flat map. */
export function ViewSwitch({ disabled3d = false }) {
  const view = useStore((s) => s.seatView);
  const setView = useStore((s) => s.setSeatView);
  const current = disabled3d ? 'map' : view;
  return (
    <div className="view-switch" role="group" aria-label="Como escolher o lugar">
      <button aria-pressed={current === '3d'} disabled={disabled3d} onClick={() => setView('3d')}>
        No estádio 3D
      </button>
      <button aria-pressed={current === 'map'} onClick={() => setView('map')}>
        No mapa
      </button>
    </div>
  );
}

export function Quantity({ plan }) {
  const { qty, setQty, maxQty } = plan;
  return (
    <div className="qty">
      <span className="label">Ingressos</span>
      <div className="stepper">
        <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1} aria-label="Diminuir quantidade">−</button>
        <output aria-live="polite">{qty}</output>
        <button onClick={() => setQty(Math.min(maxQty, qty + 1))} disabled={qty >= maxQty} aria-label="Aumentar quantidade">+</button>
      </div>
    </div>
  );
}

/** The chosen seats; with `onView`, each one offers the view from it. */
export function PickedSeats({ plan, onView }) {
  const { qty, seats, toggleSeat } = plan;
  return (
    <ul className="picked">
      {Array.from({ length: qty }, (_, i) => {
        const s = seats[i];
        return (
          <li key={i} className={s ? 'is-filled' : ''}>
            <span className="pk-n">{i + 1}</span>
            {s ? (
              <>
                <span>{s.label}</span>
                <span className="pk-actions">
                  {onView && (
                    <button className="link" onClick={() => onView(s.key)} aria-label={`Ver o campo da ${s.label}`}>
                      Ver daqui
                    </button>
                  )}
                  <button className="pk-x" onClick={() => toggleSeat(s)} aria-label={`Remover ${s.label}`}>
                    ×
                  </button>
                </span>
              </>
            ) : (
              <span className="muted">Escolha um lugar</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function ContinueButton({ plan }) {
  const go = useStore((s) => s.go);
  const missing = plan.qty - plan.seats.length;
  return (
    <button className="btn btn-primary btn-block btn-continue" disabled={!plan.done} onClick={() => go('summary')}>
      {plan.done ? 'Continuar para o resumo' : `Faltam ${missing} assento${missing > 1 ? 's' : ''}`}
    </button>
  );
}

export function Subtotal({ plan }) {
  return (
    <div className="oa-total">
      <span>Subtotal</span>
      <strong>{money(plan.total)}</strong>
    </div>
  );
}
