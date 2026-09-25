async function getWeatherData(latitude, longitude, locationName) {
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.append('latitude', latitude);
    url.searchParams.append('longitude', longitude);
    url.searchParams.append('current', 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation');
    url.searchParams.append('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum');
    url.searchParams.append('timezone', 'auto');
    url.searchParams.append('forecast_days', '7');

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.current) {
      return {
        location: locationName,
        current: {
          temperature: data.current.temperature_2m,
          humidity: data.current.relative_humidity_2m,
          windSpeed: data.current.wind_speed_10m,
          precipitation: data.current.precipitation,
          weatherCondition: getWeatherDescription(data.current.weather_code),
          weatherCode: data.current.weather_code
        },
        forecast: data.daily ? data.daily.time.map((date, index) => ({
          date,
          maxTemperature: data.daily.temperature_2m_max[index],
          minTemperature: data.daily.temperature_2m_min[index],
          weatherCondition: getWeatherDescription(data.daily.weather_code[index]),
          precipitation: data.daily.precipitation_sum[index],
          weatherCode: data.daily.weather_code[index]
        })) : [],
        timezone: data.timezone
      };
    }

    return { error: 'Unable to fetch weather data' };
  } catch (error) {
    console.error('Weather API error:', error);
    return { error: 'Failed to fetch weather data' };
  }
}

function getWeatherDescription(code) {
  const weatherCodes = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Foggy with rime',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Thunderstorm with large hail'
  };

  return weatherCodes[code] || 'Unknown';
}

function getWeatherForLocation(locationName = 'goa') {
  const locationCoordinates = {
    goa: { lat: 15.3, lon: 73.8, name: 'Goa' },
    'north goa': { lat: 15.55, lon: 73.75, name: 'North Goa' },
    'south goa': { lat: 14.88, lon: 73.98, name: 'South Goa' },
    panaji: { lat: 15.498, lon: 73.828, name: 'Panaji' },
    calangute: { lat: 15.63, lon: 73.75, name: 'Calangute' },
    baga: { lat: 15.64, lon: 73.73, name: 'Baga' },
    arambol: { lat: 15.73, lon: 73.7, name: 'Arambol' },
    palolem: { lat: 14.63, lon: 73.99, name: 'Palolem' }
  };

  const normalizedLocation = String(locationName || 'goa').trim().toLowerCase();
  const location = locationCoordinates[normalizedLocation] || locationCoordinates.goa;

  return getWeatherData(location.lat, location.lon, location.name);
}

module.exports = {
  getWeatherData,
  getWeatherDescription,
  getWeatherForLocation
};
