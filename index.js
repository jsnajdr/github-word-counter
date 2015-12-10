"use strict";

var express = require('express');
var axios = require('axios');
var mkdirp = require('mkdirp');
var path = require('path');
var fs = require('fs');
var format = require('util').format;

var cacheDir = './cache';
mkdirp.sync(cacheDir);

function isShortWord(word) {
  if (word.length == 1) {
    return false;
  }

  if (/^\d+$/.test(word)) {
    return false;
  }

  if (/^(bug|at|an|or|on|if|in|is|it|with|as|of|to|the|from|and|for|not|are)$/i.test(word)) {
    return false;
  }

  return true;
}

function computeStats(user, repo, commits) {
  var messages = commits.map(function(item) {
    return item.commit.message;
  });

  var words = messages.reduce(function(accu, msg) {
    var w = msg.match(/\w+/g);
    return accu.concat(w);
  }, []);

  var filteredWords = words.filter(isShortWord);

  var freqs = filteredWords.reduce(function(accu, word) {
    if (accu[word]) {
      accu[word] += 1;
    } else {
      accu[word] = 1;
    }

    return accu;
  }, {});

  var stats = [];

  for (var w in freqs) {
    if (freqs.hasOwnProperty(w)) {
      stats.push({ word: w, count: freqs[w] });
    }
  }

  var sortedStats = stats.sort(function(a, b) {
    return b.count - a.count
  });

  return {
    repo: [ user, repo ].join('/'),
    log: messages,
    stats: sortedStats
  };
}

var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

app.get('/api/:user/:repo', function(req, res) {
  var user = req.params.user;
  var repo = req.params.repo;

  var cacheFileName = path.join(cacheDir, format("%s.%s.json", user, repo));
  var url = format('https://api.github.com/repos/%s/%s/commits', user, repo);

  var req = axios.get(url, {
    headers: { 'User-Agent': 'Commit Word Counter 0.1' }
  });

  req.then(function(response) {
    fs.writeFileSync(cacheFileName, JSON.stringify(response.data));
    return response.data;
  }).catch(function(err) {
    try {
      var cachedData = fs.readFileSync(cacheFileName, { encoding: 'utf8' });
      return JSON.parse(cachedData);
    } catch (ex) {
      throw err;
    }
  }).then(function(data) {
    var stats = computeStats(user, repo, data);

    res.json(stats);
  }).catch(function(err) {
    var msg = err instanceof Error ?
      err.message :
      'status code ' + err.status + ' ' + err.statusText;

    res.json({ error: msg });
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
