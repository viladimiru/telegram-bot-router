import { SendMessageOptions } from 'node-telegram-bot-api';

export type Props = Record<string, unknown>;
export type RenderReturnType = [
	string,
	SendMessageOptions,
]

export interface Route {
	render(props: Props): RenderReturnType;
}

export function createRoute<R extends Route>(route: R): R {
	return route;
}

