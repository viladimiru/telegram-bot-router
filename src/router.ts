import {
  AnswerCallbackQuery,
  AnswerCallbackQueryCallback,
  Navigate,
  Props,
  Route,
  SendMessage,
  SendMessageCallback,
  TgApi,
  UpdateProps,
} from './route.js';
import {createStorage, Storage} from './storage.js';
import type {Message, CallbackQuery} from 'node-telegram-bot-api';

type RouteWithProps = Route<Props>;

export interface Router<T extends CreateRouterOptions> {
  onMessage(message: Message): Promise<void>;
  onCallbackQuery(query: CallbackQuery): Promise<void>;
  resetSession(chatId: number): Promise<void>;
  getEntryRoute(): T['entryRoute'];
}

interface RouteRegistry {
  entryRoute: Route<{}>;
  routes: RouteWithProps[];
}

interface SessionRouteWithProps {
  route: RouteWithProps;
  props: Props;
  initial?: boolean;
}

interface CreateRouterOptions {
  entryRoute: RouteWithProps;
  routes: RouteWithProps[];
  tgApiCallbacks: {
    sendMessage: SendMessageCallback;
    answerCallbackQuery: AnswerCallbackQueryCallback;
  };
}

export function createRouter<T extends CreateRouterOptions>(
  options: T,
): Router<T> {
  const {entryRoute, routes: initialRoutes, tgApiCallbacks} = options;

  const routes: RouteWithProps[] = [...initialRoutes];
  const entryRouteIncluded = routes.some((route) => route.id === entryRoute.id);
  if (!entryRouteIncluded) {
    routes.push(entryRoute);
  }

  const routeRegistry: RouteRegistry = {entryRoute, routes};

  const storage = createStorage();

  const {sendMessage, answerCallbackQuery} = tgApiCallbacks;

  async function navigate(
    chatId: number,
    route: RouteWithProps,
    props: Props,
  ): Promise<void> {
    storage.saveSession(chatId, {
      routeId: route.id,
      props,
    });
    const initialMessage = await route.initialMessage(props);
    sendMessage(chatId, ...initialMessage);
  }

  function updateProps(chatId: number, newProps: Props): void {
    storage.updateProps(chatId, newProps);
  }

  function getTgApiMethods<P extends Props>(chatId: number): TgApi<P> {
    const sessionNavigate: Navigate = (route, props) => {
      navigate(chatId, route, props);
    };

    const sessionSendMessage: SendMessage = (text, options) => {
      return sendMessage(chatId, text, options);
    };

    const sessionUpdateProps: UpdateProps<Props> = (props) => {
      updateProps(chatId, props);
    };

    const sessionAnswerCallbackQuery: AnswerCallbackQuery = (
      callbackQueryData,
      options,
    ) => {
      answerCallbackQuery(callbackQueryData, options);
    };

    return {
      sessionNavigate,
      sessionSendMessage,
      sessionUpdateProps,
      sessionAnswerCallbackQuery,
      outerSendMessage: sendMessage,
    };
  }

  return {
    async onMessage(message) {
      const {route, props, initial} = getCurrentRouteWithProps(
        {entryRoute, routes},
        storage,
        message.chat.id,
      );

      if (initial) {
        storage.saveSession(message.chat.id, {
          routeId: routeRegistry.entryRoute.id,
          props: {},
        });
        const initialMessage = await route.initialMessage({});
        sendMessage(message.chat.id, ...initialMessage);
        return;
      }

      await route.onMessage(props, message, getTgApiMethods(message.chat.id));
    },
    async onCallbackQuery(query: CallbackQuery) {
      if (!query.message) {
        throw new Error('Unhandled error. Query without message.');
      }

      const message = query.message;
      const {route, props} = getCurrentRouteWithProps(
        routeRegistry,
        storage,
        message.chat.id,
      );

      await route.onCallback(props, query, getTgApiMethods(message.chat.id));
    },
    async resetSession(chatId) {
      storage.saveSession(chatId, {
        routeId: entryRoute.id,
        props: {},
      });
    },
    getEntryRoute() {
      return entryRoute;
    },
  };
}

function getCurrentRouteWithProps(
  routeRegistry: RouteRegistry,
  storage: Storage,
  chatId: number,
): SessionRouteWithProps {
  const routeData = storage.getSession(chatId);
  const entryRoute = {
    route: routeRegistry.entryRoute,
    props: {},
    initial: true,
  };
  if (!routeData) {
    console.log('Session data is empty, returning entry route');
    return entryRoute;
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
    return entryRoute;
  }

  return {
    route: activeRoute,
    props: routeData.props,
  };
}
