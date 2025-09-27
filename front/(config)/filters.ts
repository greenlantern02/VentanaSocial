import { FilterDefinition } from "@/types/general";

export const filterConfig: FilterDefinition[] = [
  {
    key: "daytime",
    title: "Daytime",
    options: [
      { label: "All", value: "all" },
      { label: "Day", value: "day" },
      { label: "Night", value: "night" },
      { label: "Unknown", value: "unknown" },
    ],
  },
  {
    key: "location",
    title: "Location",
    options: [
      { label: "All", value: "all" },
      { label: "Interior", value: "interior" },
      { label: "Exterior", value: "exterior" },
      { label: "Unknown", value: "unknown" },
    ],
  },
  {
    key: "type",
    title: "Window Type",
    options: [
      { label: "All", value: "all" },
      { label: "Fixed", value: "fixed" },
      { label: "Sliding", value: "sliding" },
      { label: "Casement", value: "casement" },
      { label: "Awning", value: "awning" },
      { label: "Hung", value: "hung" },
      { label: "Pivot", value: "pivot" },
      { label: "Unknown", value: "unknown" },
    ],
  },
  {
    key: "material",
    title: "Material",
    options: [
      { label: "All", value: "all" },
      { label: "Wood", value: "wood" },
      { label: "Aluminum", value: "aluminum" },
      { label: "PVC", value: "pvc" },
      { label: "Unknown", value: "unknown" },
    ],
  },
];