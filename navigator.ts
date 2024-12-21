import {createRouter, Navigator, SendMessageCallback} from './index';
import {routeOne, routeTwo} from './routes/route-one';

export function createNavigator(
  sendMessageCallback: SendMessageCallback,
): Navigator {
  return createRouter()
    .setEntryRoute(routeOne)
    .registerRoute(routeTwo)
    .registerSendMessageCallback(sendMessageCallback)
    .createNavigator();
}
