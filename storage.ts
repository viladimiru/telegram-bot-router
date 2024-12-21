export interface RouteData {
  routeId: string;
  props: object;
}

export interface Storage {
  saveSession: (chatId: number, routeData: RouteData) => void;
  getSession: (chatId: number) => RouteData | undefined;
}

export function createStorage(): Storage {
  const sessionStorage = new Map<number, RouteData>();
  return {
    saveSession: (chatId, routeData) => {
      sessionStorage.set(chatId, routeData);
    },
    getSession: (chatId) => {
      const session = sessionStorage.get(chatId);
      return session;
    },
  };
}
