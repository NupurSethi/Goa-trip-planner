const destinations = require('../data/goa-destinations');
const hotels = require('../data/goa-hotels');
const activities = require('../data/goa-activities');
const localTransport = require('../data/goa-local-transport');
const delhiGoaTransport = require('../data/delhi-goa-transport');
const { getWeatherForLocation } = require('./weather');

const tools = [
  {
    type: 'function',
    function: {
      name: 'searchDestinations',
      description: 'Search for tourist destinations in Goa by type or keyword',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Type of destination: Beach, Historical Site, Natural Wonder, Agritourism'
          },
          keyword: {
            type: 'string',
            description: 'Keyword to search (e.g., water sports, trekking)'
          }
        },
        required: ['type']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'searchHotels',
      description: 'Search for hotels based on location, budget, and rating',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'Hotel location: North Goa, South Goa, Panaji'
          },
          maxPrice: {
            type: 'number',
            description: 'Maximum price per night in INR'
          },
          minRating: {
            type: 'number',
            description: 'Minimum star rating (1-5)'
          }
        },
        required: ['location']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'searchActivities',
      description: 'Search for activities and experiences in Goa',
      parameters: {
        type: 'object',
        properties: {
          difficulty: {
            type: 'string',
            description: 'Activity difficulty: Easy, Moderate, Hard'
          },
          maxPrice: {
            type: 'number',
            description: 'Maximum price in INR'
          },
          ageGroup: {
            type: 'string',
            description: 'Age group: All ages, 12+, 18+'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'searchLocalTransport',
      description: 'Search for local transportation options within Goa',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Transport type: Bike, Car, Auto Rickshaw, Taxi'
          },
          maxBudget: {
            type: 'number',
            description: 'Maximum budget in INR'
          },
          seatingCapacity: {
            type: 'number',
            description: 'Minimum seating capacity needed'
          },
          priceRange: {
            type: 'string',
            description: 'Price range: Very Budget, Budget, Mid-range, Premium'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'searchDelhiToGoaTransport',
      description: 'Search for transportation options from Delhi to Goa',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Transport type: Flight, Train, Bus, Self-Drive'
          },
          maxBudget: {
            type: 'number',
            description: 'Maximum budget in INR per ticket'
          },
          comfortLevel: {
            type: 'string',
            description: 'Comfort preference: Low, Medium, High, Very High'
          },
          travelTime: {
            type: 'string',
            description: 'Preferred travel time: Day, Night, Any'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getWeather',
      description: 'Get current weather and 7-day forecast for Goa or specific locations',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'Location name: Goa (default), North Goa, South Goa, Panaji, Calangute, Baga, Arambol, Palolem'
          }
        }
      }
    }
  }
];

async function processToolCall(toolName, toolData = {}) {
  switch (toolName) {
    case 'searchDestinations': {
      return destinations.filter((d) => {
        const typeMatch = !toolData.type || d.type.toLowerCase().includes(toolData.type.toLowerCase());
        const keywordMatch = !toolData.keyword || d.highlights.some((h) => h.toLowerCase().includes(toolData.keyword.toLowerCase()));
        return typeMatch || keywordMatch;
      });
    }

    case 'searchHotels': {
      return hotels.filter((h) => {
        const locationMatch = !toolData.location || h.location.toLowerCase().includes(toolData.location.toLowerCase());
        const priceMatch = !toolData.maxPrice || h.pricePerNight <= toolData.maxPrice;
        const ratingMatch = !toolData.minRating || h.rating >= toolData.minRating;
        return locationMatch && priceMatch && ratingMatch;
      });
    }

    case 'searchActivities': {
      return activities.filter((a) => {
        const difficultyMatch = !toolData.difficulty || a.difficulty === toolData.difficulty;
        const priceMatch = !toolData.maxPrice || a.price <= toolData.maxPrice;
        const ageMatch = !toolData.ageGroup || a.ageGroup.includes(toolData.ageGroup);
        return difficultyMatch && priceMatch && ageMatch;
      });
    }

    case 'searchLocalTransport': {
      return localTransport.filter((t) => {
        const typeMatch = !toolData.type || t.type.toLowerCase().includes(toolData.type.toLowerCase());
        const budgetMatch = !toolData.maxBudget || ((t.costPerDay && t.costPerDay <= toolData.maxBudget) || (t.costPerKm && t.costPerKm * 100 <= toolData.maxBudget));
        const seatingMatch = !toolData.seatingCapacity || t.seating >= toolData.seatingCapacity;
        const priceRangeMatch = !toolData.priceRange || t.priceRange === toolData.priceRange;
        return typeMatch && budgetMatch && seatingMatch && priceRangeMatch;
      });
    }

    case 'searchDelhiToGoaTransport': {
      return delhiGoaTransport.filter((t) => {
        const typeMatch = !toolData.type || t.type.toLowerCase().includes(toolData.type.toLowerCase());

        let priceMatch = true;
        if (toolData.maxBudget) {
          if (t.type === 'Flight') {
            priceMatch = t.economyPrice <= toolData.maxBudget;
          } else if (t.type === 'Train') {
            priceMatch = (t.sleeper && t.sleeper <= toolData.maxBudget) || (t.chair && t.chair <= toolData.maxBudget) || (t.ac3Tier && t.ac3Tier <= toolData.maxBudget);
          } else if (t.type === 'Bus') {
            priceMatch = t.seat <= toolData.maxBudget;
          } else if (t.type === 'Self-Drive') {
            priceMatch = t.estimatedTotal <= toolData.maxBudget;
          }
        }

        const comfortMatch = !toolData.comfortLevel || t.comfort === toolData.comfortLevel || (typeof t.comfort === 'string' && t.comfort.toLowerCase().includes(toolData.comfortLevel.toLowerCase()));
        const travelTimeMatch = !toolData.travelTime || toolData.travelTime === 'Any' ||
          (toolData.travelTime === 'Day' && (!t.departureTime || t.departureTime < '18:00' || t.type === 'Flight')) ||
          (toolData.travelTime === 'Night' && t.departureTime && t.departureTime >= '18:00');

        return typeMatch && priceMatch && comfortMatch && travelTimeMatch;
      });
    }

    case 'getWeather': {
      return getWeatherForLocation(toolData.location);
    }

    default:
      return [];
  }
}

module.exports = { tools, processToolCall };
