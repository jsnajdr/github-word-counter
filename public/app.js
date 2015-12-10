import axios from 'axios';
import React from 'react';
import ReactDOM from 'react-dom';
import './app.scss';

function actionSetRepo(repo) {
  var request = axios.get('/api/' + repo);

  request.then(function(response) {
    app.setState({
      repoName: repo,
      wordStats: response.data.stats.slice(0, 20)
    });
  }).catch(function(err) {
    var msg = err instanceof Error ?
      err.message :
      'status code ' + err.status + ' ' + err.statusText;

    console.error('Error while loading repo ' + repo + ': ', msg);
  });
}

var RepoNameForm = React.createClass({
  render: function() {
    return (
      <form className="repoNameForm" onSubmit={this.handleSubmit}>
        <input type="text" ref="name" placeholder={this.props.label}/>
        <button type="submit">Compute</button>
      </form>
    );
  },
  handleSubmit: function(e) {
    e.preventDefault();
    var name = this.refs.name.value.trim();
    if (!name) {
      return;
    }

    actionSetRepo(name);

    this.refs.name.value = '';
  }
});

var RepoName = React.createClass({
  render: function() {
    return (
      <h1>{this.props.name}</h1>
    );
  }
});

var WordStats = React.createClass({
  render: function() {
    return (
      <table className="wordStats">
        <tbody>
          {
            this.props.wordStats.map(function(s) {
              return (
                <tr key={s.word}>
                  <td className="word">{s.word}</td>
                  <td className="count">{s.count}</td>
                </tr>
              );
            })
          }
        </tbody>
      </table>
    );
  }
});

var App = React.createClass({
  getInitialState: function() {
    return {
      repoName: '',
      wordStats: []
    };
  },
  render: function() {
    return (
      <div>
        <RepoNameForm label="Enter repository name"/>
        <RepoName name={this.state.repoName}/>
        <WordStats wordStats={this.state.wordStats}/>
      </div>
    );
  }
});

var app = ReactDOM.render(<App />, document.getElementById('app'));
