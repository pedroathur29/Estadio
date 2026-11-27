// Fictional match-day information, membership plans and club form for the demo.
import { seeded } from '../lib/rng';

export const GATES = [
  { id: 'A', name: 'Portão A', access: 'Avenida do Horizonte', sides: ['Oeste', 'Noroeste'] },
  { id: 'B', name: 'Portão B', access: 'Rua das Bandeiras', sides: ['Sul', 'Sudoeste'] },
  { id: 'C', name: 'Portão C', access: 'Entrada exclusiva de visitantes, Rua do Porto', sides: ['Sudeste'] },
  { id: 'D', name: 'Portão D', access: 'Alameda Leste, ao lado da estação', sides: ['Leste'] },
  { id: 'E', name: 'Portão E', access: 'Praça do Norte', sides: ['Norte', 'Nordeste'] },
];

export const gateFor = (sector) => GATES.find((g) => g.sides.includes(sector.side)) ?? GATES[0];

/** Gates open this long before kick-off. */
export const GATES_OPEN_MS = 2 * 3600000;

export const PLANS = [
  { id: 'torcida', name: 'Torcida', price: 29.9, off: 0.25, noFee: false, early: '24 horas', extras: 'Newsletter do clube' },
  { id: 'cadeira', name: 'Cadeira Cativa', price: 79.9, off: 0.5, noFee: true, early: '72 horas', extras: 'Visita ao vestiário uma vez por temporada' },
];

export const PLAN_BY_ID = Object.fromEntries(PLANS.map((p) => [p.id, p]));

export const FAQ = [
  ['Como funciona a meia-entrada?', 'Nesta demonstração a meia custa metade da inteira. Você escolhe o tipo de cada ingresso no resumo do pedido. Num jogo real, o documento que comprova o direito é pedido na entrada.'],
  ['Onde ficam os ingressos depois da compra?', 'Em Meus ingressos, neste navegador. De lá você pode imprimir, colocar o jogo no seu calendário ou cancelar o pedido.'],
  ['Posso cancelar um pedido?', 'Sim, em Meus ingressos, até o horário do jogo. Como nada é cobrado, não existe reembolso.'],
  ['O desconto de sócio vale para todos os ingressos?', 'Vale para um ingresso de cada pedido, o de maior valor entre as inteiras. Ele não se soma à meia-entrada.'],
  ['Crianças pagam ingresso?', 'Na Arena Horizonte fictícia, crianças com menos de 5 anos entram no colo de um responsável, sem assento próprio.'],
  ['O jogo acontece com chuva?', 'Sim. Todos os lugares são cobertos. Guarda-chuvas grandes ficam retidos no portão.'],
];

export const ALLOWED = ['Documento com foto', 'Ingresso impresso ou na tela do celular', 'Bandeiras de mão sem mastro', 'Capa de chuva', 'Garrafa plástica sem tampa, de até 500 ml'];
export const FORBIDDEN = ['Garrafas de vidro e latas', 'Fogos de artifício e sinalizadores', 'Guarda-chuva com ponta metálica', 'Câmeras com lente destacável', 'Mochilas grandes'];

export const ARRIVE = [
  ['Trem', 'Estação Arena, a 300 m do Portão D. Em dia de jogo há viagens extras até uma hora depois do apito final.'],
  ['Ônibus', 'Linhas 12, 34 e 90 param na Avenida do Horizonte, em frente ao Portão A.'],
  ['Carro', 'Estacionamento norte com 1.200 vagas, aberto três horas antes. Chegue cedo: não há vagas na rua.'],
  ['Bicicleta', 'Bicicletário gratuito e vigiado na Praça do Norte, junto ao Portão E.'],
];

export const ACCESS = [
  'Lugares para cadeira de rodas, com um assento para acompanhante, no anel inferior.',
  'Elevadores nos portões A e D.',
  'Banheiros adaptados em todos os níveis.',
  'Sala sensorial no setor Leste, mediante pedido na entrada.',
];

/** Last five results of a club, oldest first: 'V' win, 'E' draw, 'D' loss. */
export function recentForm(teamId) {
  const rnd = seeded('form', teamId);
  return Array.from({ length: 5 }, () => {
    const r = rnd();
    return r < 0.45 ? 'V' : r < 0.72 ? 'E' : 'D';
  });
}
