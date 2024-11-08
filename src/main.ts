// Hopefully, no need to import leaflet, as all the functions are exported from leafletFunctions.ts
import * as leafletFunctions from "./leafletFunctions.ts";

import { type ArrayIndex, createCache, GeoLocation } from "./interfaces.ts";

import { Board } from "./board.ts";

// Style sheets
import "leaflet/dist/leaflet.css";
import "./style.css";

// Fix missing marker images
import "./leafletWorkaround.ts";

// Location of our classroom (as identified on Google Maps)
const _OAKES_CLASSROOM: GeoLocation = {
  lat: 36.98949379578401,
  long: -122.06277128548504,
};

const playerLocation: GeoLocation = _OAKES_CLASSROOM;

// This cache is the player's inventory
const playerCache = createCache({ i: 0, j: 0 }, 0);

const playerDiv = document.getElementById("player")!;

// This event is used to update the player's inventory display
export const playerUpdateEvent = new Event("player-update");

playerDiv.addEventListener("player-update", () => {
  playerDiv.innerHTML = "You have " + playerCache.coinCount().toString() +
    " coins<br>They are:<br> ";
  const buttons = player.cache.coinButtons(board);
  for (const button of buttons) {
    playerDiv.appendChild(button);
  }
});

const player = {
  cache: playerCache,
  div: playerDiv,
  updateEvent: playerUpdateEvent,
  location: playerLocation,
};

// Update the player's location on the map, and relevant bookkeeping
function updatePlayerPosition(location: GeoLocation) {
  player.location.lat = location.lat;
  player.location.long = location.long;
  leafletFunctions.placePlayerMarker(player.location);
  board.drawBoard(player);
}

// Tunable gameplay parameters
const NEIGHBORHOOD_SIZE = 8;
const TILE_DEGREES = 1e-4;
const board = new Board(TILE_DEGREES, NEIGHBORHOOD_SIZE, player.location);
// Get the index of the player's location. This will be used to determine if the player's position change is worth updating the board
let playerIndex: ArrayIndex = board.getCellForPoint(player.location);

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
    updatePlayerPosition({
      lat: player.location.lat + direction.i * TILE_DEGREES,
      long: player.location.long + direction.j * TILE_DEGREES,
    });
  };
  movementButtons.appendChild(button);
}

// Add a button to allow for automatic movement based on the player's location
const realLifeMovementButton = document.createElement("button");
realLifeMovementButton.textContent = "🌐";

// The following two functions are used to get the initial location of the player, once the button is clicked
// Get the current location of the player
function getCurrentLocation(): Promise<{ lat: number; long: number }> {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            long: position.coords.longitude,
          });
        },
        () => {
          reject("Unable to get current location");
        },
      );
    } else {
      reject("Geolocation is not supported by this browser");
    }
  });
}

// Set the player's location to the current location if possible
async function setPlayerLocation() {
  try {
    const location = await getCurrentLocation();
    leafletFunctions.jumpPlayerMarker(location);
    updatePlayerPosition(location);
    leafletFunctions.centerOnPoint(location);
    console.log("Got current location.");
  } catch (error) {
    console.error(error);
    console.log("Using default location.");
  }
}

realLifeMovementButton.onclick = async () => {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by this browser");
    return;
  }
  await setPlayerLocation();
  navigator.geolocation.watchPosition((position) => {
    const currentPlayerIndex = board.getCellForPoint(player.location);
    // Only update the board if the player has moved to a new tile
    // updatePlayerPosition will update the player's location and redraw the board, while placePlayerMarker will only update the player's marker
    if (
      currentPlayerIndex.i !== playerIndex.i ||
      currentPlayerIndex.j !== playerIndex.j
    ) {
      // Update the player's location and redraw the board
      playerIndex = currentPlayerIndex;
      updatePlayerPosition({
        lat: position.coords.latitude,
        long: position.coords.longitude,
      });
    } else {
      // Update the player's marker
      player.location.lat = position.coords.latitude;
      player.location.long = position.coords.longitude;
      leafletFunctions.placePlayerMarker({
        lat: position.coords.latitude,
        long: position.coords.longitude,
      });
    }
  }, () => {
    alert("Unable to get current location");
  });
};

movementButtons.appendChild(realLifeMovementButton);

// Add a button to clear the state of the board
const clearStateButton = document.createElement("button");
clearStateButton.textContent = "🚮";
clearStateButton.onclick = () => {
  if (
    prompt("Are you sure you want to clear the state? Type yes to confirm.")!
      .toLowerCase() === "yes"
  ) {
    board.resetState();
    location.reload(); // Reload the page to stop the player from adding more state
  }
};
movementButtons.appendChild(clearStateButton);

// Add a button to center the view on the player
const centerButton = document.createElement("button");
centerButton.textContent = "🎯";
centerButton.onclick = () => {
  leafletFunctions.centerOnPoint(player.location);
};
movementButtons.appendChild(centerButton);

board.loadState(player);
playerDiv.dispatchEvent(playerUpdateEvent);
// Create the initial board
board.drawBoard(player);
