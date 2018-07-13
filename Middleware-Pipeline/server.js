/**
 * Copyright 2016 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

require('dotenv').load();

var express = require('express');
var bodyParser = require('body-parser');
var verify = require('./security');
var http = require('http');
var webserver  = express();
const Botkit = require("botkit");
const cors = require('cors')

// Botkit web controller
var controller = Botkit.socketbot({});
  
  // Para que funcione con local host
  webserver.use(cors())
  // Para recuperar el body del webhook
  webserver.use(
    bodyParser.json()
  );
  //Twilio body
  webserver.use(bodyParser.urlencoded({ extended: true }));
  
  var port = process.env.PORT || 5000;
  webserver.set("port", port);
  
  var server = http.createServer(webserver);


  // Listen on the specified port
  server.listen(port, function() {
    console.log("Client server listening on port " + port);
  });

  controller.webserver  = webserver;
  controller.httpserver = server;

  require('./routes/normal_webhook')(webserver, controller);

  var main = require('./app').main;
  main(webserver, controller);

  

