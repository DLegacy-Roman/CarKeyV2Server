'use strict';

require('dotenv').config(); // Load .env variables

const express = require('express');
const exphbs = require('express-handlebars');
const smartcar = require('smartcar');

const app = express();
const port = 8000;

// Setup Handlebars view engine
app.engine(
  '.hbs',
  exphbs({
    defaultLayout: 'main',
    extname: '.hbs',
  })
);
app.set('view engine', '.hbs');

// Initialize Smartcar AuthClient
const client = new smartcar.AuthClient({
  clientId: process.env.SMARTCAR_CLIENT_ID,
  clientSecret: process.env.SMARTCAR_CLIENT_SECRET,
  redirectUri: process.env.SMARTCAR_REDIRECT_URI,
  mode: 'simulated',
});

// Global variable to save access token
let access;

app.get('/login', function (req, res) {
  const authUrl = client.getAuthUrl(['required:read_vehicle_info']);

  res.render('home', {
    url: authUrl,
  });
});

app.get('/exchange', async function (req, res) {
  const code = req.query.code;

  try {
    access = await client.exchangeCode(code);
    res.redirect('/vehicle');
  } catch (err) {
    console.error('Error exchanging code:', err);
    res.status(500).send('Authorization failed');
  }
});

app.get('/vehicle', async function (req, res) {
  if (!access || !access.accessToken) {
    return res.redirect('/login');
  }

  try {
    const vehicles = await smartcar.getVehicles(access.accessToken);
    const vehicle = new smartcar.Vehicle(vehicles.vehicles[0], access.accessToken);
    const attributes = await vehicle.attributes();

    res.render('vehicle', {
      info: attributes,
    });
  } catch (err) {
    console.error('Error retrieving vehicle:', err);
    res.status(500).send('Failed to get vehicle info');
  }
});

app.listen(port, () => console.log(`✅ Server running on http://localhost:${port}`));