/**
 * Canonical service category IDs (match frontend `ServiceCategory` union).
 * Stored in MongoDB as these stable keys.
 */
const SERVICE_CATEGORIES = {
  WATER_AND_SANITATION: 'water_sanitation',
  ENERGY_AND_ELECTRICITY: 'energy_electricity',
  ROADS_AND_STORMWATER: 'roads_stormwater',
  WASTE_MANAGEMENT: 'waste_management',
  RECREATIONAL_SPORT_AND_LIBRARIES: 'recreational_sport_libraries',
  PUBLIC_TRANSPORTATION: 'public_transportation',
};

/** Backwards-compatible labels (legacy payloads). */
const SERVICE_CATEGORY_LABEL_TO_KEY = {
  'Water and Sanitation': SERVICE_CATEGORIES.WATER_AND_SANITATION,
  'Energy and Electricity': SERVICE_CATEGORIES.ENERGY_AND_ELECTRICITY,
  'Roads and Stormwater': SERVICE_CATEGORIES.ROADS_AND_STORMWATER,
  'Waste Management': SERVICE_CATEGORIES.WASTE_MANAGEMENT,
  'Recreational, Sport and Libraries': SERVICE_CATEGORIES.RECREATIONAL_SPORT_AND_LIBRARIES,
  'Public Transportation': SERVICE_CATEGORIES.PUBLIC_TRANSPORTATION,
};

module.exports = {
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_LABEL_TO_KEY,
};
