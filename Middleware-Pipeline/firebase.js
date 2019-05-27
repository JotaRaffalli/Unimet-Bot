
const admin = require('firebase-admin');
const Q = require('q');

// Inicialización de Firebase
admin.initializeApp({
    credential: admin.credential.cert({
        // Add Env var with credentials here Ei > unimet.bot firebaseapp
    }),
    databaseURL: 'https://tesis-unimetbot.firebaseio.com/'
});

// Referencias a Firebase Realtime Database
var db = admin.database();
var refAsignaturas = db.ref("asignatura");
var refProfesores = db.ref("profesores");
var refDepartamentos = db.ref("departamentos");
var refDocumentos = db.ref("documentos");
var refEscuelas = db.ref("escuelas");
var refEstudiantes = db.ref("estudiantes");
var refRecordatorios = db.ref("recordatorios");
var refSecciones = db.ref("secciones");
var refCarreras = db.ref("carreras");
var refElectivas = db.ref("electivas");

/**
* Busca los certificados que un estudiante puede conseguir
* 
* @param {number} carnet 
*/
const buscarCertificados = function (carnet) {

    var deffered = Q.defer()

    let certificadosArray = [];
    let userFullName = [];

    refEstudiantes
        .orderByChild("carnet")
        .equalTo(carnet)
        .on("value", function (snapshot) {
            if (snapshot.val() !== null) {
                //user exists, do something
                let carrera = snapshot.child(carnet).val().carrera;
                userFullName = snapshot
                    .child(carnet)
                    .val()
                    .nombre.split(" ") || null;
                let username = userFullName[0];

                refCarreras
                    .orderByChild("nombre")
                    .equalTo(carrera)
                    .on("value", function (snapshot2) {
                        if (snapshot.val() !== null) {
                            let certfJSON = snapshot2
                                .child(carrera)
                                .val().certificados;
                            let keys = Object.keys(certfJSON);
                            for (var i = 0; i < keys.length; i++) {
                                let k = keys[i];
                                let nombreCert = certfJSON[k].nombre;
                                certificadosArray.push(nombreCert);
                            }
                            respuesta = []
                            respuesta.push({
                                certificadosArray: certificadosArray,
                                username: username,
                                carrera: carrera
                            })
                            console.log("retorno")
                            deffered.resolve(respuesta)
                        } else {
                            deffered.reject("No se contro carrera del estudiante en referencia de carreras.")
                        }
                    }, function (error2) {
                        // The callback failed.
                        deffered.reject(error2)
                    }
                    );
            } else {
                deffered.reject("Vaya! Al parecer no hay ningún estudiante con ese carnet, por favor intentelo de nuevo más tarde.")
            }
        }, function (error1) {
            // The callback failed.
            deffered.reject(error1)
        }
        );
    return deffered.promise
}

/**
 * Busca el salón y horario de una asignatura en particular
 * 
 * @param {string} _asignatura 
 * @param {number} carnet 
 * @param {boolean} isProfessor 
 */
const buscarsalon = function (_asignatura, carnet, isProfessor) {

    let userFullName = []
    let resultado
    let resultados = []
    var deffered = Q.defer()
    let respuesta = {}

    if (isProfessor) {
        refProfesores
            .orderByChild("carnet")
            .equalTo(carnet)
            .on(
                "value",
                function (snapshot) {
                    if (snapshot.val() !== null) {
                        userFullName = snapshot.child(carnet).val().nombre.split(" ") || null;
                        let username = userFullName[0];
                        respuesta.username = username || null;
                        let seccionesJSON = snapshot.child(carnet).val().secciones;
                        let keys = Object.keys(seccionesJSON);
                        for (var i = 0; i < keys.length; i++) {
                            let k = keys[i];
                            if (seccionesJSON[k].asignatura == _asignatura) {
                                console.log("Se encontro asignatura")
                                resultados.push(seccionesJSON[k].aula + ' - ' + seccionesJSON[k].horario)
                            }
                        }
                        if (resultados.length > 1) {
                            respuesta.resultados = resultados
                        }
                        else {
                            respuesta.resultado = resultados[0]
                        }

                        if (resultados.length == 0) {
                            respuesta.noSectionFound = true;
                        }

                        deffered.resolve(respuesta)

                    }
                    else {
                        respuesta.noProfessorFound = true;
                        deffered.resolve(respuesta)
                    }
                },
                function (error1) {
                    // The callback failed.
                    console.error("ERROR Q1 NO SE ENCONTRO PROFESOR : ", error1);
                    deffered.reject(error1)
                }
            );
    }
    else {
        refSecciones.
            orderByChild("asignatura").
            on("value", function (snapshot) {
                if (snapshot.val() !== null) {
                    snapshot.forEach(function (data) {
                        if (data.val().asignatura == _asignatura) {
                            resultados.push(data.val().aula + ' - ' + data.val().horario)
                            console.log("Se encontro asignatura")
                        }

                        console.log("Seccion:  " + data.key + " aula:  " + data.val().aula);
                    });

                    if (resultados.length > 1) {
                        respuesta.resultados = resultados
                    }
                    else {
                        respuesta.resultado = resultados[0]
                    }
                    if (resultados.length == 0) {
                        respuesta.noSectionFound = true;
                    }
                    deffered.resolve(respuesta)
                }
                else {
                    respuesta.noSectionFound = true;
                    deffered.resolve(respuesta)
                }
            },
                function (error2) {
                    // The callback failed.
                    console.error("ERROR Q1 NO SE ENCONTRO ESTUDIANTE : ", error2);
                    deffered.reject(error2)
                }
            );
    }

    return deffered.promise

}

