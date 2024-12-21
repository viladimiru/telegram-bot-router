// TODO: get rid of this dependency
import { Props } from './create-route';

export interface RouteData {
	// TODO: fix unknown type
	path: unknown;
	props: Props;
}

interface Storage {
	saveSession: (chatId: number, routeData: RouteData) => void;
	getSession: (chatId: number) => RouteData;
}

export function createStorage(): Storage {
	const sessionStorage = new Map<number, RouteData>()
	return {
		saveSession: (chatId, routeData) => {
			sessionStorage.set(chatId, routeData);
		},
		getSession: (chatId) => {
			const session = sessionStorage.get(chatId);
			if (!session) {
				return {
					path: 'main',
					props: {},
				}
			}

			return session
		},
	}
}