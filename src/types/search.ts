export interface SearchEngine {
  id: number
  name: string
  url?: string
  searchUrl: string
  icon?: string
  sortOrder?: number
  quickCommand?: string
  user_id?: number
  created_at?: string
  updated_at?: string
}

export interface SearchState {
  engines: SearchEngine[]
  currentEngine: SearchEngine
  searchText: string
  isDarkMode: boolean
}

export type CreateEngineParams = Omit<
  SearchEngine,
  'id' | 'user_id' | 'created_at' | 'updated_at'
> & {
  url?: string
  sortOrder?: number
  quickCommand?: string
}

export type UpdateEngineParams = Partial<CreateEngineParams>
