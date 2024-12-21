import {RenderReturnType, Route, SendMessage} from './create-route';
import {createStorage} from './storage';
import type {Message, SendMessageOptions} from 'node-telegram-bot-api';

export type ExtractRouterNavigation<R extends Router> = (
  arg1: Parameters<R['navigate']>[1],
) => void;

export type RouteMap = Record<string, Route> & {
  main: Route & {render: () => RenderReturnType};
};

type SendMessageCallback = (
  chatId: number,
  message: string,
  options: SendMessageOptions,
) => void;

export interface Router<R extends RouteMap = RouteMap> {
  navigate: (chatId: number, args: NavigationArguments<R>) => void;
  getActiveRoute: (message: Message) => void;

  setSendMessageCallback: (sendMessage: SendMessageCallback) => void;
}

type NavigationArguments<R extends RouteMap> = {
  [K in keyof R]: {
    path: K;
    props: Parameters<R[K]['render']>[0];
  };
}[Extract<keyof R, string>];

export function createRouter<R extends RouteMap>(routes: R): Router<R> {
  const storage = createStorage();
  const freezedRoutes = Object.freeze(routes);

  let sendMessage: SendMessageCallback | undefined;

  function getSendMessage(chatId: number): SendMessage {
    if (!sendMessage) {
      throw new Error('send message callback is not specified');
    }

    return sendMessage.bind({}, chatId);
  }

  function navigate(chatId: number, parameters: NavigationArguments<R>): void {
    storage.saveSession(chatId, parameters);
    const route = freezedRoutes[parameters.path];
    if (!route) {
      throw new Error('unexpected router path' + String(parameters.path));
    }

    route.render(parameters.props);
  }

  return {
    navigate,
    getActiveRoute(message) {
      const chatId = message.chat.id;

      const session = storage.getSession(chatId);
      if (!session) {
        storage.saveSession(chatId, {
          path: 'main',
          props: {},
        });
        getSendMessage(chatId)(...freezedRoutes['main'].render({}));
        return;
      }

      const route = freezedRoutes[session.path];
      if (!route) {
        throw new Error('unexpected router path' + String(session.path));
      }

      route.onAnswer(
        session.props,
        getSendMessage(chatId),
        // @ts-expect-error TODO: need to fix this
        navigate.bind(null, chatId),
      );
    },
    setSendMessageCallback(sendMessageCallback) {
      sendMessage = sendMessageCallback;
    },
  };
}
