export interface RouteData {
	path: string;
	props: Record<string, unknown>;
}

interface Storage {
	saveSession: (chatId: number, routeData: RouteData) => void;
	getSession: (chatId: number) => RouteData | undefined;
}

export function createStorage(): Storage {
	const sessionStorage = new Map<number, RouteData>()
	return {
		saveSession: (chatId, routeData) => {
			sessionStorage.set(chatId, routeData);
		},
		getSession: (chatId) => {
			const session = sessionStorage.get(chatId);
			return session
		},
	}
}