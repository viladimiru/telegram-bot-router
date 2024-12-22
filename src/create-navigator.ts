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
import type {
  SendMessageOptions,
  Message,
  CallbackQuery,
  AnswerCallbackQueryOptions,
} from 'node-telegram-bot-api';

type RouteWithProps = Route<Props>;

export interface Router {
  setEntryRoute(route: RouteWithProps): this;
  registerRoute(route: RouteWithProps): this;
  registerSendMessageCallback(sendMessageCallback: SendMessageCallback): this;
  registerAnswerCallbackQueryCallback(
    answerCallbackQueryCallback: AnswerCallbackQueryCallback,
  ): this;
  createNavigator(): Navigator;
}

export interface Navigator {
  onMessage(message: Message): Promise<void>;
  onCallbackQuery(query: CallbackQuery): Promise<void>;
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
  initial?: boolean;
}

export function createRouter(): Router {
  const routeRegistry: RawRouteRegistry = {
    routes: [],
  };
  let _sendMessageCallback: SendMessageCallback | undefined;
  let _answerCallbackQueryCallback: AnswerCallbackQueryCallback | undefined;

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
    registerAnswerCallbackQueryCallback(answerCallbackQueryCallback) {
      _answerCallbackQueryCallback = answerCallbackQueryCallback;
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

      if (!_answerCallbackQueryCallback) {
        throw new Error(
          'Unable to create navigator without answerCallbackQueryCallback in registry',
        );
      }

      return createNavigator(
        {entryRoute, routes},
        _sendMessageCallback,
        _answerCallbackQueryCallback,
      );
    },
  };
}

function createNavigator(
  routeRegistry: RouteRegistry,
  sendMessageCallback: SendMessageCallback,
  answerCallbackQueryCallback: AnswerCallbackQueryCallback,
): Navigator {
  const storage = createStorage();

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

  function sendMessage(
    chatId: number,
    message: string,
    options: SendMessageOptions,
  ): Promise<Message> {
    return sendMessageCallback(chatId, message, options);
  }

  function updateProps(chatId: number, newProps: Props): void {
    storage.updateProps(chatId, newProps);
  }

  function answerCallbackQuery(
    callbackQueryData: string,
    options: AnswerCallbackQueryOptions,
  ): void {
    answerCallbackQueryCallback(callbackQueryData, options);
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
      outerSendMessage: sendMessageCallback,
    };
  }

  return {
    async onMessage(message) {
      const {route, props, initial} = getCurrentRouteWithProps(
        routeRegistry,
        storage,
        message.chat.id,
      );

      if (initial) {
        storage.saveSession(message.chat.id, {
          routeId: routeRegistry.entryRoute.id,
          props: {},
        });
        const initialMessage = await route.initialMessage({});
        sendMessageCallback(message.chat.id, ...initialMessage);
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
