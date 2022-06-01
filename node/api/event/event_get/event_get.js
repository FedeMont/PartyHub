const routes = require('express').Router();
const { mongoose, documents, standardRes } = require("../../../utils");
const { authenticateToken } = require("../../../token");
const axios = require('axios');
const { requiredParametersErrHandler, errHandler } = require("../../../error_handlers");

const User = mongoose.model("User", documents.userSchema);
const Event = mongoose.model("Event", documents.eventSchema);
const Biglietto = mongoose.model("Biglietto", documents.bigliettoSchema);

/**
 * @openapi
 * paths:
 *  /api/event/get/events:
 *      get:
 *          summary: Ritorna gli eventi vicini
 *          description: Restituisce la lista degli eventi nella stessa località dell'utente loggato
 *          security:
 *              - bearerAuth: []
 *          parameters:
 *              - name: latitude
 *                in: query
 *                required: true
 *                description: Latitudine dell'utente
 *              - name: longitude
 *                in: query
 *                required: true
 *                description: Longitudine dell'utente
 *          responses:
 *              200:
 *                  description: Eventi vicini.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: object
 *                              properties:
 *                                  status:
 *                                      type: integer
 *                                      description: http status.
 *                                      example: 200
 *                                  message:
 *                                      type: array
 *                                      items:
 *                                          type: object
 *                                          properties:
 *                                              _id:
 *                                                  type: string
 *                                                  description: Id dell'evento.
 *                                                  example: 6288ec25fe5bb453c76a62fa
 *                                              name:
 *                                                  type: string
 *                                                  description: Nome dell'evento.
 *                                                  example: AlterEgo
 *                                              address:
 *                                                  type: object
 *                                                  properties:
 *                                                      locality:
 *                                                          type: string
 *                                                          description: Comune dell'evento
 *                                                          example: Povo
 *                                                      region:
 *                                                          type: string
 *                                                          description: Provincia dell'evento
 *                                                          example: Trento
 *                                              start_datetime:
 *                                                  type: string
 *                                                  format: date
 *                                                  description: Data e ora di inizio dell'evento.
 *                                                  example: 2000-05-21T00:00:00.000Z
 *                                              number_of_partecipants:
 *                                                  type: integer
 *                                                  description: Numero di partecipenti.
 *                                                  example: 100
 *                                              description:
 *                                                  type: string
 *                                                  description: Descrizione dell'evento.
 *                                                  example: Descrizione
 *                                              is_user_iscritto:
 *                                                  type: boolean
 *                                                  description: Se l'utente loggato è iscritto all'evento.
 *                                                  example: true
 *
 *              401:
 *                   $ref: "#/components/responses/NoToken"
 *              409:
 *                  description: Nessun utente trovato.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: object
 *                              properties:
 *                                  status:
 *                                      type: integer
 *                                      description: http status.
 *                                      example: 409
 *                                  message:
 *                                      type: string
 *                                      description: messaggio.
 *                                      example: Nessun utente trovato.
 *              500:
 *                  description: Errore nella ricerca di utente.
 *                  content:
 *                      application/json:
 *                          schema:
 *                               $ref: "#/components/schemas/Code500"
 */
