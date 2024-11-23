export interface User {
  id: number;
  username: string;
  avatar?: string;
  weather_adcode?: string;
  weather_key?: string;
  container_config?: {
    showWeather: boolean;
    showHotSearch: boolean;
    showBookmark: boolean;
    showDateTime: boolean;
  };
}

export interface LoginForm {
  username: string;
  password: string;
}

export interface UserUpdateForm {
  avatar?: string;
  weather_adcode?: string;
  weather_key?: string;
  container_config?: {
    showWeather: boolean;
    showHotSearch: boolean;
    showBookmark: boolean;
  };
} 