import type {
  AnswerCallbackQueryOptions,
  CallbackQuery,
  SendMessageOptions,
} from 'node-telegram-bot-api';

export type Props = object;

export type RenderReturnType = [string, SendMessageOptions];

export type SendMessageCallback = (
  chatId: number,
  message: string,
  options: SendMessageOptions,
) => void;

export type AnswerCallbackQueryCallback = (
  callbackQueryData: string,
  answerCallbackQueryOptions: AnswerCallbackQueryOptions,
) => void;

export type SendMessage = (text: string, options: SendMessageOptions) => void;
export type AnswerCallbackQuery = (
  callbackQueryData: string,
  options: AnswerCallbackQueryOptions,
) => void;

export type Navigate = <R extends Route<Props>>(
  route: R,
  props: Parameters<R['initialMessage']>[0],
) => void;

export type UpdateProps<P extends Props> = (newProps: P) => void;

export interface Route<P extends Props> {
  id: string;
  initialMessage(props: P): RenderReturnType;
  onMessage(
    props: P,
    sendMessage: SendMessage,
    navigate: Navigate,
    updateProps: UpdateProps<P>,
    text?: string,
  ): void;
  onCallback(
    props: P,
    sendMessage: SendMessage,
    navigate: Navigate,
    updateProps: UpdateProps<P>,
    callbackQuery: CallbackQuery,
    answerCallbackQuery: AnswerCallbackQuery,
  ): void;
}
