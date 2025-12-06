import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Hotel {
  id: string;
  name: string;
  city: string;
  contact: string;
  category: string;
  createdAt: string;
}

export interface ModuleProgress {
  hotelId: string;
  moduleId: number;
  checklist: Record<string, boolean>;
  answers: Record<string, string>;
  clientSummary: string;
  attachments: string[];
  completed: boolean;
  lastUpdated: string;
}

export interface User {
  email: string;
  name: string;
}

interface AppState {
  user: User | null;
  hotels: Hotel[];
  moduleProgress: ModuleProgress[];
  
  // Auth actions
  login: (email: string, password: string) => boolean;
  logout: () => void;
  
  // Hotel actions
  addHotel: (hotel: Omit<Hotel, 'id' | 'createdAt'>) => void;
  updateHotel: (id: string, hotel: Partial<Hotel>) => void;
  deleteHotel: (id: string) => void;
  getHotel: (id: string) => Hotel | undefined;
  
  // Progress actions
  getProgress: (hotelId: string, moduleId: number) => ModuleProgress | undefined;
  updateProgress: (hotelId: string, moduleId: number, data: Partial<Omit<ModuleProgress, 'hotelId' | 'moduleId'>>) => void;
  getHotelProgress: (hotelId: string) => number;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      hotels: [],
      moduleProgress: [],
      
      login: (email: string, password: string) => {
        // Simple demo login - in production, use proper auth
        if (email && password.length >= 6) {
          set({ user: { email, name: email.split('@')[0] } });
          return true;
        }
        return false;
      },
      
      logout: () => {
        set({ user: null });
      },
      
      addHotel: (hotel) => {
        const newHotel: Hotel = {
          ...hotel,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ hotels: [...state.hotels, newHotel] }));
      },
      
      updateHotel: (id, hotel) => {
        set((state) => ({
          hotels: state.hotels.map((h) =>
            h.id === id ? { ...h, ...hotel } : h
          ),
        }));
      },
      
      deleteHotel: (id) => {
        set((state) => ({
          hotels: state.hotels.filter((h) => h.id !== id),
          moduleProgress: state.moduleProgress.filter((p) => p.hotelId !== id),
        }));
      },
      
      getHotel: (id) => {
        return get().hotels.find((h) => h.id === id);
      },
      
      getProgress: (hotelId, moduleId) => {
        return get().moduleProgress.find(
          (p) => p.hotelId === hotelId && p.moduleId === moduleId
        );
      },
      
      updateProgress: (hotelId, moduleId, data) => {
        set((state) => {
          const existingIndex = state.moduleProgress.findIndex(
            (p) => p.hotelId === hotelId && p.moduleId === moduleId
          );
          
          const newProgress: ModuleProgress = {
            hotelId,
            moduleId,
            checklist: {},
            answers: {},
            clientSummary: '',
            attachments: [],
            completed: false,
            lastUpdated: new Date().toISOString(),
            ...(existingIndex >= 0 ? state.moduleProgress[existingIndex] : {}),
            ...data,
          };
          
          if (existingIndex >= 0) {
            const updated = [...state.moduleProgress];
            updated[existingIndex] = newProgress;
            return { moduleProgress: updated };
          }
          
          return { moduleProgress: [...state.moduleProgress, newProgress] };
        });
      },
      
      getHotelProgress: (hotelId) => {
        const progress = get().moduleProgress.filter(
          (p) => p.hotelId === hotelId && p.completed
        );
        return Math.round((progress.length / 11) * 100);
      },
    }),
    {
      name: 'reprotel-hub-storage',
    }
  )
);
