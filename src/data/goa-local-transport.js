const localTransport = [
  {
    id: 1,
    type: 'Bike',
    model: 'Royal Enfield 350',
    costPerDay: 800,
    costPerHour: 150,
    description: 'Standard motorcycle for exploring Goa',
    fuel: 'Petrol',
    seating: 2,
    priceRange: 'Budget'
  },
  {
    id: 2,
    type: 'Bike',
    model: 'Honda CB Shine',
    costPerDay: 700,
    costPerHour: 120,
    description: 'Fuel-efficient commuter bike',
    fuel: 'Petrol',
    seating: 2,
    priceRange: 'Budget'
  },
  {
    id: 3,
    type: 'Car',
    model: 'Tata Nexon',
    costPerDay: 2500,
    costPerHour: 400,
    description: 'Compact SUV, perfect for short trips',
    fuel: 'Diesel',
    seating: 5,
    priceRange: 'Mid-range',
    acAvailable: true
  },
  {
    id: 4,
    type: 'Car',
    model: 'Maruti Swift',
    costPerDay: 2000,
    costPerHour: 350,
    description: 'Economical hatchback for city travel',
    fuel: 'Petrol',
    seating: 5,
    priceRange: 'Budget',
    acAvailable: true
  },
  {
    id: 5,
    type: 'Car',
    model: 'Toyota Fortuner',
    costPerDay: 4500,
    costPerHour: 700,
    description: 'Premium SUV for comfortable group travel',
    fuel: 'Diesel',
    seating: 7,
    priceRange: 'Premium',
    acAvailable: true
  },
  {
    id: 6,
    type: 'Car',
    model: 'Hyundai Creta',
    costPerDay: 3000,
    costPerHour: 500,
    description: 'Mid-size SUV with good features',
    fuel: 'Diesel',
    seating: 5,
    priceRange: 'Mid-range',
    acAvailable: true
  },
  {
    id: 7,
    type: 'Auto Rickshaw',
    model: 'Regular Auto',
    costPerKm: 15,
    description: 'Three-wheeler auto for short distances',
    fuel: 'CNG',
    seating: 3,
    priceRange: 'Very Budget'
  },
  {
    id: 8,
    type: 'Taxi',
    model: 'Ola/Uber Sedan',
    costPerKm: 12,
    minimumCharge: 100,
    description: 'On-demand taxi service',
    fuel: 'Petrol',
    seating: 4,
    priceRange: 'Budget'
  }
];

module.exports = localTransport;
