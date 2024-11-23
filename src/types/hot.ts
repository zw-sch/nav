export interface HotItem {
  id?: string;
  title: string;
  desc?: string;
  url: string;
  mobileUrl?: string;
  hot?: number;
  timestamp?: number;
  author?: string;
  cover?: string;
}

export interface HotResponse {
  code: number;
  message: string;
  name: string;
  title: string;
  subtitle: string;
  from: string;
  total: number;
  updateTime: string;
  data: HotItem[];
}

export interface HotSource {
  id: number;
  name: string;
  icon: string;
  url: string;
  type?: string;
  sort_order?: number;
  enablePreview?: boolean;
}
