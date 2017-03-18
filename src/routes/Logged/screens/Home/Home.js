import './Home.scss';

import React, { Component } from 'react';
import { observer } from 'mobx-react';

import PersonCard from 'Components/PersonCard';

@observer
class Home extends Component {
  constructor(props) {
    super(props);
    this.state = { counter: 0 };
  }

  render() {
    const { recsStore } = this.props;

    if (recsStore.is_fetching) {
      return <h1>Searching</h1>
    }
    return (
      <div className="home">
        <div className="home__settings">
          <div className="home__settings__wrapper">Wrapper</div>
          <div className="home__settings__trigger">
            <i className="fa fa-cog" onClick={this.showSettings} />
          </div>
        </div>
        {this.props.recsStore.allVisible.map((person, i) => (
          <PersonCard key={person._id} person={person} small={i !== 0} />
        ))}
      </div>
    );
  }
}

export default Home;
