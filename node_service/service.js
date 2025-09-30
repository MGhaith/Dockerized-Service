require('dotenv').config();
const express = require('express');
const basicAuth = require('basic-auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

function checkAuth(req, res, next) {
  const user = basicAuth(req);
  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPass = process.env.BASIC_AUTH_PASS;

  // Log the provided credentials to the web console
  console.log('Auth attempt - User:', user ? user.name : 'none', 'Pass:', user ? user.pass : 'none');

  if (!user || !user.name || !user.pass) {
    res.set('WWW-Authenticate', 'Basic realm="Protected"');
    return res.status(401).send('Authentication required.');
  }

  if (user.name === expectedUser && user.pass === expectedPass) {
    console.log('Auth success for user:', user.name);
    return next();
  } else {
    console.log('Auth failed - expected:', expectedUser, '/', expectedPass, 'got:', user.name, '/', user.pass);
    res.set('WWW-Authenticate', 'Basic realm="Protected"');
    return res.status(401).send('Invalid credentials.');
  }
}

app.get('/secret', checkAuth, (req, res) => {
  res.send(process.env.SECRET_MESSAGE || 'No secret configured.');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
