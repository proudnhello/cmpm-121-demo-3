// Hopefully, no need to import leaflet, as all the functions are exported from leafletFunctions.ts
import * as leafletFunctions from "./leafletFunctions.ts";

import { GeoLocation } from "./interfaces.ts";

import { Board } from "./board.ts";

// Style sheets
import "leaflet/dist/leaflet.css";
import "./style.css";

// Fix missing marker images
import "./leafletWorkaround.ts";

// Location of our classroom (as identified on Google Maps)
const OAKES_CLASSROOM: GeoLocation = {
  lat: 36.98949379578401,
  long: -122.06277128548504,
};

// Initial player location
const playerLocation = OAKES_CLASSROOM;
// Tunable gameplay parameters
const NEIGHBORHOOD_SIZE = 8;
const TILE_DEGREES = 1e-4;
const board = new Board(TILE_DEGREES, NEIGHBORHOOD_SIZE, playerLocation);

// Define movement buttons based on their directions
const movementButtons = document.getElementById("movementButtons")!;
const directions = [
  { text: "↑", i: 1, j: 0 },
  { text: "←", i: 0, j: -1 },
  { text: "↓", i: -1, j: 0 },
  { text: "→", i: 0, j: 1 },
];

// Iterate over the directions and create a button for each
for (const direction of directions) {
  const button = document.createElement("button");
  button.textContent = direction.text;
  button.onclick = () => {
    // Increase the player's location by the direction
    playerLocation.lat += direction.i * TILE_DEGREES;
    playerLocation.long += direction.j * TILE_DEGREES;
    // Update the player's marker and redraw the board
    leafletFunctions.placePlayerMarker(playerLocation);
    board.drawBoard(playerLocation);
  };
  movementButtons.appendChild(button);
}

// Create the initial board
board.drawBoard(playerLocation);
