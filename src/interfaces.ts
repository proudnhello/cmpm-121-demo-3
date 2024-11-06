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
      coin.owner = this;
      this.coins.push(coin);
    },
    collectCoin() {
      return this.coins.pop()!;
    },
    coinCount() {
      return this.coins.length;
    },
  };

  const coinNum = luck([index.i, index.j, "Sillicon Dreams"].toString()) *
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
    // Seed comes from https://www.youtube.com/watch?v=9gIMZ0WyY88
    serial: luck(
      [
        originIndex.i,
        originIndex.j,
        `From the moment I understood the weakness of my flesh, it disgusted me. 
        I crave the strength and certainty of steel.
        I aspire to the purity of the blessed machine.
        Your kind cling to the crude biomass you call the temple, as if it will not decay and fail you.
        In time, you will beg my kind to save you.
        But I am already saved.
        For the machine is immortal.
        Even in death, I serve the Omnissiah`,
      ].toString(),
    ).toString(),
    originIndex,
    owner: originIndex.cache!,
  };
}

export const _player = createCache({ i: 0, j: 0 }, 0)[0];