routes.get('/events', authenticateToken, (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [req.query.latitude, req.query.longitude]
        )
    ) {
        User.find({ $and: [{ email: req.user.mail }, { account_type: "up" }] }, "", (err, users) => {
            if (errHandler(res, err, "utente")) {

                if (users.length === 0) return standardRes(res, 409, "Nessun utente trovato.");

                let user = users[0];
                console.log(user);

                if (req.query.ext_api !== "false") { // TODO: remove in deploy

                    console.log(req.query);

                    const params = {
                        access_key: process.env.positionstack_api_key,
                        query: req.query.latitude + "," + req.query.longitude,
                        output: "json"
                    };

                    axios.get('http://api.positionstack.com/v1/reverse', { params })
                        .then((response) => {
                            console.log(response.data.data[0]);
                            let data = response.data.data[0];

                            Event.find({ $or: [{ "address.locality": data.locality }, { "address.region": data.region }] },
                                "",
                                (err, events) => {
                                    if (errHandler(res, err, "eventi")) {

                                        let to_return = [];

                                        events.forEach((event) => {
                                            let event_info = {};
                                            event_info["_id"] = event._id;
                                            event_info["name"] = event.name;
                                            event_info["address"] = event.address;
                                            event_info["start_datetime"] = event.start_datetime;
                                            event_info["number_of_partecipants"] = event.number_of_partecipants;
                                            event_info["description"] = event.description;
                                            event_info["is_user_iscritto"] = (event.partecipants_list.includes(user._id));
                                            to_return.push(event_info);
                                        });
                                        console.log(events);

                                        return standardRes(res, 200, to_return);
                                    }
                                });

                        })
                        .catch((error) => {
                            console.log(error);
                            return standardRes(res, 409, "Errore nella richiesta a positionstack APIs.");
                        });
                } else { // TODO: remove in deploy
                    Event.find({}, "", (err, events) => {
                        let to_return = [];

                        events.forEach((event) => {
                            let event_info = {};
                            event_info["_id"] = event._id;
                            event_info["name"] = event.name;
                            event_info["address"] = event.address;
                            event_info["start_datetime"] = event.start_datetime;
                            event_info["number_of_partecipants"] = event.number_of_partecipants;
                            event_info["description"] = event.description;
                            if (event.partecipants_list.includes(user._id)) {
                                event_info["is_user_iscritto"] = true;
                            }
                            to_return.push(event_info);
                        });

                        console.log(events);
                        return standardRes(res, 200, to_return);
                    });
                }
            }
        });
    }
});

/**
 * @openapi
 * paths:
 *  /api/event/get/by_address:
 *      get:
 *          summary: Ritorna gli eventi vicini all'inidirizzo indicato
 *          description: Restituisce la lista degli eventi nella stessa località dell'indirizzo indicato dall'utente
 *          security:
 *              - bearerAuth: []
 *          parameters:
 *              - name: address
 *                in: query
 *                required: true
 *                description: Indirizzo dell'evento da cercare
 *          responses:
 *              200:
 *                  description: Eventi vicini.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: object
 *                              properties:
 *                                  status:
 *                                      type: integer
 *                                      description: http status.
 *                                      example: 200
 *                                  message:
 *                                      type: array
 *                                      items:
 *                                          type: object
 *                                          properties:
 *                                              _id:
 *                                                  type: string
 *                                                  description: Id dell'evento.
 *                                                  example: 6288ec25fe5bb453c76a62fa
 *                                              name:
 *                                                  type: string
 *                                                  description: Nome dell'evento.
 *                                                  example: AlterEgo
 *                                              address:
 *                                                  type: object
 *                                                  properties:
 *                                                      locality:
 *                                                          type: string
 *                                                          description: Comune dell'evento
 *                                                          example: Povo
 *                                                      region:
 *                                                          type: string
 *                                                          description: Provincia dell'evento
 *                                                          example: Trento
 *                                              start_datetime:
 *                                                  type: string
 *                                                  format: date
 *                                                  description: Data e ora di inizio dell'evento.
 *                                                  example: 2000-05-21T00:00:00.000Z
 *                                              number_of_partecipants:
 *                                                  type: integer
 *                                                  description: Numero di partecipenti.
 *                                                  example: 100
 *                                              description:
 *                                                  type: string
 *                                                  description: Descrizione dell'evento.
 *                                                  example: Descrizione
 *                                              is_user_iscritto:
 *                                                  type: boolean
 *                                                  description: Se l'utente loggato è iscritto all'evento.
 *                                                  example: true
 *
 *              401:
 *                   $ref: "#/components/responses/NoToken"
 *              403:
 *                  $ref: "#/components/responses/ForbiddenError"
 *              409:
 *                  description: Errore nella richiesta a PositionStackAPI.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code409"
 *              500:
 *                  description: Errore nella ricerca di eventi.
 *                  content:
 *                      application/json:
 *                          schema:
 *                               $ref: "#/components/schemas/Code500"
 */
