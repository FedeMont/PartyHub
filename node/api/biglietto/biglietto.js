const routes = require('express').Router();
const { mongoose, documents, standardRes } = require("../../utils");
const { authenticateToken } = require("../../token");
const { requiredParametersErrHandler, errHandler } = require("../../error_handlers");

const User = mongoose.model("User", documents.userSchema);
const Event = mongoose.model("Event", documents.eventSchema);
const Biglietto = mongoose.model("Biglietto", documents.bigliettoSchema);


/**
 * @openapi
 * paths:
 *  /api/biglietto/get_biglietti_futuri_by_user:
 *      get:
 *          summary: Ritorna i biglietti per gli eventi futuri
 *          description: Restituisce la lista dei biglietti per gli eventi futuri dell'utente loggato
 *          security:
 *              - bearerAuth: []
 *          responses:
 *              200:
 *                  description: Biglietti futuri.
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
 *                                      type: object
 *                                      properties:
 *                                          biglietto_id:
 *                                              type: string
 *                                              description: Id del biglietto.
 *                                              example: 6288ec25fe5bb453c76a62fa
 *                                          evento_id:
 *                                              type: string
 *                                              description: Id dell'evento.
 *                                              example: 6288ec25fe5bb453c76a62fa
 *                                          event_name:
 *                                              type: string
 *                                              description: Nome dell'evento.
 *                                              example: AlterEgo
 *                                          event_start_datetime:
 *                                              type: string
 *                                              format: date
 *                                              description: Data e ora di inizio dell'evento.
 *                                              example: 2000-05-21T00:00:00.000Z
 *              204:
 *                  $ref: "#/components/responses/NothingFound"
 *              401:
 *                  $ref: "#/components/responses/NoToken"
 *              403:
 *                  $ref: "#/components/responses/ForbiddenError"
 *              500:
 *                  description: Errore nella ricerca di utente.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code500"
 */
routes.get('/get_biglietti_futuri_by_user', authenticateToken, (req, res) => {
    User.find({ $and: [{ email: req.user.mail }, { account_type: "up" }] }, "", (err, users) => {
        if (errHandler(res, err, "utente")) {

            if (users.length === 0) return standardRes(res, 500, "Token email o account type errati.");

            let user = users[0];
            console.log("User: ", user);

            let biglietti_ids = user.biglietti_list;
            Biglietto.find({ _id: biglietti_ids }, "", (err, biglietti) => {
                if (errHandler(res, err, "biglietti")) {

                    if (biglietti.length === 0) return standardRes(res, 204, []);

                    console.log("Biglietti: ", biglietti);

                    let event_ids = [];
                    biglietti.forEach((biglietto) => {
                        event_ids.push(biglietto.event);
                    });

                    Event.find({ $and: [{ _id: event_ids }, { $or: [{ start_datetime: { $gte: new Date() } }, { end_datetime: { $gte: new Date() } }] }] }, "", (err, events) => {
                        if (errHandler(res, err, "eventi")) {

                            console.log("Eventi:", events);
                            if (events.length === 0) return standardRes(res, 500, "Nessun evento trovato per i tuoi biglietti.");

                            let biglietti_list = [];

                            for (let event in events) {
                                // console.log(event);

                                let biglietto = {};
                                biglietto["biglietto_id"] = biglietti[event]._id;
                                biglietto["evento_id"] = events[event]._id;
                                biglietto["event_name"] = events[event].name;
                                biglietto["event_start_datetime"] = events[event].start_datetime;

                                biglietti_list.push(biglietto);
                            }

                            return standardRes(res, 200, biglietti_list);
                        }
                    });
                }
            });
        }
    });
});

