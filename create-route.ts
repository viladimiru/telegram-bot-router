import { SendMessageOptions } from 'node-telegram-bot-api';

export type SendMessage = (message: string, options: SendMessageOptions) => void;
export type Props = Record<string, unknown>;
export type RenderReturnType = [
	string,
	SendMessageOptions,
]

export interface Route {
	render(props: Props): RenderReturnType;
	onAnswer(props: Props, sendMessage: SendMessage): void;
}

export function createRoute<R extends Route>(route: R): R {
	return route;
}