/**
 * Genera una lista de electivas de acuerdo al trimestre donde se dictan y su tipo
 * 
 * @param {string} trimestre 
 * @param {string} tipoElectivas 
 */
const buscarElectivas = function (trimestre, tipoElectivas) {
    lista = []
    var deffered = Q.defer()
    refElectivas.child(trimestre).orderByKey().startAt(tipoElectivas).endAt(tipoElectivas + "\uf8ff").on("value", function (snapshot) {
        if (snapshot.val() !== null) {
            resultado = snapshot.val();
            let keys = Object.keys(resultado);
            for (var z = 0; z < keys.length; z++) {
                let k = keys[z];
                lista.push(
                    resultado[k].nombre
                );
            }
            deffered.resolve(lista)
        } else {
            deffered.reject(null)
        }
    }, function (error) {
        // The callback failed.
        console.error("ERROR NO SE HALLARON ELECTIVAS : ", error1);
        deffered.reject(console.log('failed: ' + error1));
    });
    return deffered.promise
}

/**
 * Busca el correo de una personaen particular
 * 
 * @param {string} persona 
 * @param {number} carnet 
 */
const buscarCorreo = function (persona, carnet) {
    var deffered = Q.defer();
  
    var email = []
    if (persona == "Profesor") {
      console.log("Entro a Profesor", carnet)
      refProfesores.orderByChild("carnet")
        .equalTo(carnet)
        .on(
          "value",
          function (snapshot) {
            console.log(snapshot.val())
            if (snapshot.val() !== null) {
              let key = Object.keys(snapshot.val())
              console.log(key)
              console.log("correo", snapshot.child(key).val().correo)
  
              email.push(
                {
                  correo: snapshot.child(key).val().correo,
                  nombre: snapshot.child(key).val().nombre
                })
              deffered.resolve(email)
            } else {
              console.log("nulo")
              deffered.resolve(null)
            }
          }, function (err) {
            console.log(err)
            deffered.resolve(null)
          }); //TODO: ERROR HANDLING;
    } else {
      console.log("Entro a Estudiantes")
      refEstudiantes.orderByChild("carnet")
        .equalTo(carnet)
        .on(
          "value",
          function (snapshot) {
            console.log(snapshot.val())
            if (snapshot.val() !== null) {
              let key = Object.keys(snapshot.val())
              console.log(key)
              console.log("correo", snapshot.child(key).val().correo)
  
              email.push(
                {
                  correo: snapshot.child(key).val().correo,
                  nombre: snapshot.child(key).val().nombre
                })
              deffered.resolve(email)
            } else {
              console.log("nulo")
              deffered.resolve(null)
            }
          }, function (err) {
            console.log(err)
            deffered.resolve(null)
          });//TODO: ERROR HANDLING;
  
    }
    return deffered.promise
  }

 /**
 * Extrae lista de alumnos de una asignatura en particular
 * 
 * @param {number} carnet 
 * @param {string} _asignatura 
 */
const mailUsers = function (carnet, _asignatura) {

    let listaEstudiantes = null;
    var deffered = Q.defer();
  
    refProfesores.orderByChild("carnet").equalTo(carnet).on("value", function (snapshot) {
      if (snapshot.val() !== null) {
        let seccionesJSON = snapshot.child(carnet).val().secciones;
        let profesorFullName = snapshot.child(carnet).val().nombre
        let keys = Object.keys(seccionesJSON);
        let listaEstudiantes =[]
        for (var i = 0; i < keys.length; i++) {
          let k = keys[i];
          if (seccionesJSON[k].asignatura == _asignatura) {
            let estudiantesJSON = seccionesJSON[k].estudiantes;
            let keys2 = Object.keys(estudiantesJSON);
            for (var z = 0; z < keys2.length; z++) {
              let k2 = keys2[z];
              listaEstudiantes.push(
                {
                  correo: estudiantesJSON[k2].correo,
                  nombre: estudiantesJSON[k2].nombre
                }
              );
            }
          }
        }
        let retornoPromesa = {
          listaEstudiantes: listaEstudiantes,
          profesorFullName: profesorFullName
        }
  
        deffered.resolve(retornoPromesa);
      }
      else {
        // No se encontró profesor con ese carnet
        //message.watsonData.context.isProfessor = false;
        // Avisa a watson que hubo un error
        /* middleware.sendToWatsonAsync(bot, message, message.context).then(function () {
           bot.reply(message, message.watsonData.output.text.join('\n'))
           deffered.reject(message.watsonData.context.isProfessor);
         })*/
        deffered.reject("Not found")
      }
    },
      function (error1) {
        // The callback failed.
        console.error("ERROR Q1 NO SE ENCONTRO PROFESOR : ", error1);
        deffered.reject(console.log('failed: ' + error1));
  
      });
    return deffered.promise;
  };
   
  module.exports = {
    buscarCertificados: buscarCertificados,
    buscarsalon: buscarsalon,
    buscarElectivas: buscarElectivas,
    buscarCorreo: buscarCorreo,
    mailUsers: mailUsers
  }
