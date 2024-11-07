// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";

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

import { Board } from "./board.ts";

// Basically, this file exists because I'm paranoid about the possibility of swapping out the leaflet library for something else in the future.
// The professor seems to be going on about how we should make it easy to swap out libraries, and I *suspect* that's because he's going to make us do it at some point.
// So everything that interacts with leaflet is going to be in this file, to hopefully make it easier to swap out later.
// Will be largely useless and redundant if we never actually swap out leaflet.

// The size of a tile in degrees of latitude and longitude
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
  board: Board,
  index: ArrayIndex,
) {
  const GeoBounds = board.getCellBounds(index);
  // Convert the GeoLocation bounds to LatLngExpression bounds
  const bounds = leaflet.latLngBounds([[GeoBounds[0].lat, GeoBounds[0].long], [
    GeoBounds[1].lat,
    GeoBounds[1].long,
  ]]);
  const cacheMapBounds = leaflet.rectangle(bounds);
  const cache = createCache(index, INITIAL_COINS);

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
        cachePopup.querySelector<HTMLDivElement>("div")!.innerHTML =
          `There is a cache here at "${index.i},${index.j}". It has ${cache.coinCount()} coins in total. 
          Those coins are: <br> ${cache.coinString()}`;
      },
    );

    // The deposit button will deposit the player's coins into the cache
    cachePopup.querySelector<HTMLButtonElement>("#deposit")!.addEventListener(
      "click",
      () => {
        cache.depositCoin(player.collectCoin());
        playerDiv.dispatchEvent(playerUpdateEvent);
        cachePopup.querySelector<HTMLDivElement>("div")!.innerHTML =
          `There is a cache here at "${index.i},${index.j}". It has ${cache.coinCount()} coins.
          Those coins are: <br> ${cache.coinString()}`;
      },
    );

    return cachePopup;
  });

  cacheMapBounds.addTo(map);
}
