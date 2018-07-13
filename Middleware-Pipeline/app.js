// Dependencias
const fetch = require("node-fetch");
const Botkit = require("botkit");
const Q = require('q');
const ejs = require('ejs');
const Mailgun = require('mailgun-js');
const moment = require('moment')
const DiscoveryV1 = require('watson-developer-cloud/discovery/v1');
require('dotenv').load();
firebase = require('./firebase')

// Variables
var _context = { timezone: "America/Caracas" };
let watsonDataAux;

// Declaración del servicio de IBM Watson Discovery
const discovery = new DiscoveryV1({
  username: process.env.DISCOVERY_USERNAME,
  password: process.env.DISCOVERY_PASSWORD,
  version_date: '2018-03-05'
});

var middleware = require('botkit-middleware-watson')({
  username: process.env.CONVERSATION_USERNAME,
  password: process.env.CONVERSATION_PASSWORD,
  workspace_id: process.env.WORKSPACE_ID,
  url: process.env.CONVERSATION_URL || 'https://gateway.watsonplatform.net/conversation/api',
  version_date: '2017-05-26'
});

// Funciones

/**
 * Ejecuta la acción correspondiente de acuerdo a la información recibida de IBM Watson Assistant
 * 
 * @param {*} bot 
 * @param {*} message 
 */
