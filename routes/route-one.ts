import {Route} from '../create-route';
import type {Navigate} from '../router';

interface Props {
  test: string;
}

export function createRouteOne(): Route<Props> {
  return {
    render(props) {
      return [props.test, {}];
    },
    onMessage(_props, _sendMessage, navigate: Navigate) {
      navigate({
        path: 'one',
        props: {
          test: 'sdfa',
        },
      });
    },
  };
}
