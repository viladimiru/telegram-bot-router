import TelegramApi from 'node-telegram-bot-api';
import {router} from './router';
import {configDotenv} from './node_modules/dotenv/lib/main';

configDotenv();

if (!('TG_BOT_TOKEN' in process.env) || !process.env['TG_BOT_TOKEN']) {
  throw new Error('telegram bot token is not provided');
}

const bot = new TelegramApi(process.env['TG_BOT_TOKEN'], {
  polling: true,
});

bot.on('message', (message) => {
  router.getActiveRoute(message);
});

bot.on('polling_error', (error) => console.log(error));

router.setSendMessageCallback(bot.sendMessage.bind(bot));
