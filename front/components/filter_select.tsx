// FilterSelect.tsx
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { FilterOption,FilterSelectProps } from "@/types/general";

export default function FilterSelect({ title, filterKey, value, options, onChange }: FilterSelectProps) {
  return (
    <div className="flex flex-col items-center">
      <h3 className="font-light">{title}</h3>
      <Select value={value?.toString() || "all"} onValueChange={(val) => onChange(filterKey, val)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={title} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