/**
 * @openapi
 * paths:
 *  /api/biglietto/get_biglietti_scaduti_by_user:
 *      get:
 *          summary: Ritorna i biglietti per gli eventi scaduti
 *          description: Restituisce la lista dei biglietti per gli eventi scaduti dell'utente loggato
 *          security:
 *              - bearerAuth: []
 *          responses:
 *              200:
 *                  description: Biglietti scaduti.
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
 *                                      type: object
 *                                      properties:
 *                                          biglietto_id:
 *                                              type: string
 *                                              description: Id del biglietto.
 *                                              example: 6288ec25fe5bb453c76a62fa
 *                                          evento_id:
 *                                              type: string
 *                                              description: Id dell'evento.
 *                                              example: 6288ec25fe5bb453c76a62fa
 *                                          event_name:
 *                                              type: string
 *                                              description: Nome dell'evento.
 *                                              example: AlterEgo
 *                                          event_start_datetime:
 *                                              type: string
 *                                              format: date
 *                                              description: Data e ora di inizio dell'evento.
 *                                              example: 2000-05-21T00:00:00.000Z
 *              204:
 *                  $ref: "#/components/responses/NothingFound"
 *              401:
 *                  $ref: "#/components/responses/NoToken"
 *              403:
 *                  $ref: "#/components/responses/ForbiddenError"
 *              500:
 *                  description: Errore nella ricerca di utente.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code500"
 */
routes.get('/get_biglietti_scaduti_by_user', authenticateToken, (req, res) => {
    User.find({ $and: [{ email: req.user.mail }, { account_type: "up" }] }, "", (err, users) => {
        if (errHandler(res, err, "utente")) {

            if (users.length === 0) return standardRes(res, 500, "Token email o account type errati.");

            let user = users[0];
            console.log("User: ", user);

            let biglietti_ids = user.biglietti_list;
            Biglietto.find({ _id: biglietti_ids }, "", (err, biglietti) => {
                if (errHandler(res, err, "biglietti")) {

                    console.log("Biglietti: ", biglietti);
                    if (biglietti.length === 0) return standardRes(res, 204, []);

                    let event_ids = [];
                    biglietti.forEach((biglietto) => {
                        event_ids.push(biglietto.event);
                    });

                    Event.find({ $and: [{ _id: event_ids }, { end_datetime: { $lte: new Date() } }] }, "", (err, events) => {
                        if (errHandler(res, err, "eventi")) {

                            console.log("Eventi:", events);
                            if (events.length === 0) return standardRes(res, 500, "Nessun evento trovato per i tuoi biglietti.");

                            let biglietti_list = [];

                            for (let event in events) {
                                // console.log(event);

                                let biglietto = {};
                                biglietto["biglietto_id"] = biglietti[event]._id;
                                biglietto["evento_id"] = events[event]._id;
                                biglietto["event_name"] = events[event].name;
                                biglietto["event_start_datetime"] = events[event].start_datetime;

                                biglietti_list.push(biglietto);
                            }

                            return standardRes(res, 200, biglietti_list);
                        }
                    });
                }
            });
        }
    });
});

/**
 * @openapi
 * paths:
 *  /api/biglietto/activate:
 *      post:
 *          summary: Attiva il biglietto
 *          description: Dato l'id del biglietto e dell'evento associato al biglietto, viene attivato il biglietto
 *          security:
 *              - bearerAuth: []
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              biglietto_id:
 *                                  type: string
 *                                  description: Id del biglietto da attivare
 *                              event_id:
 *                                  type: string
 *                                  description: Id dell'evento cllegato al biglietto da attivare
 *          responses:
 *              200:
 *                  description: Biglietto attivato.
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
 *                                      type: object
 *                                      properties:
 *                                          _id:
 *                                              type: string
 *                                              description: Id del biglietto.
 *                                              example: 6288ec25fe5bb453c76a62fa
 *                                          event:
 *                                              type: object
 *                                              properties:
 *                                                  _id:
 *                                                      type: string
 *                                                      description: Id dell'evento.
 *                                                      example: 6288ec25fe5bb453c76a62fa
 *                                                  name:
 *                                                      type: string
 *                                                      description: Nome dell'evento
 *                                                      example: AlterEgo
 *                                                  address:
 *                                                      type: object
 *                                                      properties:
 *                                                          label:
 *                                                              type: string
 *                                                              description: Nome completo dell'indirizzo
 *                                                              example: Via Sommarive 5, Povo, TN, Italia
 *                                                          locality:
 *                                                              type: string
 *                                                              description: Nome completo del comune
 *                                                              example: Povo
 *                                                          region:
 *                                                              type: string
 *                                                              description: Nome completo della provincia
 *                                                              example: Trento
 *                                                  start_datetime:
 *                                                      type: string
 *                                                      format: date
 *                                                      description: Data e ora di inizio all'evento.
 *                                                      example: 2000-05-21T00:00:00.000Z
 *                                                  end_datetime:
 *                                                      type: string
 *                                                      format: date
 *                                                      description: Data e ora di fine dall'evento.
 *                                                      example: 2000-05-21T00:00:00.000Z
 *                                                  description:
 *                                                      type: string
 *                                                      description: Descrizione dell'evento
 *                                                      example: Descrizione
 *                                          number_of_products:
 *                                              type: integer
 *                                              description: Numero di prodotti acquistati durante l'evento.
 *                                              example: 0
 *                                          total_price:
 *                                              type: integer
 *                                              description: Prezzo totale dei prodotti acquistati
 *                                              example: 0.00
 *                                          products_list:
 *                                              type: array
 *                                              items:
 *                                                  type: object
 *                                                  properties:
 *                                                      name:
 *                                                          type: string
 *                                                          description: Nome del prodotto
 *                                                          example: ""
 *                                                      price:
 *                                                          type: integer
 *                                                          description: Prezzo del prodotto
 *                                                          example: 0
 *              401:
 *                  $ref: "#/components/responses/NoToken"
 *              403:
 *                  $ref: "#/components/responses/ForbiddenError"
 *              409:
 *                  description: Non ti è possibile attivare il biglietto per questo evento.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code409"
 *              422:
 *                  $ref: "#/components/responses/MissingParameters"
 *              500:
 *                  description: Errore nella ricerca di utente.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code500"
 */
