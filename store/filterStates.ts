import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FilterState {
  selectedState: string[];
  toggleSelection: (id: string, checked: boolean) => void;
  isSelected: (id: string) => boolean;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      selectedState: [
        "Address",
        "Bedrooms",
        "Price",
        "LivingArea",
        "Bathrooms",
        "Status",
        "Distance",
      ],

      toggleSelection: (id, checked) => {
        set((state) => ({
          selectedState: checked
            ? [...state.selectedState, id]
            : state.selectedState.filter((field) => field !== id),
        }));
      },

      isSelected: (id) => get().selectedState.includes(id),
    }),
    {
      name: "filter-storage",
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) =>
          sessionStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => sessionStorage.removeItem(name),
      },
    }
  )
);
