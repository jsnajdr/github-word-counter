import express from 'express';
import axios from 'axios';
import mkdirp from 'mkdirp';
import path from 'path';
import fs from 'fs';
import { format } from 'util';

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
  var messages = commits.map(item => item.commit.message);

  var words = messages.reduce((accu, msg) => accu.concat(msg.match(/\w+/g)), []);

  var filteredWords = words.filter(isShortWord);

  var freqs = new Map();
  filteredWords.forEach(function(word) {
    var prevValue = freqs.get(word) || 0;
    freqs.set(word, prevValue + 1);
  });

  var stats = [];

  for (let w of freqs.entries()) {
    stats.push({ word: w[0], count: w[1] });
  }

  var sortedStats = stats.sort((a, b) => b.count - a.count);

  return {
    repo: [ user, repo ].join('/'),
    stats: sortedStats
  };
}

var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

app.get('/api/:user/:repo', function({ params: { user, repo } }, res) {
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
