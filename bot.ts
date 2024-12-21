import TelegramApi from 'node-telegram-bot-api';
import {configDotenv} from './node_modules/dotenv/lib/main';
import {createNavigator} from './navigator';

configDotenv();

if (!('TG_BOT_TOKEN' in process.env) || !process.env['TG_BOT_TOKEN']) {
  throw new Error('telegram bot token is not provided');
}

const bot = new TelegramApi(process.env['TG_BOT_TOKEN'], {
  polling: true,
});

const navigator = createNavigator(bot.sendMessage.bind(bot));

bot.on('message', navigator.onMessage);

bot.on('polling_error', (error) => console.log(error));
