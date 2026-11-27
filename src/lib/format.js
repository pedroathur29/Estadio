const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const money = (v) => brl.format(v);

const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });
const dayMonth = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
const longDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

const clean = (s) => s.replace('.', '');

export function fmtShort(date) {
  return `${clean(weekday.format(date))}, ${clean(dayMonth.format(date))}`;
}

export const fmtWeekday = (date) => clean(weekday.format(date));

export function fmtLong(date) {
  const s = longDate.format(date);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function fmtTime(date) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function fmtDay(date) {
  return String(date.getDate()).padStart(2, '0');
}

export function fmtMonth(date) {
  return clean(new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date));
}
