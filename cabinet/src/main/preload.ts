/// <reference lib="dom" />

import { contextBridge, ipcRenderer } from 'electron';
import type { RcadeAPI, GameInfo } from '../shared/types';

const args = JSON.parse(process.env.STARTUP_CONFIG || '{}');

const rcadeAPI: RcadeAPI = {
  getArgs: () => args,
  getGames: () => ipcRenderer.invoke('get-games'),
  loadGame: async (game: GameInfo) => {
    const portsPromise = new Promise<void>((resolve) => {
      ipcRenderer.once("plugin-ports", ({ ports }, { structure }) => {
        // Transfer all ports to renderer via postMessage
        window.postMessage(
          { type: 'plugin-ports-ready', structure },
          '*',
          ports // Transfer the ports array
        );

        resolve();
      });
    });

    const { url } = await ipcRenderer.invoke('load-game', game);

    await portsPromise;

    return { url };
  },
  unloadGame: (gameId: string | undefined, name: string, version: string | undefined) => ipcRenderer.invoke('unload-game', gameId, name, version),
  onMenuKey: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('menu-key-pressed', listener);
    return () => ipcRenderer.removeListener('menu-key-pressed', listener);
  },
};

contextBridge.exposeInMainWorld('rcade', rcadeAPI);
