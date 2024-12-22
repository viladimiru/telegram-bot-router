# About

This library was created to resolve navigation proposals for telegram bots.

## Quick start

`npm i telegram-bot-router`

```
import {createRouter, Route} from 'telegram-bot-router';
import TelegramApi from 'node-telegram-bot-api'

interface RouteOneProps {
  text: string;
}

const routeOne: Route<RouteOneProps> = {
  id: 'routeOne',
  initialMessage(props) {
    return [props.text, {}];
  },
  onMessage(_props, _message, {sessionNavigate}) {
    navigate(routeTwo, {
      anyObject: {
        value: 'value',
      },
    });
  },
  onCallback() {}
};

interface RouteTwoProps {
  anyObject: {
    value: string;
  };
}

const routeTwo: Route<RouteTwoProps> = {
  id: 'routeTwo',
  initialMessage(props) {
    return [props.anyObject.value, {}];
  },
  onMessage(_props, _message, {sessionNavigate}) {
    navigate(routeOne, {
      text: 'some text',
    });
  },
  onCallback() {}
};

const bot = new TelegramApi(...);
const sendMessageCallback = bot.sendMessage.bind(bot);
const answerCallbackQueryCallback = bot.answerCallbackQuery.bind(bot);

const navigator = createRouter()
  .setEntryRoute(routeOne)
  .registerRoute(routeTwo)
  .registerSendMessageCallback(sendMessageCallback)
  .registerAnswerCallbackQueryCallback(answerCallbackQueryCallback)
  .createNavigator();

bot.on('message', navigator.onMessage);
bot.on('callback_query', navigator.onCallbackQuery);
```
