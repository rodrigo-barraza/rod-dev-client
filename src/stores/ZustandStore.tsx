import { create } from "zustand";

interface RodrigoState {
  isRenderApiAvailable: boolean;
  setIsRenderApiAvailable: (renderApi: boolean) => void;
}

export const useApplicationState = create<RodrigoState>((set) => ({
  isRenderApiAvailable: false,
  setIsRenderApiAvailable: (isRenderApiAvailable: boolean) =>
    set({ isRenderApiAvailable }),
}));
