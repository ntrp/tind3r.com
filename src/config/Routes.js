import React from 'react'
import { Provider } from 'mobx-react'
import ReactGA from 'react-ga'
import { browserHistory, Router, Route } from 'react-router'
import UserModel from '../models/User'
import App from '../screens/App'
import Guest from '../screens/App/screens/Guest'
import Welcome from '../screens/App/screens/Guest/screens/Welcome'
import PrivacyPolicy from '../screens/App/screens/Guest/screens/PrivacyPolicy'
import Logged from '../screens/App/screens/Logged'
import Home from '../screens/App/screens/Logged/screens/Home'
import Matches from '../screens/App/screens/Logged/screens/Matches'
import Match from '../screens/App/screens/Logged/screens/Matches/screens/Match'
import User from '../screens/App/screens/Logged/screens/User'
import History from '../screens/App/screens/Logged/screens/History'
import Comments from '../screens/App/screens/Logged/screens/Comments'
import Settings from '../screens/App/screens/Logged/screens/Settings'
import Data from '../data'

Router.prototype.componentWillReceiveProps = function (nextProps) {
  const components = [];
  function grabComponents(element) {
    // This only works for JSX routes, adjust accordingly for plain JS config
    if (element.props && element.props.component) {
      components.push(element.props.component);
    }
    if (element.props && element.props.children) {
      React.Children.forEach(element.props.children, grabComponents);
    }
  }
  grabComponents(nextProps.routes || nextProps.children);
  components.forEach(React.createElement); // force patching
}

const clearRecsOnPageEnterOrReload = (nextState, replace, callback) => {
  Data.clearRecs().then(() => callback())
}

const isProduction = process.env.NODE_ENV === 'production'
const gaCode = isProduction ? 'UA-60241080-4' : 'UA-000000-1'

ReactGA.initialize(gaCode, {
  debug: false,
});

const logPageView = () => {
  ReactGA.set({ page: window.location.pathname })
  ReactGA.pageview(window.location.pathname)
}

const Root = () => (
  <Provider currentUser={new UserModel()}>
    <Router history={browserHistory} onUpdate={logPageView}>
      <Route path="privacy-policy" component={PrivacyPolicy} />
      <Route path="/" component={App} onEnter={clearRecsOnPageEnterOrReload}>
        <Route component={Guest}>
          <Route path="welcome" component={Welcome} />
        </Route>
        <Route component={Logged}>
          <Route path="home" component={Home} />
          <Route path="matches" component={Matches}>
            <Route path=":matchId" component={Match} />
          </Route>
          <Route path="history" component={History} />
          <Route path="discussion" component={Comments} />
          <Route path="profile-edit" component={Settings} />
          <Route path="users/:userId" component={User} />
        </Route>
      </Route>
    </Router>
  </Provider>
)

export default Root
