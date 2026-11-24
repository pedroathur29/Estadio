import { useStore } from '../store';

export function Logo({ onClick }) {
  return (
    <button className="logo" onClick={onClick} aria-label="Arena Pass — início">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#c8ff2e" />
        <path d="M8 22 16 8l8 14z" fill="none" stroke="#07090f" strokeWidth="3" strokeLinejoin="round" />
      </svg>
      <span>
        ARENA<b>PASS</b>
      </span>
    </button>
  );
}

export function Header({ transparent = false }) {
  const go = useStore((s) => s.go);
  const view = useStore((s) => s.view);
  const scrollTo = (id) => {
    if (view !== 'home') go('home');
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };
  return (
    <header className={`site-header ${transparent ? 'is-transparent' : ''}`}>
      <div className="wrap header-inner">
        <Logo onClick={() => go('home')} />
        <nav className="main-nav" aria-label="Principal">
          <button onClick={() => scrollTo('jogos')}>Jogos</button>
          <button onClick={() => scrollTo('estadio')}>Estádio</button>
          <button onClick={() => scrollTo('como-funciona')}>Como funciona</button>
        </nav>
        <span className="demo-chip" title="Projeto de portfólio: nenhuma venda ou pagamento é realizado">
          <i /> Demo
        </span>
      </div>
    </header>
  );
}

export function DemoNotice() {
  return (
    <div className="demo-notice" role="note">
      Demonstração para portfólio · dados e preços fictícios · sem vendas reais
    </div>
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
