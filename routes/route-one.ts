import {Route} from '../route';

interface Props1 {
  test: string;
}

export const routeOne: Route<Props1> = {
  id: 'routeOne',
  initialMessage(props) {
    return [props.test, {}];
  },
  onMessage(_props, _sendMessage, navigate) {
    navigate(routeTwo, {
      test2: 'navigated from test1',
    });
  },
};

interface Props2 {
  test2: string;
}

export const routeTwo: Route<Props2> = {
  id: 'routeTwo',
  initialMessage(props) {
    return [props.test2, {}];
  },
  onMessage(_props, _sendMessage, navigate) {
    navigate(routeOne, {
      test: 'navigated from test2',
    });
  },
};
