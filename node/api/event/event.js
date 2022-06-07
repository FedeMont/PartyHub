const routes = require('express').Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const { mongoose, documents, standardRes, upload } = require("../../utils");
const { authenticateToken } = require("../../token");
const { requiredParametersErrHandler, errHandler } = require("../../error_handlers");
const {createEmailMessage, sendMail} = require("../../emailer");

const User = mongoose.model("User", documents.userSchema);
const GeopositionData = mongoose.model("GeopositionData", documents.geopositionSchema);
const Event = mongoose.model("Event", documents.eventSchema);
const Biglietto = mongoose.model("Biglietto", documents.bigliettoSchema);


/**
 * @openapi
 * paths:
 *  /api/v2/event/crea:
 *      post:
 *          summary: Creazione evento
 *          description: Dati i dati dell'evento inseriti dall'utente, il sistema inserisce il nuovo evento
 *          security:
 *              - bearerAuth: []
 *          requestBody:
 *              required: true
 *              content:
 *                  multipart/form-data:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              name:
 *                                  type: string
 *                                  description: Nome dell'evento
 *                              address:
 *                                  type: string
 *                                  description: Indirizzo dell'evento
 *                              poster:
 *                                  type: string
 *                                  format: binary
 *                                  description: Foto locandina evento
 *                              start_datetime:
 *                                  type: string
 *                                  format: date
 *                                  description: Data e ora di inizio dell'evento
 *                              end_datetime:
 *                                  type: string
 *                                  format: date
 *                                  description: Data e ora di fine dell'evento
 *                              age_range:
 *                                  type: string
 *                                  description: Range di età a cui è consentito l'ingresso all'evento
 *                              maximum_partecipants:
 *                                  type: integer
 *                                  description: Numero massimo di persone a cui è consentito l'ingresso all'evento
 *          responses:
 *              200:
 *                  description: Evento creato correttamente.
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
 *                                      type: string
 *                                      description: Id dell'evento creato correttamente.
 *                                      example: 6288ec25fe5bb453c76a62fa
 *              401:
 *                  $ref: "#/components/responses/NoToken"
 *              403:
 *                  $ref: "#/components/responses/ForbiddenError"
 *              409:
 *                  description: La data di fine evento deve succedere quella di inizio evento.
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
routes.post('/crea', authenticateToken, upload.single('poster'), (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [
                req.body.name, req.body.address, req.body.start_datetime, req.body.end_datetime,
                req.body.age_range, req.body.maximum_partecipants
            ]
        )
    ) {
        User.find({ $and: [{ email: req.user.mail }, { account_type: "o" }] }, "", (err, users) => {
            if (errHandler(res, err, "utente")) {
                if (users.length === 0) return standardRes(res, 500, "Token email o account type errati.");

                let user = users[0];
                console.log(user);

                if (req.body.start_datetime >= req.body.end_datetime) return standardRes(res, 409, "La data di fine evento deve succedere quella di inizio evento.");

                let age_range = req.body.age_range.split('-');

                let poster = "";

                if (req.file !== undefined) {
                    poster = fs.readFileSync(path.resolve('./uploads/' + req.file.filename)).toString('base64');
                    fs.unlinkSync(path.resolve('./uploads/' + req.file.filename));
                }

                const params = {
                    access_key: process.env.positionstack_api_key,
                    query: req.body.address,
                    output: "json"
                }

                axios.get('http://api.positionstack.com/v1/forward', { params })
                    .then((response) => {
                        console.log(response.data.data);

                        const geopositionData = new GeopositionData(response.data.data[0]);

                        const event = new Event({
                            _id: new mongoose.Types.ObjectId(),
                            name: req.body.name,
                            address: geopositionData,
                            start_datetime: req.body.start_datetime,
                            end_datetime: req.body.end_datetime,
                            poster: poster,
                            age_range_min: age_range[0],
                            age_range_max: age_range[1],
                            maximum_partecipants: req.body.maximum_partecipants,
                            description: req.body.description,
                            owner: user._id
                        });

                        event.save((err) => {
                            if (errHandler(res, err, "Errore nella creazione dell'evento.", false)) {

                                user.events_list = user.events_list || [];
                                user.events_list.push(event._id);
                                user.number_of_events = user.number_of_events + 1;

                                user.save((err) => {
                                    if (errHandler(res, err, "Errore nell'aggiornamento dell'utente.", false)) {
                                        let message = createEmailMessage(
                                            user.email,
                                            "QR code evento",
                                            `
                                                <!DOCTYPE html>
                                                <html>
                                                    <head>
                                                        <title></title>
                                                    </head>
                                                    
                                                    <body>
                                                        <div>
                                                            <p>Questo è il QR code dell'evento:</p>
                                                            <p>${event.name}</p>
                                                            <p>Stampalo e mostralo all'ingresso del tuo locale</p>
                                                            <img src="https://api.qrserver.com/v1/create-qr-code/?data=${event._id}&amp;size=100x100 alt='' title=''"> 
                                                        </div>
                                                    </body>
                                                </html>
                                            `
                                        );

                                        sendMail(message)
                                            .then((result) => {
                                                return standardRes(res, 200, event._id);
                                            })
                                            .catch((error) => {
                                                errHandler(res, err, "Errore nell'invio dell'email.", false);
                                            });
                                    }
                                });
                            }
                        });
                    })
                    .catch((error) => {
                        console.log(error);
                        return standardRes(res, 500, "Errore nella richiesta a positionstack APIs.");
                    });
            }
        });
    }
});

/**
 * @openapi
 * paths:
 *  /api/v2/event/modifica:
 *      patch:
 *          summary: Modifica evento
 *          description: Dati i dati dell'evento il sistema aggiorna i nuovi dati
 *          security:
 *              - bearerAuth: []
 *          requestBody:
 *              required: true
 *              content:
 *                  multipart/form-data:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              id:
 *                                  type: string
 *                                  description: Id dell'evento
 *                              name:
 *                                  type: string
 *                                  description: Nome dell'evento
 *                              address:
 *                                  type: string
 *                                  description: Indirizzo dell'evento
 *                              file:
 *                                  type: string
 *                                  format: binary
 *                                  description: Foto locandina evento
 *                              start_datetime:
 *                                  type: string
 *                                  format: date
 *                                  description: Data e ora di inizio dell'evento
 *                              end_datetime:
 *                                  type: string
 *                                  format: date
 *                                  description: Data e ora di fine dell'evento
 *                              age_range:
 *                                  type: string
 *                                  description: Range di età a cui è consentito l'ingresso all'evento
 *                              maximum_partecipants:
 *                                  type: integer
 *                                  description: Numero massimo di persone a cui è consentito l'ingresso all'evento
 *          responses:
 *              200:
 *                  description: Evento modificato correttamente.
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
 *                                      type: string
 *                                      description: messaggio.
 *                                      example: Evento aggiornato correttamente.
 *              401:
 *                  $ref: "#/components/responses/NoToken"
 *              403:
 *                  $ref: "#/components/responses/ForbiddenError"
 *              409:
 *                  description: Nessun evento trovato.
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
routes.patch('/modifica', authenticateToken, upload.single('poster'), (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [
                req.body.id, req.body.name, req.body.address, req.body.start_datetime, req.body.end_datetime,
                req.body.age_range, req.body.maximum_partecipants
            ]
        )
    ) {
        User.find({ $and: [{ email: req.user.mail }, { account_type: "o" }] }, "", (err, users) => {
            if (errHandler(res, err, "utente")) {
                if (users.length === 0) return standardRes(res, 500, "Token email o accou type errati.");

                let user = users[0];
                console.log(user);

                Event.find({ $and: [{ _id: req.body.id }, { owner: user._id }] }, "", (err, events) => {
                    if (events.length === 0) return standardRes(res, 409, "Nessun evento trovato.");

                    let event = events[0];
                    console.log(event);

                    if (event.end_datetime < new Date()) return standardRes(res, 403, "Non è possibile modificare un evento passato.");

                    if (req.body.start_datetime >= req.body.end_datetime) return standardRes(res, 409, "La data di fine evento deve succedere quella di inizio evento.");

                    let age_range = req.body.age_range.split('-');

                    let poster = event.poster;
                    if (req.file !== undefined) {
                        poster = fs.readFileSync(path.resolve('./uploads/' + req.file.filename)).toString('base64');
                        fs.unlinkSync(path.resolve('./uploads/' + req.file.filename));
                    }

                    const params = {
                        access_key: process.env.positionstack_api_key,
                        query: req.body.address,
                        output: "json"
                    }

                    axios.get('http://api.positionstack.com/v1/forward', { params })
                        .then((response) => {
                            console.log(response.data.data);

                            const geopositionData = new GeopositionData(response.data.data[0]);

                            event["name"] = req.body.name;
                            event["address"] = geopositionData;
                            event["poster"] = poster;
                            event["start_datetime"] = req.body.start_datetime;
                            event["end_datetime"] = req.body.end_datetime;
                            event["age_range_min"] = age_range[0];
                            event["age_range_max"] = age_range[1];
                            event["maximum_partecipants"] = req.body.maximum_partecipants;
                            event["description"] = req.body.description;

                            event.save((err) => {
                                if (errHandler(res, err, "Errore nella modifica dell'evento.", false)) {
                                    return standardRes(res, 200, "Evento aggiornato correttamente.");
                                }
                            });
                        })
                        .catch((error) => {
                            console.log(error);
                            return standardRes(res, 500, "Errore nella richiesta a positionstack APIs.");
                        });
                });
            }
        });
    }
});

/**
 * @openapi
 * paths:
 *  /api/v2/event/elimina:
 *      delete:
 *          summary: Elimina un evento
 *          description: Elimina l'evento con id indicato
 *          security:
 *              - bearerAuth: []
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              event_id:
 *                                  type: string
 *                                  description: Id dell'evento che l'utente vuole eliminare
 *          responses:
 *              200:
 *                  description: Evento eliminato correttamente.
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
 *                                      type: string
 *                                      description: messaggio.
 *                                      example: Evento eliminato correttamente.
 *              401:
 *                  $ref: "#/components/responses/NoToken"
 *              403:
 *                  $ref: "#/components/responses/ForbiddenError"
 *              409:
 *                  description: Nessun evento trovato.
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
routes.delete('/elimina', authenticateToken, (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [req.body.event_id]
        )
    ) {

        User.find({ $and: [{ email: req.user.mail }, { account_type: "o" }] }, "", (err, users) => { // organizzatore
            if (errHandler(res, err, "utente")) {
                if (users.length === 0) return standardRes(res, 500, "Token email o account type errati.");

                let user = users[0];
                console.log(user);

                Event.find({ $and: [{ _id: req.body.event_id }, { owner: user._id }] }, "", (err, events) => { // evento da eliminare
                    if (errHandler(res, err, "evento")) {
                        if (events.length === 0) return standardRes(res, 409, "Nessun evento trovato.");

                        let event = events[0];
                        console.log(event);

                        if (event.end_datetime < new Date()) return standardRes(res, 403, "Non è possibile eliminare un evento passato.");

                        Biglietto.find({ event: req.body.event_id }, "", (err, biglietti) => { // biglietti di tutti gli utenti iscritti all'evento da eliminare
                            if (errHandler(res, err, "biglietti")) {

                                let lista_id_biglietti = [];
                                biglietti.forEach(biglietto => {
                                    lista_id_biglietti.push(biglietto._id);
                                });

                                User.updateMany({
                                    $and: [{ events_list: event._id }, { number_of_events: { $gt: 0 } }, { number_of_biglietti: { $gt: 0 } }]
                                },
                                    {
                                        $inc: { number_of_events: -1, number_of_biglietti: -1 },
                                        $pull: { events_list: event._id },
                                        $pullAll: { biglietti_list: lista_id_biglietti }
                                    }
                                )
                                    .exec()
                                    .then((result) => {

                                        Biglietto.deleteMany({
                                            event: event._id
                                        }).exec()
                                            .then((results) => {
                                                Event.deleteOne({ _id: event._id })
                                                    .exec()
                                                    .then((result) => {
                                                        return standardRes(res, 200, "Evento eliminato correttamente.");
                                                    })
                                                    .catch((err) => {
                                                        errHandler(res, err, "Errore nella eliminazione di evento.", false);
                                                    });
                                            });
                                    })
                                    .catch((err) => {
                                        errHandler(res, err, "Errore nell'aggiornamento degli utenti.", false);
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
 *  /api/v2/event/iscrizione:
 *      post:
 *          summary: Iscrizione evento
 *          description: Dato l'id dell'evento desiderato, il sistema iscrive l'utente loggato all'evento
 *          security:
 *              - bearerAuth: []
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              event_id:
 *                                  type: string
 *                                  description: Id dell'evento a cui l'utente vuole iscriversi
 *          responses:
 *              200:
 *                  description: Utente iscritto all'evento correttamente.
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
 *                                      type: string
 *                                      description: messaggio.
 *                                      example: Utente iscritto all'evento correttamente.
 *              401:
 *                  $ref: "#/components/responses/NoToken"
 *              403:
 *                  $ref: "#/components/responses/ForbiddenError"
 *              409:
 *                  description: Nessun evento trovato.
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
routes.post('/iscrizione', authenticateToken, (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [req.body.event_id]
        )
    ) {
        User.find({ $and: [{ email: req.user.mail }, { account_type: "up" }] }, "", (err, users) => {
            if (errHandler(res, err, "utente")) {
                if (users.length === 0) return standardRes(res, 500, "Token email o account type errati.");

                let user = users[0];
                console.log(user);

                Event.find({ _id: req.body.event_id }, "", (err, events) => {
                    if (errHandler(res, err, "evento")) {
                        if (events.length === 0) return standardRes(res, 409, "Nessun evento trovato.");

                        let event = events[0];
                        console.log(event);

                        user.events_list = user.events_list || [];
                        event.partecipants_list = event.partecipants_list || [];
                        if (user.events_list.includes(event._id) || event.partecipants_list.includes(user._id))
                            return standardRes(res, 409, "L'utente è già iscritto a questo evento.");

                        if (event.number_of_partecipants + 1 > event.maximum_partecipants)
                            return standardRes(res, 409, "Il numero limite di partecipanti è già stato raggiunto.");

                        const biglietto = new Biglietto({
                            _id: new mongoose.Types.ObjectId(),
                            event: event._id
                        });

                        biglietto.save((err) => {
                            if (errHandler(res, err, "Errore nella creazione del biglietto.", false)) {

                                user.events_list.push(event._id);
                                user.number_of_events = user.number_of_events + 1;

                                user.biglietti_list.push(biglietto._id);
                                user.number_of_biglietti = user.number_of_biglietti + 1;

                                user.save((err) => {
                                    if (errHandler(res, err, "Errore nell'aggiornamento dell'utente.", false)) {

                                        event.partecipants_list.push(user._id);
                                        event.number_of_partecipants = event.number_of_partecipants + 1;

                                        console.log(event);

                                        event.save((err) => {
                                            if (errHandler(res, err, "Errore nell'aggiornamento dell'evento.", false)) {
                                                return standardRes(res, 200, "Utente iscritto all'evento correttamente.");
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
    }
});

/**
 * @openapi
 * paths:
 *  /api/v2/event/disiscrizione:
 *      post:
 *          summary: Disiscrizione evento
 *          description: Dato l'id dell'evento desiderato, il sistema annulla l'iscrizione dell'utente loggato all'evento
 *          security:
 *              - bearerAuth: []
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              event_id:
 *                                  type: string
 *                                  description: Id dell'evento a cui l'utente vuole disiscriversi
 *          responses:
 *              200:
 *                  description: Disiscrizione effettuata.
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
 *                                      type: string
 *                                      description: messaggio.
 *                                      example: Disiscrizione effettuata.
 *              401:
 *                  $ref: "#/components/responses/NoToken"
 *              403:
 *                  $ref: "#/components/responses/ForbiddenError"
 *              409:
 *                  description: Nessun evento trovato.
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
routes.post('/disiscrizione', authenticateToken, (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [req.body.event_id]
        )
    ) {
        User.find({ $and: [{ email: req.user.mail }, { account_type: "up" }] }, "", (err, users) => {
            if (errHandler(res, err, "utente")) {
                if (users.length === 0) return standardRes(res, 500, "Token email o account type errati.")

                let user = users[0];
                console.log(user);

                Event.find({ _id: req.body.event_id }, "", (err, events) => {
                    if (errHandler(res, err, "evento")) {
                        if (events.length === 0) return standardRes(res, 409, "Nessun evento trovato.")

                        let event = events[0];
                        console.log(event);

                        if (!user.events_list.includes(event._id) || !event.partecipants_list.includes(user._id))
                            return standardRes(res, 409, "L'utente non è ancora iscritto a questo evento.");

                        Biglietto.find({ _id: user.biglietti_list }, "", (err, biglietti) => {
                            if (errHandler(res, err, "biglietto")) {
                                if (biglietti.length === 0) return standardRes(res, 500, "Nessun biglietto trovato.")

                                let biglietto = (biglietti.filter(biglietto => biglietto.event.equals(event._id)))[0];
                                console.log(biglietto);

                                Biglietto.deleteOne({ _id: biglietto._id }, (err) => {
                                    if (errHandler(res, err, "Errore nell'eliminazione del biglietto.", false)) {

                                        event.number_of_partecipants = event.number_of_partecipants - 1;
                                        event.partecipants_list = event.partecipants_list.filter(partecipant_id => !partecipant_id.equals(user._id));

                                        console.log(event);

                                        user.number_of_events = user.number_of_events - 1;
                                        user.events_list = user.events_list.filter(event_id => !event_id.equals(event._id));

                                        user.number_of_biglietti = user.number_of_biglietti - 1;
                                        user.biglietti_list = user.biglietti_list.filter(biglietto_id => !biglietto_id.equals(biglietto._id));

                                        console.log(user);

                                        event.save((err) => {
                                            if (errHandler(res, err, "Errore nell'aggiornamento di evento.", false)) {
                                                user.save((err) => {
                                                    if (errHandler(res, err, "Errore nell'aggiornamento di utente.", false)) {
                                                        return standardRes(res, 200, "Disiscrizione effettuata.");
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
            }
        });
    }
});

/**
 * @openapi
 * paths:
 *  /api/v2/event/feedback:
 *      patch:
 *          summary: Feedback evento
 *          description: Dato l'id dell'evento desiderato e il feedback, il sistema salva il feedback dell'utente loggato all'evento
 *          security:
 *              - bearerAuth: []
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              event_id:
 *                                  type: string
 *                                  description: Id dell'evento a cui l'utente vuole lasciare un feedback
 *                              feedback:
 *                                  type: integer
 *                                  description: Numero da 0 a 5 di feedback
 *          responses:
 *              200:
 *                  description: Feedback salvato correttamente.
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
 *                                      type: string
 *                                      description: messaggio.
 *                                      example: Feedback salvato correttamente.
 *              401:
 *                  $ref: "#/components/responses/NoToken"
 *              403:
 *                  $ref: "#/components/responses/ForbiddenError"
 *              409:
 *                  description: Nessun evento trovato.
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
routes.patch('/feedback', authenticateToken, (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [req.body.event_id, req.body.feedback]
        )
    ) {
        if (req.body.feedback >= 0 && req.body.feedback <= 5) {
            User.find({ $and: [{ email: req.user.mail }, { account_type: "up" }] }, "", (err, users) => {
                if (errHandler(res, err, "utente")) {
                    if (users.length === 0) return standardRes(res, 500, "Token email o account type errati.")

                    let user = users[0];
                    console.log(user);

                    Event.find({ $and: [{ _id: req.body.event_id }, { _id: user.events_list }] }, "", (err, events) => {
                        if (errHandler(res, err, "evento")) {
                            if (events.length === 0) return standardRes(res, 409, "Nessun evento trovato.")

                            let event = events[0];
                            console.log(event);

                            Biglietto.find({ $and: [{ _id: user.biglietti_list }, { event: event._id }] }, "", (err, biglietti) => {
                                if (errHandler(res, err, "biglietto")) {
                                    if (biglietti.length === 0) return standardRes(res, 500, "Nessun biglietto trovato.")

                                    let biglietto = biglietti[0];
                                    console.log(biglietto);

                                    if (biglietto.exit_datetime === undefined) return standardRes(res, 403, "Il biglietto deve essere disattivato per lasciare un feedback.");

                                    event.feedbacks_list.push(req.body.feedback);

                                    event.number_of_feedbacks = event.number_of_feedbacks + 1;

                                    event.save((err) => {
                                        if (errHandler(res, err, "Errore nel salvataggio del feedback.", false)) {
                                            return standardRes(res, 200, "Feedback salvato correttamente.");
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        } else {
            return standardRes(res, 409, "Il valore del feedback deve essere compreso tra 0 e 5.");
        }
    }
});

routes.use("/get", require("./event_get/event_get"));
routes.use("/photos", require("./photos/photos"));

module.exports = routes;