routes.get('/by_address', authenticateToken, (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [req.query.address]
        )
    ) {
        if (req.user.role !== "up") return standardRes(res, 403, "Non ti è possibile cercare eventi.");

        console.log(req.query);

        const params = {
            access_key: process.env.positionstack_api_key,
            query: req.query.address,
            output: "json"
        }

        axios.get('http://api.positionstack.com/v1/forward', { params })
            .then((response) => {
                console.log(response.data.data[0]);
                let data = response.data.data[0];

                Event.find(
                    // { "address.locality": data.locality },
                    { $or: [{ "address.locality": data.locality }, { "address.reqion": data.region }] },
                    "",
                    (err, events) => {
                        if (errHandler(res, err, "eventi")) {

                            console.log(events);
                            return standardRes(res, 200, events);
                        }
                    });
            })
            .catch((error) => {
                console.log(error);
                return standardRes(res, 409, "Errore nella richiesta a positionstack APIs.");
            });
    }
});

/**
 * @openapi
 * paths:
 *  /api/event/get/by_id:
 *      get:
 *          summary: Ritorna le informazioni di un evento
 *          description: Restituisce le informazioni dell'evento con id indicato
 *          security:
 *              - bearerAuth: []
 *          parameters:
 *              - name: event_id
 *                in: query
 *                required: true
 *                description: Id dell'evento da cercare
 *          responses:
 *              200:
 *                  description: Evento.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: object
 *                              properties:
 *                                  status:
 *                                      type: integer
 *                                      description: http status.
 *                                      example: 200
 *                                  message:
 *                                      type: array
 *                                      items:
 *                                          type: object
 *                                          properties:
 *                                              _id:
 *                                                  type: string
 *                                                  description: Id dell'evento.
 *                                                  example: 6288ec25fe5bb453c76a62fa
 *                                              name:
 *                                                  type: string
 *                                                  description: Nome dell'evento.
 *                                                  example: AlterEgo
 *                                              address:
 *                                                  $ref: "#/components/schemas/Geoposition"
 *                                              start_datetime:
 *                                                  type: string
 *                                                  format: date
 *                                                  description: Data e ora di inizio dell'evento.
 *                                                  example: 2000-05-21T00:00:00.000Z
 *                                              end_datetime:
 *                                                  type: string
 *                                                  format: date
 *                                                  description: Data e ora di fine dell'evento.
 *                                                  example: 2000-05-21T00:00:00.000Z
 *                                              number_of_partecipants:
 *                                                  type: integer
 *                                                  description: Numero di partecipenti.
 *                                                  example: 100
 *                                              description:
 *                                                  type: string
 *                                                  description: Descrizione dell'evento.
 *                                                  example: Descrizione
 *                                              is_user_iscritto:
 *                                                  type: boolean
 *                                                  description: Se l'utente loggato è iscritto all'evento.
 *                                                  example: true
 *
 *              401:
 *                   $ref: "#/components/responses/NoToken"
 *              403:
 *                  $ref: "#/components/responses/ForbiddenError"
 *              409:
 *                  description: Nessun evento trovato.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code409"
 *              500:
 *                  description: Errore nella ricerca di eventi.
 *                  content:
 *                      application/json:
 *                          schema:
 *                               $ref: "#/components/schemas/Code500"
 */
routes.get('/by_id', authenticateToken, (req, res) => {
    if (
        requiredParametersErrHandler(
            req,
            [req.query.event_id]
        )
    ) {
        User.find({ $and: [{ email: req.user.mail }, { $or: [{ account_type: "o" }, { account_type: "up" }] }] }, "", (err, users) => {
            if (errHandler(res, err, "utente")) {
                if (users.length === 0) return standardRes(res, 409, "Nessun utente trovato.");

                let user = users[0];
                console.log(user);

                Event.find({ $or: [{ _id: req.query.event_id }, { _id: user.events_list }] }, "", (err, events) => {
                    if (errHandler(res, err, "evento")) {

                        if (events.length === 0) return standardRes(res, 409, "Nessun evento trovato.");

                        let event = events[0];
                        console.log(event);

                        return standardRes(res, 200, event);
                    }
                });
            }
        });
    }
});

