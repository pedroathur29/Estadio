import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { useAccount } from '../account';

export function Logo({ onClick }) {
  return (
    <button className="logo" onClick={onClick} aria-label="Arena Pass, página inicial">
      {/* a ticket stub with its two notches */}
      <svg width="34" height="24" viewBox="0 0 34 24" aria-hidden="true">
        <path d="M2 0h30a2 2 0 0 1 2 2v6a4 4 0 0 0 0 8v6a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-6a4 4 0 0 0 0-8V2a2 2 0 0 1 2-2Z" fill="#ffc21a" />
        <path d="M24 3v18" stroke="#17120a" strokeWidth="1.6" strokeDasharray="2.4 2.6" />
        <path d="M7.5 18 13 6l5.500 12h-3.2L13 12.6 10.7 18Z" fill="#17120a" />
      </svg>
      <span>Arena Pass</span>
    </button>
  );
}

const NAV = [
  { view: 'home', anchor: 'jogos', label: 'Jogos' },
  { view: 'plans', label: 'Sócio' },
  { view: 'guide', label: 'Dia de jogo' },
  { view: 'tickets', label: 'Meus ingressos' },
];

export function Header({ transparent = false }) {
  const go = useStore((s) => s.go);
  const view = useStore((s) => s.view);
  const count = useAccount((s) => s.orders.reduce((n, o) => n + o.lines.length, 0));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const visit = ({ view: target, anchor }) => {
    setOpen(false);
    if (view !== target) go(target);
    if (anchor) setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  return (
    <header className={`site-header night ${transparent && !open ? 'is-transparent' : ''}`}>
      <div className="wrap header-inner">
        <Logo onClick={() => go('home')} />
        <span className="demo-chip" title="Projeto de portfólio: nenhuma venda ou pagamento é realizado">
          Demonstração
        </span>
        <button className="menu-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="main-nav">
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path d={open ? 'M6 6l12 12M18 6 6 18' : 'M4 7h16M4 12h16M4 17h16'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          Menu
        </button>
        <nav id="main-nav" className={`main-nav ${open ? 'is-open' : ''}`} aria-label="Principal">
          {NAV.map((item) => {
            const current = !item.anchor && view === item.view;
            return (
              <button key={item.label} onClick={() => visit(item)} aria-current={current ? 'page' : undefined}>
                {item.label}
                {item.view === 'tickets' && count > 0 && (
                  <span className="nav-count">
                    {count}
                    <span className="sr-only"> ingressos</span>
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  const go = useStore((s) => s.go);
  return (
    <footer className="site-footer night">
      <div className="wrap footer-inner">
        <div className="footer-about">
          <Logo onClick={() => go('home')} />
          <p>
            Projeto de portfólio. Clubes, estádio, preços e disponibilidade são fictícios, e nenhuma venda, cadastro ou
            pagamento é realizado.
          </p>
        </div>
        <nav className="footer-nav" aria-label="Rodapé">
          <button onClick={() => go('home')}>Jogos</button>
          <button onClick={() => go('plans')}>Planos de sócio</button>
          <button onClick={() => go('guide')}>Como chegar e o que levar</button>
          <button onClick={() => go('tickets')}>Meus ingressos</button>
        </nav>
      </div>
    </footer>
  );
}

export function Steps({ current }) {
  const steps = ['Setor', 'Assentos', 'Resumo', 'Confirmação'];
  return (
    <ol className="steps" aria-label="Etapas da compra">
      {steps.map((s, i) => (
        <li key={s} className={i < current ? 'done' : i === current ? 'active' : ''} aria-current={i === current ? 'step' : undefined}>
          <span className="n">{i < current ? '✓' : i + 1}</span>
          <span className="t">{s}</span>
        </li>
      ))}
    </ol>
  );
}
