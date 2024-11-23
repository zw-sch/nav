export interface Category {
  id: number;
  name: string;
  icon?: string;
  user_id?: number;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ExtendedCategory extends Category {
  icon: string;
  sortOrder: number;
}

export interface Bookmark {
  id: number;
  name: string;
  categoryId: number;
  icon?: string;
  remark?: string;
  internalUrl?: string;
  externalUrl?: string;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ExtendedBookmark extends Bookmark {
  categoryName: string;
  sortOrder: number;
}

export interface BookmarkState {
  categories: Category[];
  bookmarks: Bookmark[];
}