var processWatsonResponse = function (bot, message) {
  let deffered = Q.defer();
  console.log("********** PRIMERA FASE **********");
  console.log("Mensaje Recibido de canal con éxito: ", message);

  let responseJson = message.watsonData;
  console.log("RESPUESTA DE WATSON ASSISTANT", responseJson)
  if (message.channel === "webhook") { watsonDataAux = message.watsonData }

  if (responseJson && responseJson.hasOwnProperty("output")) {
    if (
      responseJson.output.hasOwnProperty("action") &&
      responseJson.output.action[0].name == "buscarCertificados"
    ) {
      console.log(
        "-----------------------------Action type: buscarCertificados------------------------------ "
      );
      let carnet = Number(responseJson.output.action[0].parameters.carnet);

      console.log("ESTE ES EL CARNET:", carnet);

      firebase.buscarCertificados(carnet).then(respuesta => {
        console.log("PRUEEEEEEEEEEEB", respuesta)
        let contextDelta = {
          certificadosDeCarrera: respuesta[0].certificadosArray,
          username: respuesta[0].username,
          carrera: respuesta[0].carrera
        };
        console.log('contextDelya', contextDelta)
        message.watsonData.context.certificadosDeCarrera = respuesta[0].certificadosArray
        message.watsonData.context.username = respuesta[0].username
        message.watsonData.context.carrera = respuesta[0].carrera
        console.log("Nuevo mensaje enrriquecido, propiedad watsonData: ", message.watsonData);
        let newMessage = message
        newMessage.text = 'callback'
        middleware.sendToWatsonAsync(bot, newMessage, contextDelta).then(function () {
          console.log("MEEEEEENSAJEEEEEE", message.watsonData)
          bot.reply(message, message.watsonData.output.text.join('\n'))
          console.log("Enviado", message)
        })
      }).catch(err => {

        message.watsonData.context.callbackError = err
        middleware.sendToWatsonAsync(bot, message, message.context).then(function () {
          bot.reply(message, message.watsonData.output.text.join('\n'))

        })
      })

    } else if (
      responseJson.output.hasOwnProperty("action") &&
      responseJson.output.action[0].name == "buscarSalon"
    ) {
      console.log(
        "-----------------------------Action type: buscarSalon------------------------------ "
      );

      let horario
      let _asignatura = responseJson.output.action[0].parameters.asignatura
      let carnet = Number(responseJson.output.action[0].parameters.carnet);
      let isProfessor = responseJson.output.action[0].parameters.isProfessor;
      console.log("ESTE ES EL CARNET: ", carnet);
      console.log("ASIGNATURA A BUSCAR: ", _asignatura);

      firebase.buscarsalon(_asignatura, carnet, isProfessor).then(respuesta => {

        console.log('respuesta', respuesta)

        message.watsonData.context.resultados = respuesta.resultados
        message.watsonData.context.resultado = respuesta.resultado
        message.watsonData.context.noSectionFound = respuesta.noSectionFound || null;
        message.watsonData.context.noProfessorFound = respuesta.noProfessorFound || null;
        message.watsonData.context.username = respuesta.username || null;

        let contextDelta = respuesta
        console.log('newContext', contextDelta)
        let newMessage = message
        newMessage.text = 'callback'
        middleware.sendToWatsonAsync(bot, newMessage, contextDelta).then(function () {
          console.log("MEEEEEENSAJEEEEEE", message.watsonData)
          bot.reply(message, message.watsonData.output.text.join('\n'))
          console.log("Enviado", message)
        })

      }).catch(err => {

        message.watsonData.context.callbackError = err;

        middleware.sendToWatsonAsync(bot, message, message.context).then(function () {
          watsonDataAux = message.watsonData;
          bot.reply(message, message.watsonData.output.text.join('\n'))
        })

      })

    } else if (
      responseJson.output.hasOwnProperty("action") &&
      responseJson.output.action[0].name == "enviarCorreo"
    ) {
      console.log("-----------------------------Action type: enviarCorreo------------------------------ ");
      bot.reply(message, message.watsonData.output.text.join("\n"));
      let _asignatura = responseJson.output.action[0].parameters.asignatura;
      let carnet = Number(responseJson.output.action[0].parameters.carnet);
      let subject = responseJson.output.action[0].parameters.asunto;
      let mensaje = responseJson.output.action[0].parameters.mensaje;
      let mailDay;
      if (responseJson.output.action[0].parameters.mailDay) {
        let fecha = responseJson.output.action[0].parameters.fecha
        fecha = moment(fecha).format("ddd, DD MMM YYYY")
        let hora = responseJson.output.action[0].parameters.hora
        console.log("ESTA ES LA FECHA", fecha)
        console.log("ESTA ES LA HORA", hora)
        mailDay = fecha.concat(" ", hora, " GMT")
      } else {
        mailDay = moment(Date.now()).add(30, 's').toDate(); 
        mailDay = moment(mailDay).format("ddd, DD MMM YYYY H:mm:ss").concat(" GMT");
      }
      //mailDay = moment(mailDay).format("ddd, DD MMM YYYY H:mm");
      console.log("ESTE ES MAIL DAY", mailDay);
      console.log("ESTE ES SUBJETC", subject);
      console.log("ESTE ES MENSAJE", mensaje);
      console.log("ESTA ES ASIGNATURA", _asignatura);
      console.log("ESTE ES EL CARNET:", carnet);
      // TODO: MANEJAR ERRORES DE FECHA QUE SE PASA DEL MÁXIMO DE DIAS
      firebase.mailUsers(carnet, _asignatura)
        .then(function (retornoPromesa) {
          // Crear la lista de correos
          let listaEstudiantes = retornoPromesa.listaEstudiantes
          let profesorFullName = retornoPromesa.profesorFullName
          console.log("ëste es el professorFM", profesorFullName)
          if (profesorFullName && listaEstudiantes && listaEstudiantes.length>0) // Significa que si existe el  y tiene estudiantes
          {
            console.log("ESTA ES LA LISTA DE ESTUDIANTES", listaEstudiantes);
            var mailing = mailCreator(listaEstudiantes, mensaje, _asignatura);
            // para cada usuario de la lista configura un email a enviar
            for (var i = 0; i < mailing.length; i++) {
              console.log("RECORRIENDO LISTA", i)
              // envía el email a cada usuario con su template personalizado de ejs
              mailSender(mailing[i].user, subject, mailing[i].html, mailDay, mensaje, profesorFullName)
                .then(function (res) {
                  console.log("MENSAJE ENVIADO", res);
                })
                .catch(function (err) {
                  console.log("ERROR AL ENVIAR MENSAJE: " + err)
                  message.watsonData.context.errorEnviando = true;
                })
            }
            message.watsonData.context.confirmation = true
            middleware.sendToWatsonAsync(bot, message, message.context).then(function () {
              bot.reply(message, message.watsonData.output.text.join('\n'))
            })
          } else {
            message.watsonData.context.errorCallback = true
            middleware.sendToWatsonAsync(bot, message, message.context).then(function () {
              bot.reply(message, message.watsonData.output.text.join('\n'))
            })
          }
        }).catch(err => {
          message.watsonData.context.errorCallback = true
          middleware.sendToWatsonAsync(bot, message, message.context).then(function () {
            bot.reply(message, message.watsonData.output.text.join('\n'))
          })
        })
    } else if (
      responseJson.output.hasOwnProperty("action") &&
      responseJson.output.action[0].name == "recordatorio"
    ) {
      console.log("-----------------------------Action type: recordatorios------------------------------ ");
      let fecha = responseJson.output.action[0].parameters.fecha
      fecha = moment(fecha).format("ddd, DD MMM YYYY")
      let evento = responseJson.output.action[0].parameters.evento
      let hora = responseJson.output.action[0].parameters.hora
      let carnet = Number(responseJson.output.action[0].parameters.carnet)
      let persona = responseJson.output.action[0].parameters.persona
      console.log("ESTA ES EL CARNET", carnet)
      console.log("ESTA ES LA FECHA", fecha)
      console.log("ESTA ES LA HORA", hora)
      console.log("ESTE ES EL EVENTO", evento)
      console.log("ESTA ES LA PERSONA", persona)

      let horaEnvio = fecha.concat(" ", hora, " GMT")
      console.log("ENVIARRRR", horaEnvio)
      let subject = "Recordatorio"
      firebase.buscarCorreo(persona, carnet).then(email => {
        console.log(email)
        if (email) {
          tiempo = moment(horaEnvio).format("ddd, DD MMM YYYY H:mm")
          var mailing = reminderCreator(email, evento, tiempo);
          mailSender(mailing[0].user, subject, mailing[0].html, horaEnvio, evento, "recordatorio")
            .then(function (res) {
              console.log("MENSAJE ENVIADO", res);
              message.watsonData.context.success = true
              middleware.sendToWatsonAsync(bot, message, message.context).then(function () {
                bot.reply(message, message.watsonData.output.text.join('\n'))
              })
            })
            .catch(function (err) {
              console.log("ERROR AL ENVIAR MENSAJE: " + err)
              message.watsonData.context.errorEnviando = true;
              middleware.sendToWatsonAsync(bot, message, message.context).then(function () {
                bot.reply(message, message.watsonData.output.text.join('\n'))
              })
            })

        } else {
          console.log("No hay correo")
          message.watsonData.context.errorCorreo = true
          message.watsonData.context.errorMensaje = "No se encontró un correo para el carnet indicado, intente más tarde"
          middleware.sendToWatsonAsync(bot, message, message.context).then(function () {
            bot.reply(message, message.watsonData.output.text.join('\n'))
          })
        }
      })
    } else if (
      responseJson.output.hasOwnProperty("action") &&
      responseJson.output.action[0].name == "buscarElectivas"
    ) {
      console.log("-----------------------------Action type: Electivas------------------------------ ");
      let trimestre = responseJson.output.action[0].parameters.trimestre || "1718-3"
      let tipoElectivas = responseJson.output.action[0].parameters.tipoElectiva
      //responseJson.output.action[0].parameters.trimestre ? trimestre=responseJson.output.action[0].parameters.trimestre : tipoElectivas=responseJson.output.action[0].parameters.trimestreActual
      console.log("TRIMESTRE ", trimestre, " Tipo ELECTIVCAS", tipoElectivas)

      firebase.buscarElectivas(trimestre, tipoElectivas).then(resultado => {
        console.log("Hacer Listaaaa", resultado)
        message.watsonData.context.listaElectivas = resultado
        message.watsonData.context.trimestre = trimestre
        console.log("WAAAATSON", message.watsonData)

        middleware.sendToWatsonAsync(bot, message, message.context).then(function () {
          bot.reply(message, message.watsonData.output.text.join('\n'))
        })
      }).catch(err => {
        message.watsonData.context.errorCallback = true;
        middleware.sendToWatsonAsync(bot, message, message.context).then(function () {
          bot.reply(message, message.watsonData.output.text.join('\n'))
        })
      })

    } else if (
      responseJson.output.hasOwnProperty("action") &&
      responseJson.output.action[0].name == "discovery"
    ) {
      console.log("Voy a llamar a discovery")
      // ------------------------------------ LLAMADA A DISCOVERY --------------------------------------
      let discoveryURL = 'https://gateway.watsonplatform.net/discovery/api/v1/environments/38e40c79-a07a-4892-b890-509a259fc9ff/collections/6e065ebb-4708-4ae5-a1ca-0b030e1b17ef/query?version=2017-11-07&deduplicate=false&highlight=true&passages=true&passages.count=5&natural_language_query=informacion%20estadistica'

      let requestJson = JSON.stringify({
        username: process.env.DISCOVERY_USERNAME,
        password: process.env.DISCOVERY_PASSWORD,
        //natural_language_query: message.watsonData.output.text
      })


      queryOptions = {
        environment_id: process.env.ENVIRONMENT_ID,
        collection_id: process.env.COLLECTION_ID,
        natural_language_query: message.watsonData.input.text,
        passages: true,
      }

      //queryOptions['passages.fields']='description,text';
      queryOptions['passages.count'] = 3;
      queryOptions['passages.characters'] = 1000


      discovery.query(queryOptions, function (err, data) {
        if (err) {
          message.watsonData.output.action = []
          bot.reply(message, message.watsonData.output.text.join('\n'))
          console.log(err);
        } else {
          console.log("data", data)
          var i = 0;
          var discoveryResults = [];
          while (data.passages[i] && i < 3) {
            let body = data.passages[i].passage_text;
            discoveryResults[i] = {
              body: body,
              bodySnippet: (body.length < 144 ? body : ('...' + body.substring(333, 666) + '...')).replace(/<\/?[a-zA-Z]+>/g, ''),
              confidence: data.passages[i].passage_score,
              id: data.passages[i].document_id,
              title: data.results[0].extracted_metadata.filename.replace(".pdf", '')
            };
            i++;
            //bodySnippet: (body.length < 144 ? body : (body.substring(0, 144) + '...')).replace(/<\/?[a-zA-Z]+>/g, ''),
            //sourceUrl: data.results[i].sourceUrl,
          }

          message.watsonData.output.discoveryResults = discoveryResults;
          middleware.sendToWatsonAsync(bot, message, message.context).then(function () {
            bot.reply(message, message.watsonData.output.text.join('\n'))
          })
        }
      });
    } else {
      bot.reply(message, message.watsonData.output.text.join('\n'))
    }
    deffered.resolve(message);
  } else {
    bot.reply(message, "Error en conexión \n")
    deffered.resolve(message);
  }
  return deffered.promise;
}

