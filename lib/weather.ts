import { WeatherData } from '@/types'

// Re-export WeatherData for convenience
export type { WeatherData }

// Mock weather data for now - in production you'd use OpenWeatherMap API
export const getWeatherForecast = async (date: Date): Promise<WeatherData | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))

  // Generate mock weather data based on date
  const dateStr = date.toISOString().split('T')[0]
  const day = date.getDate()
  
  // Simple mock logic to generate "realistic" weather
  const weatherOptions = [
    { description: 'Slunečno', icon: '☀️', temp: 22, humidity: 45, wind: 5 },
    { description: 'Polojasno', icon: '⛅', temp: 18, humidity: 55, wind: 8 },
    { description: 'Zataženo', icon: '☁️', temp: 15, humidity: 65, wind: 12 },
    { description: 'Déšť', icon: '🌧️', temp: 12, humidity: 85, wind: 15 },
    { description: 'Bouřka', icon: '⛈️', temp: 16, humidity: 90, wind: 20 }
  ]

  // Use day number to simulate different weather patterns
  const weatherIndex = (day + Math.floor(Math.random() * 3)) % weatherOptions.length
  const weather = weatherOptions[weatherIndex]

  return {
    date: dateStr,
    temperature: weather.temp + Math.floor(Math.random() * 10) - 5, // ±5°C variation
    description: weather.description,
    icon: weather.icon,
    humidity: weather.humidity + Math.floor(Math.random() * 20) - 10, // ±10% variation
    windSpeed: weather.wind + Math.floor(Math.random() * 10) - 5 // ±5 km/h variation
  }
}

// Synchronous version for immediate use in summary
export const getWeatherForDate = (date: Date): WeatherData => {
  const dateStr = date.toISOString().split('T')[0]
  const day = date.getDate()
  
  // Simple mock logic to generate "realistic" weather
  const weatherOptions = [
    { description: 'Slunečno', icon: '☀️', temp: 22, humidity: 45, wind: 5 },
    { description: 'Polojasno', icon: '⛅', temp: 18, humidity: 55, wind: 8 },
    { description: 'Zataženo', icon: '☁️', temp: 15, humidity: 65, wind: 12 },
    { description: 'Déšť', icon: '🌧️', temp: 12, humidity: 85, wind: 15 },
    { description: 'Bouřka', icon: '⛈️', temp: 16, humidity: 90, wind: 20 }
  ]

  // Use day number to simulate different weather patterns
  const weatherIndex = (day + Math.floor(Math.random() * 3)) % weatherOptions.length
  const weather = weatherOptions[weatherIndex]

  return {
    date: dateStr,
    temperature: weather.temp + Math.floor(Math.random() * 10) - 5, // ±5°C variation
    description: weather.description,
    icon: weather.icon,
    humidity: weather.humidity + Math.floor(Math.random() * 20) - 10, // ±10% variation
    windSpeed: weather.wind + Math.floor(Math.random() * 10) - 5 // ±5 km/h variation
  }
}

export const getWeatherRecommendation = (weather: WeatherData): { 
  rating: 'excellent' | 'good' | 'fair' | 'poor', 
  message: string,
  color: string
} => {
  const { temperature, description, windSpeed } = weather

  if (description.includes('Bouřka') || description.includes('Déšť')) {
    return {
      rating: 'poor',
      message: 'Nepříznivé počasí pro rybaření',
      color: 'text-red-600 bg-red-50'
    }
  }

  if (temperature < 5 || temperature > 30 || windSpeed > 25) {
    return {
      rating: 'fair',
      message: 'Mírně náročné podmínky',
      color: 'text-orange-600 bg-orange-50'
    }
  }

  if (description.includes('Slunečno') && temperature >= 15 && temperature <= 25 && windSpeed < 15) {
    return {
      rating: 'excellent',
      message: 'Perfektní podmínky pro rybaření!',
      color: 'text-green-600 bg-green-50'
    }
  }

  return {
    rating: 'good',
    message: 'Dobré podmínky pro rybaření',
    color: 'text-blue-600 bg-blue-50'
  }
} 