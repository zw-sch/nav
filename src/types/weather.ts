export interface WeatherConfig {
  adcode: string
  key: string
}

export interface WeatherInfo {
  province: string
  city: string
  weather: string
  temperature: string
  winddirection: string
  windpower: string
  humidity: string
  reporttime: string
}

export interface WeatherResponse {
  status: string
  info: string
  infocode: string
  lives: WeatherInfo[]
}
