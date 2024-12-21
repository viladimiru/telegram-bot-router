import {RenderReturnType, Route, SendMessage} from './create-route';
import {createStorage} from './storage';
import type {Message, SendMessageOptions} from 'node-telegram-bot-api';

export type RouteMap = Record<string, Route> & {
  main: Route & {render: () => RenderReturnType};
};

type SendMessageCallback = (
  chatId: number,
  message: string,
  options: SendMessageOptions,
) => void;

interface Router<R extends RouteMap> {
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

  return {
    navigate(chatId, parameters) {
      storage.saveSession(chatId, parameters);
      const route = freezedRoutes[parameters.path];
      if (!route) {
        throw new Error('unexpected router path' + String(parameters.path));
      }

      route.render(parameters.props);
    },
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

      route.onAnswer(session.props, getSendMessage(chatId));
    },
    setSendMessageCallback(sendMessageCallback) {
      sendMessage = sendMessageCallback;
    },
  };
}
