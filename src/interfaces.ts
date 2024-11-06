// Interface definitions that are used in multiple files

import luck from "./luck.ts";

// The idea for these interfaces is that they should be able to be used to represent a point on the map in two different ways:
// 1. As a latitude and longitude
// 2. As an array index representing a cell in the grid
export interface GeoLocation {
  lat: number;
  long: number;
}

export interface ArrayIndex {
  i: number;
  j: number;
  cache?: Cache; // An array index can have a cache associated with it
}

export interface Coin {
  serial: string;
  originIndex: ArrayIndex;
  owner: Cache;
}

export interface Cache {
  index: ArrayIndex;
  coins: Coin[];

  depositCoin(coin: Coin): void;
  collectCoin(): Coin;
  coinCount(): number;
}

export function createCache(
  index: ArrayIndex,
  maxInitialCoins: number,
): [Cache, ArrayIndex] {
  const cache: Cache = {
    index,
    coins: [],
    depositCoin(coin: Coin) {
      if (!coin) {
        return;
      }
      coin.owner = this;
      console.log(coin.serial);
      this.coins.push(coin);
    },
    collectCoin() {
      return this.coins.pop()!;
    },
    coinCount() {
      return this.coins.length;
    },
  };

  const coinNum = luck(
    [index.i, index.j, "https://www.youtube.com/watch?v=Jk5L3DRaqjs"]
      .toString(),
  ) *
    maxInitialCoins;
  console.log(coinNum);

  for (let i = 0; i < coinNum; i++) {
    cache.depositCoin(generateCoin(index));
  }

  index.cache = cache;

  return [cache, index];
}

export function generateCoin(originIndex: ArrayIndex): Coin {
  return {
    serial: luck(
      [
        originIndex.i,
        originIndex.j,
        `https://www.youtube.com/watch?v=gBmL_UqJnEA`,
      ].toString(),
    ).toString(),
    originIndex,
    owner: originIndex.cache!,
  };
}

export const player = createCache({ i: 0, j: 0 }, 0)[0];

export const playerUpdateEvent = new Event("player-update");

export const playerDiv = document.getElementById("player")!;
playerDiv.innerHTML = "You have " + player.coinCount().toString() + " coins";
playerDiv.addEventListener("player-update", () => {
  playerDiv.innerHTML = "You have " + player.coinCount().toString() + " coins";
});