routes.post('/activate', authenticateToken, (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [req.body.biglietto_id, req.body.event_id]
        )
    ) {
        User.find({ $and: [{ email: req.user.mail }, { account_type: "up" }] }, "", (err, users) => {
            if (errHandler(res, err, "utente")) {

                if (users.length === 0) return standardRes(res, 500, "Token email o account type errati.");

                let user = users[0];
                console.log("User: ", user);

                Biglietto.find({ _id: req.body.biglietto_id }, "", (err, biglietto) => {
                    if (errHandler(res, err, "biglietto")) {

                        if (biglietto.length === 0) return standardRes(res, 409, "Nessun biglietto trovato.");

                        biglietto = biglietto[0];
                        console.log("Biglietti: ", biglietto);

                        Event.find({ _id: req.body.event_id }, "name address.label adress.name address.locality address.region start_datetime end_datetime description", (err, events) => {
                            if (errHandler(res, err, "evento")) {

                                if (events.length === 0) return standardRes(res, 409, "Nessun evento trovato.");

                                let event = events[0];
                                console.log("User: ", event);

                                if (!biglietto.event.equals(event._id)) return standardRes(res, 409, "Non ti è possibile attivare il biglietto per questo evento.");

                                biglietto.entrance_datetime = new Date();
                                biglietto.save((err) => {
                                    if (errHandler(res, err, "Errore nell'attivazione del biglietto.", false)) {

                                        biglietto.event = event;
                                        return standardRes(res, 200, biglietto);
                                    }
                                });
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
 *  /api/biglietto/deactivate:
 *      post:
 *          summary: Disattiva il biglietto
 *          description: Dato l'id del biglietto e dell'evento associato al biglietto, viene disattivato il biglietto
 *          security:
 *              - bearerAuth: []
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              biglietto_id:
 *                                  type: string
 *                                  description: Id del biglietto da disattivare
 *                              event_id:
 *                                  type: string
 *                                  description: Id dell'evento cllegato al biglietto da disattivare
 *          responses:
 *              200:
 *                  description: Biglietto disattivato.
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
 *                                      type: object
 *                                      properties:
 *                                          _id:
 *                                              type: string
 *                                              description: Id del biglietto.
 *                                              example: 6288ec25fe5bb453c76a62fa
 *                                          event:
 *                                              type: object
 *                                              properties:
 *                                                  _id:
 *                                                      type: string
 *                                                      description: Id dell'evento.
 *                                                      example: 6288ec25fe5bb453c76a62fa
 *                                                  name:
 *                                                      type: string
 *                                                      description: Nome dell'evento
 *                                                      example: AlterEgo
 *                                                  address:
 *                                                      type: object
 *                                                      properties:
 *                                                          label:
 *                                                              type: string
 *                                                              description: Nome completo dell'indirizzo
 *                                                              example: Via Sommarive 5, Povo, TN, Italia
 *                                                          locality:
 *                                                              type: string
 *                                                              description: Nome completo del comune
 *                                                              example: Povo
 *                                                          region:
 *                                                              type: string
 *                                                              description: Nome completo della provincia
 *                                                              example: Trento
 *                                                  start_datetime:
 *                                                      type: string
 *                                                      format: date
 *                                                      description: Data e ora di inizio all'evento.
 *                                                      example: 2000-05-21T00:00:00.000Z
 *                                                  end_datetime:
 *                                                      type: string
 *                                                      format: date
 *                                                      description: Data e ora di fine dall'evento.
 *                                                      example: 2000-05-21T00:00:00.000Z
 *                                                  description:
 *                                                      type: string
 *                                                      description: Descrizione dell'evento
 *                                                      example: Descrizione
 *                                          number_of_products:
 *                                              type: integer
 *                                              description: Numero di prodotti acquistati durante l'evento.
 *                                              example: 0
 *                                          total_price:
 *                                              type: integer
 *                                              description: Prezzo totale dei prodotti acquistati
 *                                              example: 0.00
 *                                          products_list:
 *                                              type: array
 *                                              items:
 *                                                  type: object
 *                                                  properties:
 *                                                      name:
 *                                                          type: string
 *                                                          description: Nome del prodotto
 *                                                          example: ""
 *                                                      price:
 *                                                          type: integer
 *                                                          description: Prezzo del prodotto
 *                                                          example: 0
 *              401:
 *                  $ref: "#/components/responses/NoToken"
 *              403:
 *                  $ref: "#/components/responses/ForbiddenError"
 *              409:
 *                  description: Non ti è possibile disattivare il biglietto per questo evento.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code409"
 *              422:
 *                  $ref: "#/components/responses/MissingParameters"
 *              500:
 *                  description: Errore nella ricerca di utente.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/compenents/schemas/Code500"
 */
routes.post('/deactivate', authenticateToken, (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [req.body.biglietto_id, req.body.event_id]
        )
    ) {
        User.find({ $and: [{ email: req.user.mail }, { account_type: "up" }] }, "", (err, users) => {
            if (errHandler(res, err, "utente")) {

                if (users.length === 0) return standardRes(res, 500, "Token email o account type errati.");

                let user = users[0];
                console.log("User: ", user);

                Biglietto.find({ _id: req.body.biglietto_id }, "", (err, biglietto) => {
                    if (errHandler(res, err, "biglietto")) {

                        if (biglietto.length === 0) return standardRes(res, 409, "Nessun biglietto trovato.");

                        biglietto = biglietto[0];
                        console.log("Biglietto: ", biglietto);

                        Event.find({ _id: req.body.event_id }, "name address.label adress.name address.locality address.region start_datetime end_datetime description", (err, events) => {
                            if (errHandler(res, err, "evento")) {

                                if (events.length === 0) return standardRes(res, 409, "Nessun evento trovato.");

                                let event = events[0];
                                console.log("User: ", event);

                                if (!biglietto.event.equals(event._id)) return standardRes(res, 409, "Non ti è possibile disattivare il biglietto per questo evento.");

                                biglietto.exit_datetime = new Date();
                                biglietto.save((err) => {
                                    if (errHandler(res, err, "Errore nella disattivazione del biglietto.", false)) {

                                        biglietto.event = event;
                                        return standardRes(res, 200, biglietto);
                                    }
                                });
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
 *  /api/biglietto/get_products:
 *      get:
 *          summary: Prodotti acquistati durante l'evento
 *          description: Dato l'id del biglietto ritorna la lista dei prodotti acquistati durante l'evento
 *          security:
 *              - bearerAuth: []
 *          parameters:
 *              - name: biglietto_id
 *                in: query
 *                required: true
 *                description: Id del biglietto
 *          responses:
 *              200:
 *                  description: Biglietto.
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
 *                                      type: object
 *                                      properties:
 *                                          _id:
 *                                              type: string
 *                                              description: Id del biglietto.
 *                                              example: 6288ec25fe5bb453c76a62fa
 *                                          event:
 *                                              type: object
 *                                              properties:
 *                                                  _id:
 *                                                      type: string
 *                                                      description: Id dell'evento.
 *                                                      example: 6288ec25fe5bb453c76a62fa
 *                                                  name:
 *                                                      type: string
 *                                                      description: Nome dell'evento
 *                                                      example: AlterEgo
 *                                                  address:
 *                                                      type: object
 *                                                      properties:
 *                                                          label:
 *                                                              type: string
 *                                                              description: Nome completo dell'indirizzo
 *                                                              example: Via Sommarive 5, Povo, TN, Italia
 *                                                          locality:
 *                                                              type: string
 *                                                              description: Nome completo del comune
 *                                                              example: Povo
 *                                                          region:
 *                                                              type: string
 *                                                              description: Nome completo della provincia
 *                                                              example: Trento
 *                                                  start_datetime:
 *                                                      type: string
 *                                                      format: date
 *                                                      description: Data e ora di inizio all'evento.
 *                                                      example: 2000-05-21T00:00:00.000Z
 *                                                  end_datetime:
 *                                                      type: string
 *                                                      format: date
 *                                                      description: Data e ora di fine dall'evento.
 *                                                      example: 2000-05-21T00:00:00.000Z
 *                                                  description:
 *                                                      type: string
 *                                                      description: Descrizione dell'evento
 *                                                      example: Descrizione
 *                                          number_of_products:
 *                                              type: integer
 *                                              description: Numero di prodotti acquistati durante l'evento.
 *                                              example: 3
 *                                          total_price:
 *                                              type: integer
 *                                              description: Prezzo totale dei prodotti acquistati
 *                                              example: 23.50
 *                                          products_list:
 *                                              type: array
 *                                              items:
 *                                                  type: object
 *                                                  properties:
 *                                                      name:
 *                                                          type: string
 *                                                          description: Nome del prodotto
 *                                                          example: Ingresso 10:30
 *                                                      price:
 *                                                          type: integer
 *                                                          description: Prezzo del prodotto
 *                                                          example: 10.00
 *                                          entrance_datetime:
 *                                              type: string
 *                                              format: date
 *                                              description: Data e ora di ingresso all'evento
 *                                              example: 2000-05-21T00:00:00.000Z
 *              401:
 *                  $ref: "#/components/responses/NoToken"
 *              403:
 *                  $ref: "#/components/responses/ForbiddenError"
 *              422:
 *                  $ref: "#/components/responses/MissingParameters"
 *              500:
 *                  description: Errore nella ricerca di utente.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code500"
 */
routes.get('/get_products', authenticateToken, (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [req.query.biglietto_id]
        )
    ) {
        User.find({ $and: [{ email: req.user.mail }, { account_type: "up" }] }, "", (err, users) => {
            if (errHandler(res, err, "utente")) {

                if (users.length === 0) return standardRes(res, 500, "Token email o account type errati.");

                let user = users[0];
                console.log("User: ", user);

                Biglietto.find({ _id: req.query.biglietto_id }, "", (err, biglietti) => {
                    if (errHandler(res, err, "biglietto")) {

                        if (biglietti.length === 0) return standardRes(res, 409, "Nessun biglietto trovato.");

                        let biglietto = biglietti[0];
                        console.log("Biglietti: ", biglietto.entrance_datetime);

                        if (biglietto.entrance_datetime === null || biglietto.entrance_datetime === undefined) return standardRes(res, 409, "Biglieto non attivo.");

                        Event.find({ _id: biglietto.event }, "name address.label adress.name address.locality address.region start_datetime end_datetime description", (err, events) => {
                            if (errHandler(res, err, "evento")) {

                                if (events.length === 0) return standardRes(res, 500, "Nessun evento trovato per il tuo biglietto.");

                                let event = events[0];
                                console.log("User: ", event);

                                biglietto.event = event;

                                return standardRes(res, 200, biglietto);

                            }
                        });
                    }
                });
            }
        });
    }
});

module.exports = routes;