// Hopefully, no need to import leaflet, as all the functions are exported from leafletFunctions.ts
import * as leafletFunctions from "./leafletFunctions.ts";

import { GeoLocation } from "./interfaces.ts";

import { Board } from "./board.ts";

// Style sheets
import "leaflet/dist/leaflet.css";
import "./style.css";

// Fix missing marker images
import "./leafletWorkaround.ts";

// These all seem like reasonable things to take straight from the example

// The board class represents the game board

// Location of our classroom (as identified on Google Maps)
const OAKES_CLASSROOM: GeoLocation = {
  lat: 36.98949379578401,
  long: -122.06277128548504,
};

const playerLocation = OAKES_CLASSROOM;
// Tunable gameplay parameters
const NEIGHBORHOOD_SIZE = 8;
const TILE_DEGREES = 1e-4;
const board = new Board(TILE_DEGREES, NEIGHBORHOOD_SIZE, playerLocation);

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
    leafletFunctions.placePlayerMarker(playerLocation);
    board.drawBoard(playerLocation);
  };
  movementButtons.appendChild(button);
}

board.drawBoard(playerLocation);