/**
 * @openapi
 * paths:
 *  /api/event/get/by_user:
 *      get:
 *          summary: Ritorna gli eventi dell'utente loggato
 *          description: Restituisce la lista degli eventi creati dall'utente loggato
 *          security:
 *              - bearerAuth: []
 *          parameters:
 *              - name: event_id
 *                in: query
 *                required: true
 *                description: Id dell'evento da cercare
 *          responses:
 *              200:
 *                  description: Eventi.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: object
 *                              properties:
 *                                  status:
 *                                      type: integer
 *                                      description: http status.
 *                                      example: 200
 *                                  message:
 *                                      type: array
 *                                      items:
 *                                          type: object
 *                                          properties:
 *                                              _id:
 *                                                  type: string
 *                                                  description: Id dell'evento.
 *                                                  example: 6288ec25fe5bb453c76a62fa
 *                                              name:
 *                                                  type: string
 *                                                  description: Nome dell'evento.
 *                                                  example: AlterEgo
 *                                              start_datetime:
 *                                                  type: string
 *                                                  format: date
 *                                                  description: Data e ora di inizio dell'evento.
 *                                                  example: 2000-05-21T00:00:00.000Z
 *              401:
 *                   $ref: "#/components/responses/NoToken"
 *              409:
 *                  description: Nessun evento trovato.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code409"
 *              500:
 *                  description: Errore nella ricerca di utente.
 *                  content:
 *                      application/json:
 *                          schema:
 *                               $ref: "#/components/schemas/Code500"
 */
routes.get('/by_user', authenticateToken, (req, res) => {
    User.find({ $and: [{ email: req.user.mail }, { account_type: "o" }] }, "", (err, users) => {
        if (errHandler(res, err, "utente")) {
            if (users.length === 0) return standardRes(res, 409, "Nessun utente trovato.");

            let user = users[0];
            console.log(user);

            let event_ids = user.events_list;
            console.log(event_ids);

            Event.find({ _id: event_ids }, "name start_datetime", (err, events) => {
                if (errHandler(res, err, "eventi"))
                    return standardRes(res, 200, events);
            });
        }
    });
});

/**
 * @openapi
 * paths:
 *  /api/event/get/by_biglietto_id:
 *      get:
 *          summary: Ritorna le informazioni dell'evento collegato al biglietto
 *          description: Restituisce le informazioni dell'evento collegato al biglietto indicato
 *          security:
 *              - bearerAuth: []
 *          parameters:
 *              - name: biglietto_id
 *                in: query
 *                required: true
 *                description: Id del biglietto di cui cercare le informazioni dell'evento
 *          responses:
 *              200:
 *                  description: Evento.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: object
 *                              properties:
 *                                  status:
 *                                      type: integer
 *                                      description: http status.
 *                                      example: 200
 *                                  message:
 *                                      type: array
 *                                      items:
 *                                          type: object
 *                                          properties:
 *                                              _id:
 *                                                  type: string
 *                                                  description: Id dell'evento.
 *                                                  example: 6288ec25fe5bb453c76a62fa
 *                                              name:
 *                                                  type: string
 *                                                  description: Nome dell'evento.
 *                                                  example: AlterEgo
 *                                              start_datetime:
 *                                                  type: string
 *                                                  format: date
 *                                                  description: Data e ora di inizio dell'evento.
 *                                                  example: 2000-05-21T00:00:00.000Z
 *                                              biglietto_active:
 *                                                  type: boolean
 *                                                  description: Se il biglietto è attivo
 *                                                  example: true
 *                                              biglietto_used:
 *                                                  type: boolean
 *                                                  description: Se il biglietto è stato attivato e disattivato
 *                                                  example: true
 *
 *              401:
 *                   $ref: "#/components/responses/NoToken"
 *              409:
 *                  description: Nessun evento trovato.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code409"
 *              500:
 *                  description: Errore nella ricerca di utente.
 *                  content:
 *                      application/json:
 *                          schema:
 *                               $ref: "#/components/schemas/Code500"
 */
routes.get('/by_biglietto_id', authenticateToken, (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [req.query.biglietto_id]
        )
    ) {
        User.find({ $and: [{ email: req.user.mail }, { account_type: "up" }] }, "", (err, users) => {
            if (errHandler(res, err, "utente")) {
                if (users.length === 0) return standardRes(res, 409, "Nessun utente trovato.");

                console.log(req.query);

                Biglietto.find({ _id: req.query.biglietto_id }, "", (err, biglietti) => {
                    if (errHandler(res, err, "biglietto")) {

                        if (biglietti.length === 0) return standardRes(res, 409, "Nessun biglietto trovato.");

                        let biglietto = biglietti[0];
                        console.log("Biglietti: ", biglietto);

                        Event.find({ _id: biglietto.event }, "name start_datetime", (err, events) => {
                            if (errHandler(res, err, "evento")) {

                                if (events.length === 0) return standardRes(res, 409, "Nessun evento trovato.");

                                let event = events[0];

                                let to_return = {}
                                if (biglietto.entrance_datetime !== null) {
                                    to_return["biglietto_active"] = (biglietto.entrance_datetime !== undefined);
                                    to_return["biglietto_used"] = (biglietto.exit_datetime !== undefined);
                                    to_return["name"] = event.name;
                                    to_return["start_datetime"] = event.start_datetime;
                                    to_return["_id"] = event._id;
                                }

                                console.log(event);
                                return standardRes(res, 200, to_return);
                            }
                        });
                    }
                });
            }
        });
    }
});

