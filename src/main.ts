// Hopefully, no need to import leaflet, as all the functions are exported from leafletFunctions.ts
import * as leafletFunctions from "./leafletFunctions.ts";

// Type alias to avoid having to type leafletFunctions
type Cell = leafletFunctions.GeoLocation;

// Style sheets
import "leaflet/dist/leaflet.css";
import "./style.css";

// Fix missing marker images
import "./leafletWorkaround.ts";

// Deterministic random number generator
// import luck from "./luck.ts";

// These all seem like reasonable things to take straight from the example

// Location of our classroom (as identified on Google Maps)
const OAKES_CLASSROOM: Cell = {
  lat: 36.98949379578401,
  long: -122.06277128548504,
};

// Tunable gameplay parameters
const GAMEPLAY_ZOOM_LEVEL = 19;
const NEIGHBORHOOD_SIZE = 8;
// const CACHE_SPAWN_PROBABILITY = 0.1;

const map = leafletFunctions.makeMap(document.getElementById("map")!, {
  center: OAKES_CLASSROOM,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

leafletFunctions.placePlayerMarker(map, OAKES_CLASSROOM);

for (let i = -NEIGHBORHOOD_SIZE; i <= NEIGHBORHOOD_SIZE; i += 3) {
  for (let j = -NEIGHBORHOOD_SIZE; j <= NEIGHBORHOOD_SIZE; j += 2) {
    leafletFunctions.placeCache(map, OAKES_CLASSROOM, { i, j });
  }
}
