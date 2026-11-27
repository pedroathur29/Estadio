import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MATCH_BY_ID } from './data/matches';
import { PLAN_BY_ID } from './data/content';
import { SECTOR_BY_ID } from './data/sectors';

// What stays on this device between visits: simulated orders and the simulated membership.
export const useAccount = create(
  persist(
    (set, get) => ({
      orders: [], // newest first
      plan: null, // id in PLANS
      addOrder(order) {
        set({ orders: [order, ...get().orders] });
      },
      cancelOrder(code) {
        set({ orders: get().orders.filter((o) => o.code !== code) });
      },
      setPlan(plan) {
        set({ plan });
      },
    }),
    {
      name: 'arena-pass-conta',
      storage: createJSONStorage(() => window.localStorage),
      merge: (saved, current) => ({
        ...current,
        // drop anything that no longer matches the catalogue
        orders: (saved?.orders ?? []).filter((o) => MATCH_BY_ID[o?.matchId] && SECTOR_BY_ID[o?.sectorId] && Array.isArray(o.lines) && o.matchDate),
        plan: PLAN_BY_ID[saved?.plan] ? saved.plan : null,
      }),
    },
  ),
);
