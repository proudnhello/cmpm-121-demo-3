// Hopefully, no need to import leaflet, as all the functions are exported from leafletFunctions.ts
import * as leafletFunctions from "./leafletFunctions.ts";

import { GeoLocation } from "./interfaces.ts";

import { Board } from "./board.ts";

// Style sheets
import "leaflet/dist/leaflet.css";
import "./style.css";

// Fix missing marker images
import "./leafletWorkaround.ts";

// Deterministic random number generator
import luck from "./luck.ts";
// These all seem like reasonable things to take straight from the example

// The board class represents the game board

// Location of our classroom (as identified on Google Maps)
const OAKES_CLASSROOM: GeoLocation = {
  lat: 36.98949379578401,
  long: -122.06277128548504,
};

const playerLocation = OAKES_CLASSROOM;

// Tunable gameplay parameters
const GAMEPLAY_ZOOM_LEVEL = 19;
const NEIGHBORHOOD_SIZE = 8;
const CACHE_SPAWN_PROBABILITY = 0.1;
const TILE_DEGREES = 1e-4;
const board = new Board(TILE_DEGREES, NEIGHBORHOOD_SIZE);

// Seed provided by Dogulas Adams, in the book "Restaurant at the End of the Universe"
const SEED =
  "In the beginning, the universe was created. This has made a lot of people very angry and been widely regarded as a bad move.";

const map = leafletFunctions.makeMap(document.getElementById("map")!, {
  center: OAKES_CLASSROOM,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

// Add buttons for movement
const movementButtons = document.getElementById("movementButtons")!;
const directions = [
  { text: "↑", i: 1, j: 0 },
  { text: "←", i: 0, j: -1 },
  { text: "↓", i: -1, j: 0 },
  { text: "→", i: 0, j: 1 },
];
for (const direction of directions) {
  const button = document.createElement("button");
  button.textContent = direction.text;
  button.onclick = () => {
    playerLocation.lat += direction.i * TILE_DEGREES;
    playerLocation.long += direction.j * TILE_DEGREES;
    leafletFunctions.placePlayerMarker(map, playerLocation);
  };
  movementButtons.appendChild(button);
}

leafletFunctions.placePlayerMarker(map, OAKES_CLASSROOM);

// Add caches to the map by cell numbers, using the luck function to determine if a cache should be placed
board.getVisibleCells(board.getCellForPoint(OAKES_CLASSROOM)).forEach(
  (cell) => {
    if (luck([cell.i, cell.j, SEED].toString()) < CACHE_SPAWN_PROBABILITY) {
      leafletFunctions.placeCache(map, board, cell);
    }
  },
);
