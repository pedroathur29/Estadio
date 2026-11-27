import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { FEATURED, MATCH_BY_ID } from './data/matches';
import { SECTOR_BY_ID } from './data/sectors';
import { replaceUrl, syncHistory, viewFromUrl } from './lib/history';

// 'instant' ignores the CSS `scroll-behavior: smooth`, so a new screen starts at the top at once
const scrollTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

const createStore = (set, get) => ({
  // navigation: home | stadium | seats | summary | confirm
  view: viewFromUrl(),
  matchId: FEATURED.id,

  // stadium explorer
  sectorId: null,
  hoveredId: null,
  cameraMode: 'overview', // overview | sector | pov
  roof: true,
  viewShots: {}, // sectorId -> dataURL of the field view
  captureId: null,
  resetTick: 0,
  zoomTick: { n: 0, dir: 0 },

  // purchase
  qty: 2,
  seats: [], // { key, row, col, label }
  ticketTypes: {}, // key -> 'inteira' | 'meia'
  payment: 'pix',
  order: null,

  go(view) {
    // heading to the seat map on purpose starts a new purchase
    set(view === 'seats' ? { view, order: null } : { view });
    scrollTop();
  },
  redirect(view) {
    replaceUrl(view);
    set({ view });
  },
  openMatch(matchId) {
    set({ matchId, view: 'stadium', sectorId: null, cameraMode: 'overview', seats: [], ticketTypes: {}, qty: 2, resetTick: get().resetTick + 1 });
    scrollTop();
  },
  selectSector(sectorId) {
    if (!sectorId) {
      set({ sectorId: null, cameraMode: 'overview', resetTick: get().resetTick + 1 });
      return;
    }
    const changed = sectorId !== get().sectorId;
    set({
      sectorId,
      cameraMode: 'sector',
      seats: changed ? [] : get().seats,
      ticketTypes: changed ? {} : get().ticketTypes,
      captureId: get().viewShots[sectorId] ? get().captureId : sectorId,
    });
  },
  setHovered(hoveredId) {
    if (get().hoveredId !== hoveredId) set({ hoveredId });
  },
  setCameraMode(cameraMode) {
    set({ cameraMode });
  },
  overview() {
    set({ cameraMode: 'overview', resetTick: get().resetTick + 1 });
  },
  zoom(dir) {
    set({ zoomTick: { n: get().zoomTick.n + 1, dir } });
  },
  toggleRoof() {
    set({ roof: !get().roof });
  },
  storeShot(sectorId, url) {
    set({ viewShots: { ...get().viewShots, [sectorId]: url }, captureId: null });
  },
  setQty(qty) {
    const seats = get().seats.slice(0, qty);
    set({ qty, seats });
  },
  toggleSeat(seat) {
    const { seats, qty } = get();
    const exists = seats.find((s) => s.key === seat.key);
    if (exists) {
      set({ seats: seats.filter((s) => s.key !== seat.key) });
    } else if (seats.length < qty) {
      set({ seats: [...seats, seat] });
    } else {
      // replace the oldest pick so the user never gets stuck
      set({ seats: [...seats.slice(1), seat] });
    }
  },
  clearSeats() {
    set({ seats: [] });
  },
  setTicketType(key, type) {
    set({ ticketTypes: { ...get().ticketTypes, [key]: type } });
  },
  setPayment(payment) {
    set({ payment });
  },
  placeOrder(order) {
    set({ order, view: 'confirm', seats: [], ticketTypes: {} });
    scrollTop();
  },
  restart() {
    set({ view: 'home', sectorId: null, seats: [], ticketTypes: {}, order: null, cameraMode: 'overview' });
    scrollTop();
  },
});

export const useStore = create(
  persist(createStore, {
    // the purchase survives a reload and is discarded when the tab is closed
    name: 'arena-pass',
    storage: createJSONStorage(() => window.sessionStorage),
    partialize: ({ matchId, sectorId, qty, seats, ticketTypes, payment, order }) => ({ matchId, sectorId, qty, seats, ticketTypes, payment, order }),
    merge: (saved, current) => {
      if (!saved || !MATCH_BY_ID[saved.matchId] || (saved.sectorId && !SECTOR_BY_ID[saved.sectorId])) return current;
      const state = { ...current, ...saved };
      // field views are not saved: ask for the selected sector's one again
      return state.sectorId ? { ...state, cameraMode: 'sector', captureId: state.sectorId } : state;
    },
  }),
);

syncHistory(useStore);
