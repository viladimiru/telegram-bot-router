import {SendMessageOptions} from 'node-telegram-bot-api';

export type SendMessage = (
  message: string,
  options: SendMessageOptions,
) => void;
export type Props = object;
export type RenderReturnType = [string, SendMessageOptions];

export interface Route<P extends Props = Props> {
  render(props: P): RenderReturnType;
  onMessage(
    props: P,
    sendMessage: SendMessage,
    navigate: (parameters: {path: string; props: unknown}) => void,
  ): void;
}

export function createRoute<R extends Route>(route: R): R {
  return route;
}
