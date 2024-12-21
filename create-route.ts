import { SendMessageOptions } from 'node-telegram-bot-api';

export type SendMessage = (chatId: number, message: string, options: SendMessageOptions) => void;
export type Props = Record<string, unknown>;
export type RenderReturnType = [
	string,
	SendMessageOptions,
]

export interface Route {
	render(props: Props): RenderReturnType;
	// TODO: get rid of chatId
	onAnswer(props: Props, chatId: number, sendMessage: SendMessage): void;
}

export function createRoute<R extends Route>(route: R): R {
	return route;
}

