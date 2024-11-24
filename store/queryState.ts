import { create } from "zustand";

interface MapBounds {
  lat: string;
  lng: string;
}

interface FilterState {
  price: { min: string };
  beds: { min: string };
  buildYear: { min: string; max: string };
  lotSize: { min: string };
  sqftMin: { min: string };
}

interface QueryState {
  mapBounds: MapBounds;
  filterState: FilterState;
  searchedTerm: string;
  listingType: string;
  searchMode: string; // 'address' or 'location'
  updateQuery: (key: string, value: any) => void;
  getQueryString: () => string;
}

const initialState: Omit<QueryState, "updateQuery" | "getQueryString"> = {
  mapBounds: {
    lat: "45.672362679211",
    lng: "-122.5991175112",
  },
  filterState: {
    price: { min: "" }, // No minimum price filter by default
    beds: { min: "" }, // No minimum bedroom filter by default
    buildYear: { min: "", max: "" }, // No year built filter by default
    lotSize: { min: "" }, // No lot size filter by default
    sqftMin: { min: "" }, // No square feet filter by default
  },
  listingType: "",
  searchedTerm: "", // No default search term
  searchMode: "location", // Default search mode
};

export const useQueryState = create<QueryState>((set, get) => ({
  ...initialState,

  updateQuery: (key: string, value: any) => {
    const keys = key.split(".");
    if (keys.length === 1) {
      set({ [keys[0]]: value } as any);
    } else {
      set((state) => {
        const updatedState = { ...state };
        let obj: any = updatedState;
        for (let i = 0; i < keys.length - 1; i++) {
          obj[keys[i]] = { ...obj[keys[i]] };
          obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
        return updatedState;
      });
    }
  },

  getQueryString: () => {
    const { updateQuery, ...state } = get();
    return encodeURIComponent(JSON.stringify(state));
  },
}));
