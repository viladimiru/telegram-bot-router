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
  onMessage(_props, _sendMessage, navigate) {
    navigate(routeTwo, {
      anyObject: {
        value: 'value',
      },
    });
  },
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
  onMessage(_props, _sendMessage, navigate) {
    navigate(routeOne, {
      text: 'some text',
    });
  },
};

const bot = new TelegramApi(...);
const sendMessageCallback = bot.sendMessage.bind(bot);

const navigator = createRouter()
  .setEntryRoute(routeOne)
  .registerRoute(routeTwo)
  .registerSendMessageCallback(sendMessageCallback)
  .createNavigator();

bot.on('message', navigator.onMessage);
```
