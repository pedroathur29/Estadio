import { Header } from '../components/Chrome';
import { PLANS, PLAN_BY_ID } from '../data/content';
import { money } from '../lib/format';
import { useAccount } from '../account';
import { useStore } from '../store';

const FEATURES = [
  ['Desconto em um ingresso por pedido', (p) => `${p.off * 100}%`, 'Nenhum'],
  ['Taxa de serviço', (p) => (p.noFee ? 'Isenta' : '10%'), '10%'],
  ['Compra antes da abertura geral', (p) => `${p.early} antes`, 'Não'],
  ['Também inclui', (p) => p.extras, 'Nada'],
];

export default function PlansPage() {
  const plan = useAccount((s) => s.plan);
  const setPlan = useAccount((s) => s.setPlan);
  const go = useStore((s) => s.go);
  return (
    <>
      <Header />
      <main className="page wrap">
        <h1>Seja sócio da Aurora</h1>
        <p className="page-sub">
          Ative um plano para ver o desconto no resumo da compra. É uma simulação: não há cadastro nem cobrança.
        </p>

        <p className="plan-state" role="status">
          {plan ? `Plano ${PLAN_BY_ID[plan].name} ativo neste navegador.` : ''}
        </p>

        <div className="plans-scroll">
          <table className="plans">
            <caption className="sr-only">Comparação entre comprar sem plano e os planos de sócio</caption>
            <thead>
              <tr>
                <td />
                <th scope="col">
                  Sem plano
                  <small>Grátis</small>
                </th>
                {PLANS.map((p) => (
                  <th scope="col" key={p.id} className={plan === p.id ? 'is-on' : ''}>
                    {p.name}
                    <small>{money(p.price)} por mês</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map(([label, value, none]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  <td>{none}</td>
                  {PLANS.map((p) => (
                    <td key={p.id} className={plan === p.id ? 'is-on' : ''}>{value(p)}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <td />
                <td>
                  {plan && <button className="btn btn-outline" onClick={() => setPlan(null)}>Cancelar plano</button>}
                </td>
                {PLANS.map((p) => (
                  <td key={p.id} className={plan === p.id ? 'is-on' : ''}>
                    <button className="btn btn-primary" disabled={plan === p.id} onClick={() => setPlan(p.id)}>
                      {plan === p.id ? 'Plano ativo' : 'Ativar'}
                      <span className="sr-only"> {p.name}</span>
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <button className="btn btn-dark btn-lg" onClick={() => go('home')}>Ver jogos</button>
      </main>
    </>
  );
}