/**
 * Customiza el correo a enviar
 * 
 * @param {array} listaEstudiantes 
 */
const reminderCreator = function (email, evento, tiempo) {
  var mailingList = []
  // Extraer un template de html
  tiempoAux = moment(tiempo).format("H:mm:ss DD/MM/YY")

  ejs.renderFile(__dirname + '/emailTemplates/recordatorio.ejs', {
    nombre: email[0].nombre,
    mensaje: evento,
    tiempo: tiempo

  }, (err, _html) => {
    if (err) console.log(err)
    else if (_html) {
      console.log("Html generado");
      mailingList.push({
        user: email[0].correo,
        html: _html
      });
    }
  });

  return mailingList;
}

/**
 * Customiza un poco la lista de correos a enviar
 * 
 * @param {array} listaEstudiantes 
 */
const mailCreator = function (listaEstudiantes, mensaje, _asignaruta) {
  var mailingList = [];
  for (var i = 0; i < listaEstudiantes.length; i++) {
    // Extraer un template de html
    ejs.renderFile(__dirname + '/emailTemplates/correo.ejs', {
      nombre: listaEstudiantes[i].nombre,
      mensaje: mensaje,
      asignatura: _asignaruta

    }, (err, _html) => {
      if (err) console.log(err)
      else if (_html) {
        console.log("Html generado");
        mailingList.push({
          user: listaEstudiantes[i].correo,
          html: _html
        });
      }
    });
  }

  return mailingList;
}

