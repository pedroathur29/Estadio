import { create } from 'zustand';
import { FEATURED } from './data/matches';

// 'instant' ignores the CSS `scroll-behavior: smooth`, so a new screen starts at the top at once
const scrollTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

export const useStore = create((set, get) => ({
  // navigation: home | stadium | seats | summary | confirm
  view: 'home',
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
    set({ view });
    scrollTop();
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
    set({ order, view: 'confirm' });
    scrollTop();
  },
  restart() {
    set({ view: 'home', sectorId: null, seats: [], ticketTypes: {}, order: null, cameraMode: 'overview' });
    scrollTop();
  },
}));
