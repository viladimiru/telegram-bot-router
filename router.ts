import { createRoute } from './create-route';
import { createRouter } from './create-router';

export const router = createRouter({
	main: createRoute({
		render: () => ['main page', {}],
		onAnswer(_props, chatId, sendMessage) {
			sendMessage(chatId, 'answer on message', {})
		},
	}),
})
