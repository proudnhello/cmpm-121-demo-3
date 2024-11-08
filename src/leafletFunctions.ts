// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";

// Fix missing marker images
import "./leafletWorkaround.ts";

import {
  Cache,
  GeoLocation,
  player,
  playerDiv,
  playerUpdateEvent,
} from "./interfaces.ts";

import { Board } from "./board.ts";

// Basically, this file exists because I'm paranoid about the possibility of swapping out the leaflet library for something else in the future.
// The professor seems to be going on about how we should make it easy to swap out libraries, and I *suspect* that's because he's going to make us do it at some point.
// So everything that interacts with leaflet is going to be in this file, to hopefully make it easier to swap out later.
// Will be largely useless and redundant if we never actually swap out leaflet.

// The size of a tile in degrees of latitude and longitude
let playerMarker: leaflet.Marker;

// The map object used throughout the game
let map: leaflet.Map;

// An array of cache markers on the map
const cacheMarkers: leaflet.Rectangle[] = [];

// Wrapper function to create and set up map. Will also add a tile layer to the map.
export function makeMap(element: HTMLElement, mapConfig: {
  center: GeoLocation;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  zoomControl: false;
  scrollWheelZoom: false;
}) {
  map = leaflet.map(element, {
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
export function placePlayerMarker(location: GeoLocation) {
  playerMarker?.remove();
  playerMarker = leaflet.marker(
    leaflet.latLng(location.lat, location.long),
  );
  playerMarker.bindTooltip("You are here!");
  playerMarker.addTo(map);
}

// Wrapper function to create a marker for a cache on the map at a given location.
export function placeCache(
  board: Board,
  cache: Cache,
) {
  const index = cache.index;
  const GeoBounds = board.getCellBounds(index);
  // Convert the GeoLocation bounds to LatLngExpression bounds
  const bounds = leaflet.latLngBounds([
    [
      GeoBounds[0].lat,
      GeoBounds[0].long,
    ],
    [
      GeoBounds[1].lat,
      GeoBounds[1].long,
    ],
  ]);
  const cacheMapBounds = leaflet.rectangle(bounds);

  // Add a popup to the cache rectangle, with two buttons
  cacheMapBounds.bindPopup(() => {
    const cachePopup = document.createElement("div");
    cachePopup.innerHTML = `
      <div>There is a cache here at "${index.i},${index.j}". It has ${cache.coinCount()} coins.<br>
      Those coins are: <br> ${cache.coinString()}</div>
      <button id="collect">Collect</button>
      <button id="deposit">Deposit</button>
    `;
    // The collect button will deposit the cache's coins into the player's inventory
    cachePopup.querySelector<HTMLButtonElement>("#collect")!.addEventListener(
      "click",
      () => {
        player.depositCoin(cache.collectCoin());
        playerDiv.dispatchEvent(playerUpdateEvent);
        updateCachePopup(
          cachePopup.querySelector<HTMLDivElement>("div")!,
          cache,
          cache.index,
        )!;
      },
    );

    // The deposit button will deposit the player's coins into the cache
    cachePopup.querySelector<HTMLButtonElement>("#deposit")!.addEventListener(
      "click",
      () => {
        cache.depositCoin(player.collectCoin());
        playerDiv.dispatchEvent(playerUpdateEvent);
        updateCachePopup(
          cachePopup.querySelector<HTMLDivElement>("div")!,
          cache,
          cache.index,
        )!;
      },
    );

    return cachePopup;
  });

  cacheMapBounds.addTo(map);
  cacheMarkers.push(cacheMapBounds);
}

// Wrapper function to clear all cache markers from the map
export function clearMap() {
  for (const marker of cacheMarkers) {
    marker.remove();
  }
}

// Wrapper function to center the map on a given location
export function centerOnPoint(location: GeoLocation) {
  map.setView(leaflet.latLng(location.lat, location.long));
}

function updateCachePopup(
  popup: HTMLDivElement,
  cache: Cache,
  index: { i: number; j: number },
) {
  popup.innerHTML = `
    There is a cache here at "${index.i},${index.j}". It has ${cache.coinCount()} coins.<br>
    Those coins are: <br> ${cache.coinString()}`;
}