/**
 * 
 * @param {string} userEmail 
 * @param {string} subject 
 * @param {string} _html 
 * @param {Date} mailDay 
 * @param {string} mensaje 
 * @param {string} profesorFullName 
 */
const mailSender = function (userEmail, subject, _html, mailDay, mensaje, profesorFullName) {
  // setup promises
  var deffered = Q.defer();
  // create new mailgun instance with credentials
  var mailgun = new Mailgun({
    apiKey: process.env.mailgun_api,
    domain: process.env.mailgun_domain
  });
  // setup the basic mail data
  let fromName = profesorFullName.replace(/ /g, '')
  console.log("Este es el nombre completo: ", fromName)
  mailDay = moment(mailDay).utcOffset(240).format("ddd, DD MMM YYYY H:mm:ss z")
  console.log("Esta es la hora de envío", mailDay)
  var mailData = {
    from: fromName + "@unimetbot.edu.ve",
    to: userEmail,
    subject: subject,
    html: _html,
    // two other useful parameters
    // testmode lets you make API calls
    // without actually firing off any emails
    'o:testmode': false,
    // you can specify a delivery time
    // up to three days in advance for
    // your emails to send.
    'o:deliverytime': mailDay// 'Thu, 13 Oct 2011 18:02:00 GMT' TODO: EXTRAER FECHA Y PARSEARLA AL FORMATO CORRECTO
  };
  // send your mailgun instance the mailData
  mailgun.messages().send(mailData, function (err, body) {
    // If err console.log so we can debug
    if (err) {
      console.log('failed: ' + err)
      deffered.reject(err);
    } else {
      deffered.resolve(body)
    }
  });

  return deffered.promise;
};




