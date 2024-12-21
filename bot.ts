import * as TelegramApi from 'node-telegram-bot-api';
import { router } from './router';

const bot = new TelegramApi('8174942083:AAHK6JlQRkApBb7gtban0DxigEa0WMP-kjI', {
	polling: true,
});

bot.on('message', (message) => {
	router.getActiveRoute(message)
})

bot.on('polling_error', (error) => console.log(error));

router.setSendMessageCallback(bot.sendMessage.bind(bot));
