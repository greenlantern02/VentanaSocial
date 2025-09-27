// actions/getWindows.ts
import { Filters, PaginatedResponse } from "@/types/general";
import buildParams from "@/util/paramBuilder";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getWindows({page, limit, filters}:{page: number, limit: number, filters: Filters}): Promise<PaginatedResponse> {
  try {
    const res = await fetch(`${API_URL}/api/windows?${buildParams({ page, limit, filters })}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Server error (${res.status})`);

    const result: PaginatedResponse = await res.json();
    return result;
  } catch (err) {
    console.error("getWindows error:", err);
    throw err;
  }
}
