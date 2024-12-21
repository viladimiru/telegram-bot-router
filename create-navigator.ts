import {
  Navigate,
  Props,
  Route,
  SendMessage,
  SendMessageCallback,
} from './route';
import {createStorage, Storage} from './storage';
import type {SendMessageOptions, Message} from 'node-telegram-bot-api';

type RouteWithProps = Route<Props>;

export interface Router {
  setEntryRoute(route: RouteWithProps): this;
  registerRoute(route: RouteWithProps): this;
  registerSendMessageCallback(sendMessageCallback: SendMessageCallback): this;
  createNavigator(): Navigator;
}

export interface Navigator {
  onMessage(message: Message): void;
}

interface RouteRegistry {
  entryRoute: RouteWithProps;
  routes: RouteWithProps[];
}

interface RawRouteRegistry extends Omit<RouteRegistry, 'entryRoute'> {
  entryRoute?: RouteRegistry['entryRoute'];
}

interface SessionRouteWithProps {
  route: RouteWithProps;
  props: Props;
}

export function createRouter(): Router {
  const routeRegistry: RawRouteRegistry = {
    routes: [],
  };
  let _sendMessageCallback: SendMessageCallback | undefined;

  return {
    setEntryRoute(route) {
      routeRegistry.entryRoute = route;
      routeRegistry.routes.push(route);
      return this;
    },
    registerRoute(route) {
      const routeIds = routeRegistry.routes.map(({id}) => id);
      if (routeIds.includes(route.id)) {
        throw new Error(
          `Unable to register route with duplicated id: ${route.id}`,
        );
      }
      routeRegistry.routes.push(route);
      return this;
    },
    registerSendMessageCallback(sendMessageCallback: SendMessageCallback) {
      _sendMessageCallback = sendMessageCallback;
      return this;
    },
    createNavigator() {
      const {entryRoute, routes} = routeRegistry;
      if (!entryRoute) {
        throw new Error(
          'Unable to create navigator without entryRoute in registry',
        );
      }

      if (!_sendMessageCallback) {
        throw new Error(
          'Unable to create navigator without sendMessageCallback in registry',
        );
      }

      return createNavigator({entryRoute, routes}, _sendMessageCallback);
    },
  };
}

function createNavigator(
  routeRegistry: RouteRegistry,
  sendMessageCallback: SendMessageCallback,
): Navigator {
  const storage = createStorage();

  function navigate(chatId: number, route: RouteWithProps, props: Props): void {
    storage.saveSession(chatId, {
      routeId: route.id,
      props,
    });
    sendMessage(chatId, ...route.initialMessage(props));
  }

  const sendMessage = (
    chatId: number,
    message: string,
    options: SendMessageOptions,
  ) => {
    sendMessageCallback(chatId, message, options);
  };

  return {
    onMessage(message) {
      const {route, props} = getCurrentRouteWithProps(
        routeRegistry,
        storage,
        message.chat.id,
      );

      const sessionNavigate: Navigate = (route, props) => {
        navigate(message.chat.id, route, props);
      };

      const sessionSendMessage: SendMessage = (text, options) => {
        sendMessage(message.chat.id, text, options);
      };

      route.onMessage(props, sessionSendMessage, sessionNavigate, message.text);
    },
  };
}

function getCurrentRouteWithProps(
  routeRegistry: RouteRegistry,
  storage: Storage,
  chatId: number,
): SessionRouteWithProps {
  const routeData = storage.getSession(chatId);
  const fallbackRoute = {route: routeRegistry.entryRoute, props: {}};
  if (!routeData) {
    console.log('Session data is empty, returning entry route');
    return fallbackRoute;
  }

  const activeRoute = routeRegistry.routes.find(
    (route) => route.id === routeData.routeId,
  );

  if (!activeRoute) {
    console.error(
      [
        `Active route in route registry not found: id ${routeData.routeId}.`,
        'Fallbacking on entry route.',
      ].join(' '),
    );
    return fallbackRoute;
  }

  return {
    route: activeRoute,
    props: routeData.props,
  };
}
