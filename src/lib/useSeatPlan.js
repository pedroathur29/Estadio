import { useMemo, useState } from 'react';
import { useAccount } from '../account';
import { SECTOR_BY_ID, seatLayout, ROW_LETTERS } from '../data/sectors';
import { occupiedSeats, sectorStatus } from '../data/matches';
import { useStore } from '../store';

/** A seat as the purchase stores it, from its row and position indexes. */
export const seatInfo = (r, i) => ({
  key: `${r}-${i}`,
  row: ROW_LETTERS[r],
  num: i + 1,
  label: `Fila ${ROW_LETTERS[r]} · Assento ${i + 1}`,
});

/** Which seats of a sector are occupied, and which of those belong to this browser's own orders. */
export function useOccupancy(matchId, sectorId) {
  const orders = useAccount((s) => s.orders);
  return useMemo(() => {
    const mine = new Set(
      orders.filter((o) => o.matchId === matchId && o.sectorId === sectorId).flatMap((o) => o.lines.map((l) => l.key)),
    );
    return { mine, taken: new Set([...occupiedSeats(matchId, sectorId), ...mine]) };
  }, [orders, matchId, sectorId]);
}

/**
 * Everything both seat pickers (3D and map) share. Seats are split into blocks of `blockSize`
 * positions so a part of the sector fits on screen.
 */
export function useSeatPlan(blockSize) {
  const matchId = useStore((s) => s.matchId);
  const sectorId = useStore((s) => s.sectorId);
  const qty = useStore((s) => s.qty);
  const seats = useStore((s) => s.seats);
  const toggleSeat = useStore((s) => s.toggleSeat);
  const clearSeats = useStore((s) => s.clearSeats);
  const setQty = useStore((s) => s.setQty);
  const storedBlock = useStore((s) => s.seatBlock);
  const setBlock = useStore((s) => s.setSeatBlock);

  const sector = SECTOR_BY_ID[sectorId];
  const st = sectorStatus(matchId, sectorId);
  const layout = seatLayout(sector);
  const { mine, taken } = useOccupancy(matchId, sectorId);
  const maxLen = Math.max(...layout.rows.map((r) => r.seats.length));
  const blocks = Math.max(1, Math.ceil(maxLen / blockSize));
  // the block is remembered as a seat position, so it survives switching between block sizes
  const block = Math.min(blocks - 1, storedBlock == null ? Math.floor((blocks - 1) / 2) : Math.floor(storedBlock / blockSize));
  const showBlock = (b) => setBlock(b * blockSize);

  const freeInBlock = (b) =>
    layout.rows.reduce(
      (n, row, r) => n + row.seats.slice(b * blockSize, (b + 1) * blockSize).filter((_, i) => !taken.has(`${r}-${b * blockSize + i}`)).length,
      0,
    );

  // first run of `size` adjacent free seats, searching the preferred block and rows first
  const findRun = (size, used, nearBlock, nearRow) => {
    const rowsOrder = layout.rows.map((_, r) => r).sort((a, b) => Math.abs(a - nearRow) - Math.abs(b - nearRow));
    const blocksOrder = Array.from({ length: blocks }, (_, i) => i).sort((a, b) => Math.abs(a - nearBlock) - Math.abs(b - nearBlock));
    for (const b of blocksOrder) {
      for (const r of rowsOrder) {
        const len = layout.rows[r].seats.length;
        const from = b * blockSize;
        const to = Math.min(len, from + blockSize);
        const centre = (from + to) / 2;
        const starts = [];
        for (let i = from; i + size <= to; i++) starts.push(i);
        starts.sort((x, y) => Math.abs(x + size / 2 - centre) - Math.abs(y + size / 2 - centre));
        for (const s0 of starts) {
          const keys = Array.from({ length: size }, (_, k) => `${r}-${s0 + k}`);
          if (keys.every((key) => !taken.has(key) && !used.has(key))) return { b, r, s0, keys };
        }
      }
    }
    return null;
  };

  // notice about a split suggestion; it only applies while that exact selection is kept
  const [split, setSplit] = useState(null);
  const notice = split && split.keys === seats.map((s) => s.key).join() ? split.text : '';

  const suggest = () => {
    // prefer `qty` seats together (middle rows, centre of the block); when there is no such run,
    // fall back to the largest groups available, each one as close as possible to the first
    const used = new Set();
    const picks = [];
    const groups = [];
    let nearBlock = block;
    let nearRow = layout.rows.length * 0.4;
    while (picks.length < qty) {
      let run = null;
      for (let size = qty - picks.length; size > 0 && !run; size--) run = findRun(size, used, nearBlock, nearRow);
      if (!run) break;
      if (!groups.length) {
        nearBlock = run.b;
        nearRow = run.r;
      }
      groups.push(run);
      run.keys.forEach((key, k) => {
        used.add(key);
        picks.push(seatInfo(run.r, run.s0 + k));
      });
    }
    if (!picks.length) return;
    clearSeats();
    picks.forEach(toggleSeat);
    showBlock(groups[0].b);
    setSplit(
      groups.length > 1
        ? {
            keys: picks.map((p) => p.key).join(),
            text: `Não há ${qty} lugares juntos neste setor. Sugerimos ${groups.length} grupos separados${
              groups.some((g) => g.b !== groups[0].b) ? ', em blocos diferentes' : ''
            }.`,
          }
        : null,
    );
  };

  return {
    matchId, sector, st, layout, mine, taken, maxLen, blocks, block, showBlock, freeInBlock,
    qty, seats, toggleSeat, setQty, suggest, notice,
    maxQty: Math.min(6, st.available),
    total: st.price * seats.length,
    done: seats.length === qty,
  };
}
