import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Order } from '../types/order';
import { sendWebhookNotification } from '../utils/webhook';

interface AuthState {
  isAuthenticated: boolean;
  isDashboardAuthenticated: boolean;
  login: (password: string) => boolean;
  loginDashboard: (password: string) => boolean;
  logout: () => void;
}

interface OrderState {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'timeRemaining'>) => void;
  updateOrder: (order: Order) => void;
}

interface Store extends AuthState, OrderState {}

const MAIN_PASSWORD = 'Nex8574@Ra';
const DASHBOARD_PASSWORD = 'NeK948@Ra';

export const useStore = create<Store>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isDashboardAuthenticated: false,
      orders: [],

      login: (password) => {
        const isValid = password === MAIN_PASSWORD;
        if (isValid) {
          set({ isAuthenticated: true });
        }
        return isValid;
      },

      loginDashboard: (password) => {
        const isValid = password === DASHBOARD_PASSWORD;
        if (isValid) {
          set({ isDashboardAuthenticated: true });
        }
        return isValid;
      },

      logout: () => set({ isAuthenticated: false, isDashboardAuthenticated: false }),

      addOrder: (orderData) => {
        const newOrder: Order = {
          ...orderData,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          timeRemaining: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        };

        set((state) => ({
          orders: [newOrder, ...state.orders],
        }));

        // Send new order webhook notification
        sendWebhookNotification('new', newOrder);
      },

      updateOrder: (order) => {
        set((state) => {
          const oldOrder = state.orders.find(o => o.id === order.id);
          const wasNotCompleted = oldOrder && oldOrder.timeRemaining > 0 && oldOrder.status !== 'Completed';
          const isNowCompleted = order.timeRemaining <= 0 || order.status === 'Completed';
          
          // If the order just became completed, send webhook notification
          if (wasNotCompleted && isNowCompleted) {
            sendWebhookNotification('ready', order);
          }

          return {
            orders: state.orders.map((o) => (o.id === order.id ? order : o)),
          };
        });
      },
    }),
    {
      name: 'order-manager-storage',
    }
  )
);