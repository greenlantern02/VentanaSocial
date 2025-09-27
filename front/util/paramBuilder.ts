import { Filters } from "@/types/general";

export default function buildParams({page, limit, filters}:{page: number, limit: number, filters: Filters}){
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  Object.entries(filters).forEach(([k, v]) => v && v !== "all" && params.append(k, String(v)));
  return params;
};
