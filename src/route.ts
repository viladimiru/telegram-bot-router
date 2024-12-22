import type {
  AnswerCallbackQueryOptions,
  CallbackQuery,
  Message,
  SendMessageOptions,
} from 'node-telegram-bot-api';

export type Props = object;

export type RenderReturnType = [string, SendMessageOptions];

export type SendMessageCallback = (
  chatId: number,
  message: string,
  options: SendMessageOptions,
) => Promise<Message>;

export type AnswerCallbackQueryCallback = (
  callbackQueryData: string,
  answerCallbackQueryOptions: AnswerCallbackQueryOptions,
) => void;

export type SendMessage = (
  text: string,
  options: SendMessageOptions,
) => Promise<Message>;
export type AnswerCallbackQuery = (
  callbackQueryData: string,
  options: AnswerCallbackQueryOptions,
) => void;

export type Navigate = <R extends Route<Props>>(
  route: R,
  props: Parameters<R['initialMessage']>[0],
) => void;

export type UpdateProps<P extends Props> = (newProps: P) => void;

export interface TgApi<P extends Props> {
  sessionNavigate: Navigate;
  sessionSendMessage: SendMessage;
  sessionUpdateProps: UpdateProps<P>;
  sessionAnswerCallbackQuery: AnswerCallbackQuery;
  outerSendMessage: SendMessageCallback;
}

export type Route<P extends Props> = Readonly<{
  id: string;
  initialMessage(props: P): RenderReturnType | Promise<RenderReturnType>;
  onMessage(props: P, message: Message, tgApi: TgApi<P>): void | Promise<void>;
  onCallback(
    props: P,
    callbackQuery: CallbackQuery,
    tgApi: TgApi<P>,
  ): void | Promise<void>;
}>;