module.exports.main = function (app, webController) {

  if (process.env.USE_SLACK) {
    var Slack = require('./bot-slack');
    Slack.controller.middleware.receive.use(middleware.receive);
    Slack.bot.startRTM();
    console.log('Slack bot is live');
  }
  if (process.env.USE_FACEBOOK) {
    var Facebook = require('./bot-facebook');
    Facebook.controller.middleware.receive.use(middleware.receive);
    Facebook.controller.createWebhookEndpoints(app, Facebook.bot);
    console.log('Facebook bot is live');
  }
  if (process.env.USE_TWILIO) {
    var Twilio = require('./bot-twilio');
    Twilio.controller.middleware.receive.use(middleware.receive);
    Twilio.controller.createWebhookEndpoints(app, Twilio.bot);
    console.log('Twilio bot is live');
  }

  // Configura controlador web para que use la funci'on de procesamiento para el flujo de información
  webController.middleware.receive.use(middleware.receive);
  // Personaliza el mensaje del sistema bot web antes de enviarlo
  webController.middleware.send.use(function (bot, message, next) {

    message.watsonResponseData = watsonDataAux;

    console.log("MENSAJE QUE DE LA FUNCION SEND: ", message)
    console.log("watsonDataAux FUNCION SEND:   ", watsonDataAux)
    next();
  });

  // Arranca el sistema bot para procesar los webhooks y websockets cada 1.5 segundos (lo despierta para evitar lag)
  webController.startTicking();
  // Configura el sistema bot web para accionarse al evento de mensaje entrante
  webController.hears(['.*'], 'message_received', function (bot, message) {
    if (message.watsonError) {
      console.log(message.watsonError);
      bot.reply(message, message.watsonError.description || message.watsonError.error);
    } else if (message.watsonData && 'output' in message.watsonData) {

      return processWatsonResponse(bot, message);

    } else {
      console.log('Error: Se recivió un mensaje con el formato erroneo. Verificar conexión con IBM watson');
      bot.reply(message, "Lo sentimos, pero por razones técnicas no podemos atenderle en estos momentos.");
    }

  });



  // Customize your Watson Middleware object's before and after callbacks.
  middleware.before = function (message, conversationPayload, callback) {
    console.log("Before message", message)
    if (message.channel === 'webhook') {
      let webMessage = message;
      if (conversationPayload) {
        if (webMessage.context.conversation_id) {
          //  conversationPayload.context = {};
          //conversationPayload.context.system = webMessage.context.system;
          //conversationPayload.context.conversation_id = webMessage.context.conversation_id;
          conversationPayload.context = webMessage.context;
          console.log("-----------------QUE CARAJO TIENE EL PAYLOAD QUE VA PA WATSON", conversationPayload)

        }
      }
    }
    callback(null, conversationPayload);
  }

  middleware.after = function (message, conversationResponse, callback) {
    //processWatsonResponse(message, conversationResponse, callback);
    //watsonDataAux = conversationResponse;
    callback(null, conversationResponse);
  }

};

module.exports.processWatsonResponse = processWatsonResponse

