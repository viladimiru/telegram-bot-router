import {Props} from './route';

export interface RouteData {
  routeId: string;
  props: Props;
}

export interface Storage {
  saveSession: (chatId: number, routeData: RouteData) => void;
  getSession: (chatId: number) => RouteData | undefined;
  updateProps: (chatId: number, newProps: Props) => void;
}

export function createStorage(): Storage {
  const sessionStorage = new Map<number, RouteData>();

  const saveSession = (chatId: number, routeData: RouteData) =>
    sessionStorage.set(chatId, routeData);

  const getSession = (chatId: number) => sessionStorage.get(chatId);

  const updateProps = (chatId: number, newProps: Props) => {
    const session = getSession(chatId);
    if (!session) {
      throw new Error(
        `Unable to get session to update props: chatId ${chatId}`,
      );
    }

    saveSession(chatId, {
      ...session,
      props: newProps,
    });
  };
  return {
    saveSession,
    getSession,
    updateProps,
  };
}
