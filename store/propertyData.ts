import { create } from "zustand";

interface PropertyData {
  propertyData: any;
  hoveredPropertyId: string | null;
  selectedPropertyId: string | null;
  setPropertyData: (data: any) => void;
  setHoveredPropertyId: (id: string | null) => void;
  setSelectedPropertyId: (id: string | null) => void;
}

export const usePropertyData = create<PropertyData>((set, get) => ({
  propertyData: { nearbyHomes: [] },
  hoveredPropertyId: null,
  selectedPropertyId: null,
  setPropertyData: (data) => set({ propertyData: data }),
  setHoveredPropertyId: (id) => set({ hoveredPropertyId: id }),
  setSelectedPropertyId: (id) => set({ selectedPropertyId: id }),
}));
