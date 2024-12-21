import {createRouter, ExtractRouterNavigation} from './create-router';
import {createRouteOne} from './routes/route-one';

export type Navigate = ExtractRouterNavigation<typeof router>;

export const router = createRouter({
  main: {
    render() {
      return ['asd', {}];
    },
    onAnswer() {},
  },
  one: createRouteOne(),
});