/**
 * @openapi
 * paths:
 *  /api/event/get/storico_eventi_futuri:
 *      get:
 *          summary: Ritorna lo storico degli eventi futuri
 *          description: Restituisce la lista degli eventi futuri dell'utente loggato
 *          security:
 *              - bearerAuth: []
 *          responses:
 *              200:
 *                  description: Eventi futuri.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: object
 *                              properties:
 *                                  status:
 *                                      type: integer
 *                                      description: http status.
 *                                      example: 200
 *                                  message:
 *                                      type: array
 *                                      items:
 *                                          $ref: "#/components/schemas/Event"
 *              401:
 *                   $ref: "#/components/responses/NoToken"
 *              409:
 *                  description: Nessun utente trovato.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: object
 *                              properties:
 *                                  status:
 *                                      type: integer
 *                                      description: http status.
 *                                      example: 409
 *                                  message:
 *                                      type: string
 *                                      description: messaggio.
 *                                      example: Nessun utente trovato.
 *              500:
 *                  description: Errore nella ricerca di utente.
 *                  content:
 *                      application/json:
 *                          schema:
 *                               $ref: "#/components/schemas/Code500"
 */
routes.get('/storico_eventi_futuri', authenticateToken, (req, res) => {
    User.find(
        { $and: [{ email: req.user.mail }, { $or: [{ account_type: "o" }, { account_type: "up" }] }] },
        "number_of_events events_list"
    ).populate("events_list").exec().then((users) => {
        if (users.length === 0) return standardRes(res, 409, "Nessun utente trovato.");

        let user = users[0];
        console.log(user);

        let events = user.events_list.filter(event => event.end_datetime >= new Date());

        return standardRes(res, 200, events);
    })
        .catch((err) => {
            errHandler(res, err, "utente");
        })
});

/**
 * @openapi
 * paths:
 *  /api/event/get/storico_eventi_passati:
 *      get:
 *          summary: Ritorna lo storico degli eventi passati
 *          description: Restituisce la lista degli eventi passati dell'utente loggato
 *          security:
 *              - bearerAuth: []
 *          responses:
 *              200:
 *                  description: Eventi passati.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: object
 *                              properties:
 *                                  status:
 *                                      type: integer
 *                                      description: http status.
 *                                      example: 200
 *                                  message:
 *                                      type: array
 *                                      items:
 *                                          $ref: "#/components/schemas/Event"
 *              401:
 *                   $ref: "#/components/responses/NoToken"
 *              409:
 *                  description: Nessun utente trovato.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: object
 *                              properties:
 *                                  status:
 *                                      type: integer
 *                                      description: http status.
 *                                      example: 409
 *                                  message:
 *                                      type: string
 *                                      description: messaggio.
 *                                      example: Nessun utente trovato.
 *              500:
 *                  description: Errore nella ricerca di utente.
 *                  content:
 *                      application/json:
 *                          schema:
 *                               $ref: "#/components/schemas/Code500"
 */
routes.get('/storico_eventi_passati', authenticateToken, (req, res) => {
    User.find(
        { $and: [{ email: req.user.mail }, { $or: [{ account_type: "o" }, { account_type: "up" }] }] },
        "number_of_events events_list"
    ).populate("events_list").exec().then((users) => {
        if (users.length === 0) return standardRes(res, 409, "Nessun utente trovato.");

        let user = users[0];
        console.log(user);

        let events = user.events_list.filter(event => event.end_datetime < new Date());

        return standardRes(res, 200, events);
    })
        .catch((err) => {
            errHandler(res, err, "utente");
        })
});

module.exports = routes;