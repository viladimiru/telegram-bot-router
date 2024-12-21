import { RenderReturnType, Route } from './create-route';
import { createStorage } from './storage';
import type { Message } from 'node-telegram-bot-api';

export type RouteMap =
	Record<string, Route> &
	{ main: Route & { render: () => RenderReturnType } };

interface Router<R extends RouteMap> {
	navigate: (chatId: number, args: NavigationArguments<R>) => void;
	renderActiveRoute: (message: Message) => [number, ...ReturnType<Route['render']>];
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

	return {
		navigate(chatId, parameters) {
			storage.saveSession(chatId, parameters);
			const route = freezedRoutes[parameters.path];
			if (!route) {
				throw new Error('unexpected router path' + String(parameters.path));
			}

			route.render(parameters.props)
		},
		renderActiveRoute(message) {
			const chatId = message.chat.id;

			const session = storage.getSession(chatId);
			const route = freezedRoutes[session.path as string]; // TODO: fix
			// TODO: figure out why I need to use brackets here
			if (!route && freezedRoutes['main']) {
				return [chatId, ...freezedRoutes['main'].render({})]

			}

			if (!route) {
				throw new Error('unexpected router path' + String(session.path));
			}

			return [chatId, ...route.render(session.props)];
		}
	}
}

