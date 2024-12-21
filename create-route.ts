import {SendMessageOptions} from 'node-telegram-bot-api';

export type Props = object;

export type RenderReturnType = [string, SendMessageOptions];

export type SendMessageCallback = (
  chatId: number,
  message: string,
  options: SendMessageOptions,
) => void;

export type SendMessage = (text: string, options: SendMessageOptions) => void;

export type Navigate = <R extends Route<Props>>(
  route: R,
  props: Parameters<R['initialMessage']>[0],
) => void;

export interface Route<P extends Props> {
  id: string;
  initialMessage(props: P): RenderReturnType;
  onMessage(props: P, sendMessage: SendMessage, navigate: Navigate): void;
}
