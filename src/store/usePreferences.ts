import { create } from "zustand";

interface PreferenceStore {
    interests: string[];
    setInterests: (items: string[]) => void;
}

export const usePreferences = create<PreferenceStore>((set) => ({
    interests: [],
    setInterests: (items) => set({ interests: items }),
}));