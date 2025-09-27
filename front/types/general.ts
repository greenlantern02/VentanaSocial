
export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterSelectProps {
  title: string;
  filterKey: string;
  value: string;
  options: FilterOption[];
  onChange: (key: (keyof Filters) | string, value: string) => void; // Change key type
  }

export interface FilterDefinition{
    key: keyof Filters;
  title: string;
  options: FilterOption[];
}

export interface WindowData {
  _id: string;
  hash: string;
  isDuplicate: boolean;
  imageUrl: string;
  createdAt: number;
  description?: string;
  structured_data: {
    daytime?: string;
    location?: string;
    type?: string;
    material?: string;
    panes?: string;
    covering?: string;
    openState?: string;
  };
}

export interface PaginatedResponse {
  data: WindowData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Filters {
  daytime?: string;
  location?: string;
  type?: string;
  material?: string;
  panes?: string;
  covering?: string;
  openState?: string;
  isDuplicate?: boolean;
  search?: string;
}

export interface UploadResult {
  _id: string;
  hash: string;
  isDuplicate: boolean;
  createdAt: number;
  imageUrl: string;
  description?: string;
  structured_data: StructuredData;
}

interface StructuredData {
  daytime?: string;
  location?: string;
  type?: string;
  material?: string;
  panes?: string;
  covering?: string;
  openState?: string;
}