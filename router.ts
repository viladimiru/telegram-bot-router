import { createRoute } from './create-route';
import { createRouter } from './create-router';
import { routeOne } from './routes/route-one';

export const router = createRouter({
	main: createRoute({
		render: () => ['main page', {}],
	}),
	one: createRoute({
		render: routeOne,
	}),
})
