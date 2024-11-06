// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet, { type LatLngExpression } from "leaflet";

// Fix missing marker images
import "./leafletWorkaround.ts";

import {
  ArrayIndex,
  createCache,
  GeoLocation,
  player,
  playerDiv,
  playerUpdateEvent,
} from "./interfaces.ts";

// Basically, this file exists because I'm paranoid about the possibility of swapping out the leaflet library for something else in the future.
// The professor seems to be going on about how we should make it easy to swap out libraries, and I *suspect* that's because he's going to make us do it at some point.
// So everything that interacts with leaflet is going to be in this file, to hopefully make it easier to swap out later.
// Will be largely useless and redundant if we never actually swap out leaflet.

// The size of a tile in degrees of latitude and longitude
const TILE_DEGREES = 1e-4;
const INITIAL_COINS = 5;

// Wrapper function to create and set up map. Will also add a tile layer to the map.
export function makeMap(element: HTMLElement, mapConfig: {
  center: GeoLocation;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  zoomControl: false;
  scrollWheelZoom: false;
}) {
  const map = leaflet.map(element, {
    center: leaflet.latLng(mapConfig.center.lat, mapConfig.center.long),
    zoom: mapConfig.zoom,
    minZoom: mapConfig.minZoom,
    maxZoom: mapConfig.maxZoom,
    zoomControl: mapConfig.zoomControl,
    scrollWheelZoom: mapConfig.scrollWheelZoom,
  });

  leaflet
    .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    })
    .addTo(map);

  return map;
}

// Wrapper function to place a marker for the player on the map at a given location.
export function placePlayerMarker(map: leaflet.Map, location: GeoLocation) {
  const playerMarker = leaflet.marker(
    leaflet.latLng(location.lat, location.long),
  );
  playerMarker.bindTooltip("You are here!");
  playerMarker.addTo(map);
}

// Wrapper function to create a marker for a cache on the map at a given location.
export function placeCache(
  map: leaflet.Map,
  origin: GeoLocation,
  arrayLoc: ArrayIndex,
) {
  const bounds = leaflet.latLngBounds([
    calculateGeoLocation(origin, arrayLoc),
    calculateGeoLocation(origin, { i: arrayLoc.i + 1, j: arrayLoc.j + 1 }),
  ]);

  const rect = leaflet.rectangle(bounds);
  let cache;
  [cache, arrayLoc] = createCache(arrayLoc, INITIAL_COINS);

  rect.bindPopup(() => {
    const popup = document.createElement("div");
    popup.innerHTML = `
      <div>There is a cache here at "${arrayLoc.i},${arrayLoc.j}". It has ${cache.coinCount()} coins.</div>
      <button id="collect">Collect</button>
      <button id="deposit">Deposit</button>
    `;

    popup.querySelector<HTMLButtonElement>("#collect")!.addEventListener(
      "click",
      () => {
        player.depositCoin(cache.collectCoin());
        playerDiv.dispatchEvent(playerUpdateEvent);
        popup.querySelector<HTMLDivElement>("div")!.innerHTML =
          `There is a cache here at "${arrayLoc.i},${arrayLoc.j}". It has ${cache.coinCount()} coins.`;
      },
    );

    popup.querySelector<HTMLButtonElement>("#deposit")!.addEventListener(
      "click",
      () => {
        cache.depositCoin(player.collectCoin());
        playerDiv.dispatchEvent(playerUpdateEvent);
        popup.querySelector<HTMLDivElement>("div")!.innerHTML =
          `There is a cache here at "${arrayLoc.i},${arrayLoc.j}". It has ${cache.coinCount()} coins.`;
      },
    );

    return popup;
  });

  rect.addTo(map);
}

// Helper function to convert cell numbers into lat/lng coordinates
function calculateGeoLocation(
  origin: GeoLocation,
  arrayLoc: ArrayIndex,
): LatLngExpression {
  return [
    origin.lat + arrayLoc.i * TILE_DEGREES,
    origin.long + arrayLoc.j * TILE_DEGREES,
  ];
}
