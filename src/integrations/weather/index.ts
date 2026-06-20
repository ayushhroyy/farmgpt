// Weather data using Open-Meteo API
export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  rainfall_mm: number;
  error?: string;
}

export interface RainfallForecast {
  daily: { date: string; rainfall_mm: number }[];
  total: number;
  error?: string;
}

// Weather condition codes mapping from Open-Meteo
function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: "Clear",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Foggy",
    51: "Light Drizzle",
    53: "Drizzle",
    55: "Heavy Drizzle",
    56: "Freezing Drizzle",
    57: "Freezing Drizzle",
    61: "Light Rain",
    63: "Moderate Rain",
    65: "Heavy Rain",
    66: "Freezing Rain",
    67: "Freezing Rain",
    71: "Light Snow",
    73: "Moderate Snow",
    75: "Heavy Snow",
    77: "Snow Grains",
    80: "Light Showers",
    81: "Moderate Showers",
    82: "Violent Showers",
    85: "Light Snow Showers",
    86: "Heavy Snow Showers",
    95: "Thunderstorm",
    96: "Thunderstorm",
    99: "Severe Thunderstorm",
  };
  return conditions[code] || "Unknown";
}

// Get location name from coordinates (reverse geocoding)
async function getLocationName(
  latitude: number,
  longitude: number,
): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "FarmGPT-App/1.0",
        },
      },
    );
    const data = await response.json();
    return (
      data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
    );
  } catch (error) {
    console.error("Error getting location name:", error);
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
}

// Fallback weather data function
function getFallbackWeatherData(location: string): WeatherData {
  console.log("Using fallback weather data for:", location);

  // Generate realistic-looking data based on location name
  const isHotLocation =
    location.toLowerCase().includes("rajasthan") ||
    location.toLowerCase().includes("gujarat") ||
    location.toLowerCase().includes("tamil") ||
    location.toLowerCase().includes("andhra");

  const isColdLocation =
    location.toLowerCase().includes("kashmir") ||
    location.toLowerCase().includes("himachal") ||
    location.toLowerCase().includes("uttarakhand");

  let temp, condition, humidity;

  if (isHotLocation) {
    temp = 28 + Math.floor(Math.random() * 12); // 28-40°C
    condition = Math.random() > 0.6 ? "Sunny" : "Partly Cloudy";
    humidity = 20 + Math.floor(Math.random() * 30); // 20-50%
  } else if (isColdLocation) {
    temp = 10 + Math.floor(Math.random() * 15); // 10-25°C
    condition = Math.random() > 0.5 ? "Cloudy" : "Clear";
    humidity = 40 + Math.floor(Math.random() * 30); // 40-70%
  } else {
    temp = 20 + Math.floor(Math.random() * 15); // 20-35°C
    condition = Math.random() > 0.7 ? "Partly Cloudy" : "Clear";
    humidity = 50 + Math.floor(Math.random() * 30); // 50-80%
  }

  const rainfall = Math.random() > 0.8 ? Math.floor(Math.random() * 8) : 0; // 20% chance of rain

  return {
    location: location,
    temperature: temp,
    condition: condition,
    humidity: humidity,
    rainfall_mm: rainfall,
    error: "Using estimated weather data",
  };
}

