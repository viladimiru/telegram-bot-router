import { RenderReturnType, Route, SendMessage } from './create-route';
import { createStorage } from './storage';
import type { Message } from 'node-telegram-bot-api';

export type RouteMap =
	Record<string, Route> &
	{ main: Route & { render: () => RenderReturnType } };


interface Router<R extends RouteMap> {
	navigate: (chatId: number, args: NavigationArguments<R>) => void;
	getActiveRoute: (message: Message) => void;

	setSendMessageCallback: (sendMessage: SendMessage) => void;
}

type NavigationArguments<R extends RouteMap> = {
	[K in keyof R]: {
		path: K;
		props: Parameters<R[K]['render']>[0];
	}
}[keyof R]

export function createRouter<R extends RouteMap>(routes: R): Router<R> {
	const storage = createStorage();
	const freezedRoutes = Object.freeze(routes);

	let sendMessage: SendMessage | undefined;

	function getSendMessage(): SendMessage {
		if (!sendMessage) {
			throw new Error('send message callback is not specified');
		}

		return sendMessage;
	}

	return {
		navigate(chatId, parameters) {
			storage.saveSession(chatId, parameters);
			const route = freezedRoutes[parameters.path];
			if (!route) {
				throw new Error('unexpected router path' + String(parameters.path));
			}

			route.render(parameters.props)
		},
		getActiveRoute(message) {
			const chatId = message.chat.id;

			const session = storage.getSession(chatId);
			// TODO: figure out why I need to use brackets here
			if (!session && freezedRoutes['main']) {
				storage.saveSession(chatId, {
					path: 'main',
					props: {},
				});
				getSendMessage()(chatId, ...freezedRoutes['main'].render({}));
				return;
			}

			if (!session) {
				throw new Error('no session data and main route is not specified');
			}

			const route = freezedRoutes[session.path as string]; // TODO: fix
			if (!route) {
				throw new Error('unexpected router path' + String(session.path));
			}

			route.onAnswer(session.props, chatId, getSendMessage());
		},
		setSendMessageCallback(sendMessageCallback) {
			sendMessage = sendMessageCallback;
		}
	}
}

