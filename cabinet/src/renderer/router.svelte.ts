import { type GameInfo } from '../shared/types';

type Route =
  | { page: 'carousel' }
  | { page: 'game'; game: GameInfo };

const { manifest: initialManifest } = window.rcade.getArgs();

let currentRoute = $state<Route>(initialManifest == null ? { page: 'carousel' } : {
  page: "game", game: {
    id: undefined,
    name: initialManifest.name,
    latestVersion: initialManifest.version ?? undefined,
    dependencies: initialManifest.dependencies,
  }
});

export function getRoute() {
  return currentRoute;
}

export function navigateToCarousel() {
  currentRoute = { page: 'carousel' };
}

export function navigateToGame(game: GameInfo) {
  currentRoute = { page: 'game', game };
}
