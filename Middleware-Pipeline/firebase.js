
const admin = require('firebase-admin');
const Q = require('q');

// Inicialización de Firebase
admin.initializeApp({
    credential: admin.credential.cert({
        "type": "service_account",
        "project_id": "tesis-unimetbot",
        "private_key_id": "ee8e07f198ab014f6f51467461a7651c4553344b",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCotrSLfxdMrQPU\nj/i2BlCvsjC9rzN6FvVojz7E3J60Zmgg9Z9P1q8pUWEVuReMyE+0uoPv80GBeJLv\nHq+5PPDxrpS2dy9wun7CZihpAZhGwsg0Hghdu66oyaaf0fsSk9aGFxdT585UOObX\nZoIjvyVeV0G/Z/uoHsAchtLslbWpO05XrVSmB1Dud8lD9vgECc5v8qQYwxEjg5QU\nm75xEgsyCyTL2dyoNygq3ZygZDqdw3jFqxcht1z/SN1hKz5Q8/TrpivUKHusNOKa\nbaUUjY69A2LncH5VpMnGgMdS61qtWmmFCAhUhr62+hhssZG4fIm9hlWcgFXPsyDx\nDtsIzkBpAgMBAAECggEADegRdbYiG4XfXPQJEifvGqxbbCc23QdrbxTvnZZ51nDi\ngGT+nrwZcBRvJjU9hbM1LrZ5DZxFeACSS/eBkIk/awxy4Z9tX6Nfs3JsPkuNW7fO\nfM1E70T7HpqQi3fpdByPgDoDCD2BOlv+Wx7t9zhYQjB7EOXnTnJKb4+Fb07fzHUe\nksaVV5cbPI0oAF+UZ2I82AKm0XsdvVjvP/wPda+ertNcQ+26eHzjHIiP+flHwbug\nL9q+LZ0FYpP0HCjCvFN3UCvv8J8D3JI1pn04q3QZnPp12eSeKQbCL1qZI+CRheOl\nkn8YxzhPyiC9roXpfdhSVD11yG7rXxqi2FQBEwiuoQKBgQDkw0BOK/ROH0n+QNiu\nlvxMPZ6X/f5mdOWHHrtmrdC+fysyNIVYTlvinhzCplhVynstmjJaMGXXC80njKcJ\nObIuaUYD1V2mIAb2wwbbDBpvmqiLWUBl51TLG1h5/dZwHiEC7G0OHX0lNqndtcQV\npMoHfIZWRsYuHmwHw2RzaBsznQKBgQC8zSTkcVVRTZitpxtoFsXYJmj0Tv61dwtl\n6kBJRf/6mS/8GlDlfW3qNaqN192/t+uaVeONoXUEsMonwAC0nOMDR74T4CIaeNdI\nN/DUDDRTr5K5BQT31/LE2P5i0ycML0Bwos9UhmlHfvYaVbPz49enech0lRn8kQ1h\nQpJb666EPQKBgQCg4Zf14f+ceXDGOMCqeFDTJXrFlcE2OPu6/Sf6XD8z2ad9VWZ5\n5hHE3EGJuwbgvtfGCG1k9CiLBievqsFGQadH8I1m4MVNsbR0ElBd+LMWzgO+jHQ3\ntmrxtDeTA6utieLZdYB0rtR2OW1ZGR3fwta6UR8AyiFSCd8bzpR0fUC0GQKBgCwE\n6IUap3m9TcuvGoS6SoaK7g2IHXrRtqacZ0CuQXB8JuPwfswC4o2o1YscuWbpytTB\nEb0D1/SwA3IhIgj6SzOIlpiruUfSxN7hrBTEg66/UMYylWXzw3aB4U3JTWFZ4vxf\n+VcLv6AbyeV59er3RGCX1FTaLqTkbOowS0+DM71BAoGBAJ/x/T0ZIuUZ5+BCCcbO\nhp3Khbwhkn3n+EPmoniUJt4H7T/eWRjBhqRnitnqOXwBD8Jqb3mehutcDNPTqctw\nGDSiHW+9ImNcG9rd6gkqSHlIsd1iY3+CT2SEAfamxDuxc4vLQWUqPYXGH3QZOWLK\nqdYniyVDKra8sR0121lzb642\n-----END PRIVATE KEY-----\n",
        "client_email": "firebase-adminsdk-qsc94@tesis-unimetbot.iam.gserviceaccount.com",
        "client_id": "109175614158571581444",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://accounts.google.com/o/oauth2/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-qsc94%40tesis-unimetbot.iam.gserviceaccount.com"
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