import { create } from "zustand";

interface RodrigoState {
  isRenderApiAvailable: boolean;
  setIsRenderApiAvailable: (renderApi: boolean) => void;
  /** Null until the adapter probe answers — "not asked yet" and "asked, no
   * GPU" are different states, and a badge that shows the second while the
   * first is true reads as a hardware problem. */
  isWebGpuSupported: boolean | null;
  setIsWebGpuSupported: (isWebGpuSupported: boolean) => void;
}

export const useApplicationState = create<RodrigoState>((set) => ({
  isRenderApiAvailable: false,
  setIsRenderApiAvailable: (isRenderApiAvailable: boolean) =>
    set({ isRenderApiAvailable }),
  isWebGpuSupported: null,
  setIsWebGpuSupported: (isWebGpuSupported: boolean) =>
    set({ isWebGpuSupported }),
}));
