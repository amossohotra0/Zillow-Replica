import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "./ui/checkbox";
import { MdOutlineTune } from "react-icons/md";
import { useFilterStore } from "@/store/filterStates";

const items = [
  { id: "Distance", label: "Distance" },
  { id: "Bedrooms", label: "Bedrooms" },
  { id: "Price", label: "Price (Listed/Sold)" },
  { id: "LivingArea", label: "Square Footage" },
  { id: "Status", label: "Status (On Sale/Sold)" },
  // { id: "YearBuilt", label: "Year Built" },
  { id: "Bathrooms", label: "Bathrooms" },
  { id: "Address", label: "Address" },
] as const;

export const FilterComponent = () => {
  const { toggleSelection, selectedState } = useFilterStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="font-normal h-9 bg-white border-gray-300 hover:bg-gray-50">
          <MdOutlineTune className="text-lg mr-1" />
          <span className="text-sm">Columns</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Customize Columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item: { id: string; label: string }) => {
          const isChecked = selectedState.includes(item.id);
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 w-full px-2 py-1 cursor-pointer"
              onClick={() => toggleSelection(item.id, !isChecked)}
            >
              <Checkbox checked={isChecked} />
              <span className="text-md">{item.label}</span>
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