export async function getWeatherData(location: string): Promise<WeatherData> {
  try {
    console.log("Fetching weather data for:", location);

    // Parse location string - it could be coordinates or city name
    let latitude: number;
    let longitude: number;
    let locationName: string;

    if (location.includes(",")) {
      // Coordinates format: "lat,lng"
      const [lat, lng] = location
        .split(",")
        .map((coord) => parseFloat(coord.trim()));
      latitude = lat;
      longitude = lng;

      // Don't block on location name lookup
      locationName = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
      // Try to get proper name in background
      getLocationName(latitude, longitude)
        .then((name) => {
          console.log("Got location name:", name);
        })
        .catch((err) => {
          console.log("Could not get location name:", err);
        });
    } else {
      // Try geocoding with timeout
      const geoController = new AbortController();
      const geoTimeout = setTimeout(() => geoController.abort(), 5000); // 5 second timeout

      try {
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
          {
            headers: {
              "User-Agent": "FarmGPT-App/1.0",
            },
            signal: geoController.signal,
          },
        );

        clearTimeout(geoTimeout);
        const geoData = await geoResponse.json();

        if (geoData.length === 0) {
          console.log("Location not found, using fallback");
          return getFallbackWeatherData(location);
        }

        latitude = parseFloat(geoData[0].lat);
        longitude = parseFloat(geoData[0].lon);
        locationName = geoData[0].display_name || location;
        console.log("Geocoded to:", latitude, longitude);
      } catch (geoError) {
        console.log("Geocoding failed:", geoError);
        clearTimeout(geoTimeout);
        return getFallbackWeatherData(location);
      }
    }

    // Try Open-Meteo API with timeout
    const weatherController = new AbortController();
    const weatherTimeout = setTimeout(() => weatherController.abort(), 8000); // 8 second timeout

    try {
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relativehumidity_2m,weathercode&daily=rain_sum&timezone=auto`,
        {
          signal: weatherController.signal,
        },
      );

      clearTimeout(weatherTimeout);

      if (!weatherResponse.ok) {
        throw new Error(`Weather API error: ${weatherResponse.status}`);
      }

      const weatherData = await weatherResponse.json();
      console.log("Weather API response:", weatherData);

      // Extract current weather data
      const current = weatherData.current;
      const daily = weatherData.daily;

      return {
        location: locationName,
        temperature: Math.round(current.temperature_2m),
        condition: getWeatherCondition(current.weathercode),
        humidity: current.relativehumidity_2m,
        rainfall_mm: daily.rain_sum[0] || 0,
      };
    } catch (weatherError) {
      console.log("Weather API failed:", weatherError);
      clearTimeout(weatherTimeout);
      return getFallbackWeatherData(locationName);
    }
  } catch (error) {
    console.error("Complete weather fetch failure:", error);
    return getFallbackWeatherData(location);
  }
}

// Fallback rainfall forecast function
function getFallbackRainfallForecast(location: string): RainfallForecast {
  console.log("Using fallback rainfall forecast for:", location);

  // Generate 7 days of forecast data starting from today
  const forecast = [];
  const today = new Date();

  // Check if it's monsoon season (June-September) for Indian locations
  const isMonsoonSeason =
    location.toLowerCase().includes("india") &&
    today.getMonth() >= 5 &&
    today.getMonth() <= 8;

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    let rainfall = 0;

    if (isMonsoonSeason) {
      // Higher chance of rain during monsoon
      if (Math.random() > 0.3) {
        rainfall = Math.floor(Math.random() * 20); // 0-20mm
      }
    } else {
      // Lower chance of rain during other seasons
      if (Math.random() > 0.8) {
        rainfall = Math.floor(Math.random() * 8); // 0-8mm
      }
    }

    forecast.push({
      date: date.toISOString().split("T")[0],
      rainfall_mm: rainfall,
    });
  }

  const total = forecast.reduce((sum, day) => sum + day.rainfall_mm, 0);

  return {
    daily: forecast,
    total,
    error: "Using estimated rainfall data",
  };
}

export async function getRainfallForecast(
  location: string,
): Promise<RainfallForecast> {
  try {
    console.log("Fetching rainfall forecast for:", location);

    // Parse location string - it could be coordinates or city name
    let latitude: number;
    let longitude: number;

    if (location.includes(",")) {
      // Coordinates format: "lat,lng"
      const [lat, lng] = location
        .split(",")
        .map((coord) => parseFloat(coord.trim()));
      latitude = lat;
      longitude = lng;
    } else {
      // Try geocoding with timeout
      const geoController = new AbortController();
      const geoTimeout = setTimeout(() => geoController.abort(), 5000); // 5 second timeout

      try {
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
          {
            headers: {
              "User-Agent": "FarmGPT-App/1.0",
            },
            signal: geoController.signal,
          },
        );

        clearTimeout(geoTimeout);
        const geoData = await geoResponse.json();

        if (geoData.length === 0) {
          console.log("Location not found for forecast, using fallback");
          return getFallbackRainfallForecast(location);
        }

        latitude = parseFloat(geoData[0].lat);
        longitude = parseFloat(geoData[0].lon);
        console.log("Forecast geocoded to:", latitude, longitude);
      } catch (geoError) {
        console.log("Forecast geocoding failed:", geoError);
        clearTimeout(geoTimeout);
        return getFallbackRainfallForecast(location);
      }
    }

    // Try Open-Meteo API with timeout
    const forecastController = new AbortController();
    const forecastTimeout = setTimeout(() => forecastController.abort(), 8000); // 8 second timeout

    try {
      const forecastResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=rain_sum&timezone=auto&forecast_days=7`,
        {
          signal: forecastController.signal,
        },
      );

      clearTimeout(forecastTimeout);

      if (!forecastResponse.ok) {
        throw new Error(`Forecast API error: ${forecastResponse.status}`);
      }

      const forecastData = await forecastResponse.json();
      console.log("Forecast API response:", forecastData);
      const daily = forecastData.daily;

      const forecast = daily.time.map((date: string, index: number) => ({
        date,
        rainfall_mm: daily.rain_sum[index] || 0,
      }));

      const total = forecast.reduce(
        (sum: number, day: { rainfall_mm: number }) => sum + day.rainfall_mm,
        0,
      );

      return {
        daily: forecast,
        total,
      };
    } catch (forecastError) {
      console.log("Forecast API failed:", forecastError);
      clearTimeout(forecastTimeout);
      return getFallbackRainfallForecast(location);
    }
  } catch (error) {
    console.error("Complete forecast fetch failure:", error);
    return getFallbackRainfallForecast(location);
  }
}
