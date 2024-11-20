import * as React from "react";
import { RiArrowDropDownLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DropdownProps {
  title: string;
  items: { id: string; label: string }[];
  onChange: (value: string) => void;
  value: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  title,
  items,
  onChange,
  value,
}) => {
  return (
    <div className="flex flex-col">
      <label className="text-xs text-gray-600 mb-1 font-medium">{title}</label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="font-normal h-9 bg-white border-gray-300 hover:bg-gray-50 text-sm min-w-[120px] justify-between">
            <span className="truncate">
              {items.find((item) => item.id === value)?.label || "Select..."}
            </span>
            <RiArrowDropDownLine className="ml-1 text-lg flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>{title}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(value) => onChange(value)}
          >
            {items?.map((item: { id: string; label: string }) => (
              <DropdownMenuRadioItem
                key={item.id}
                value={item.id}
                onClick={() => onChange(item.id)}
              >
                {item.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
