const routes = require('express').Router();
const { mongoose, documents, standardRes, bcrypt, saltRounds } = require("../../utils");
const { authenticateToken } = require("../../token");
const { requiredParametersErrHandler, errHandler } = require("../../error_handlers");

const User = mongoose.model("User", documents.userSchema);
const Event = mongoose.model("Event", documents.eventSchema);
const Service = mongoose.model("Service", documents.serviceSchema);

/**
 * @openapi
 * paths:
 *  /api/dipendente/crea:
 *      post:
 *          summary: Creazione dipendente
 *          description: Dati i dati del dipendente, dei servizi e degli eventi inseriti dall'utente, il sistema inserisce il nuovo utente dipendente e manda una mail
 *          security:
 *              - bearerAuth: []
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              name:
 *                                  type: string
 *                                  description: Nome del dipendente
 *                              surname:
 *                                  type: string
 *                                  description: Cognome del dipendente
 *                              email:
 *                                  type: string
 *                                  format: email
 *                                  description: E-mail del dipendente
 *                              events_list:
 *                                  type: array
 *                                  items:
 *                                      type: string
 *                                  description: Lista degli id degli eventi in cui il dipendente dovrà lavorare
 *                              services_list:
 *                                  type: array
 *                                  items:
 *                                      type: string
 *                                  description: Lista degli id dei servizi assegnati al dipendente
 *          responses:
 *              200:
 *                  description: Registrazione avvenuta con successo.
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
 *                                      example: Registrazione avvenuta con successo.
 *              401:
 *                  $ref: "#/components/responses/NoToken"
 *              409:
 *                  description: Errore nella registrazione del dipendente.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: object
 *                              properties:
 *                                  status:
 *                                      type: integer
 *                                      description: http status.
 *                                      example: 401
 *                                  message:
 *                                      type: string
 *                                      description: messaggio.
 *                                      example: Errore nella registrazione del dipendente.
 *              500:
 *                  description: Errore nella generazione dell'hash della password.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: object
 *                              properties:
 *                                  status:
 *                                      type: integer
 *                                      description: http status.
 *                                      example: 500
 *                                  message:
 *                                      type: string
 *                                      description: messaggio.
 *                                      example: Errore nella generazione dell'hash della password.
 */
// TODO: Implementare invio della mail
routes.post('/crea', authenticateToken, (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [
                req.body.name, req.body.surname, req.body.email, req.body.events_list, req.body.services_list
            ]
        )
    ) {
        User.find({ $and: [{ email: req.user.mail }, { account_type: "o" }] }, "", (err, users) => {
            if (errHandler(res, err, "utente")) {

                if (users.length === 0) return standardRes(res, 401, "Non ti è possibile creare dipendenti");

                let user = users[0];
                console.log(users);

                Event.find({ $and: [{ _id: req.body.events_list }, { owner: user._id }] }, "", (err, events) => {
                    if (errHandler(res, err, "eventi")) {
                        if (events.length === 0) return standardRes(res, 401, "Non ti è possibile creare dipendenti legati a questi eventi.");

                        console.log(events);

                        Service.find({ $and: [{ _id: req.body.services_list }, { owner: user._id }] }, "", (err, services) => {
                            if (errHandler(res, err, "servizi")) {
                                if (services.length === 0) return standardRes(res, 401, "Non ti è possibile creare dipendenti legati a questi servizi.");

                                console.log(services);

                                bcrypt.hash(req.body.email, saltRounds, function (err, hash) {
                                    if (errHandler(res, err, "Errore nella generazione dell'hash della password.", false)) {

                                        const dipendente = new User({
                                            _id: new mongoose.Types.ObjectId(),
                                            name: req.body.name,
                                            surname: req.body.surname,
                                            username: req.body.email,
                                            email: req.body.email,
                                            events_list: req.body.events_list,
                                            number_of_events: req.body.events_list.length,
                                            services_list: req.body.services_list,
                                            number_of_services: req.body.services_list.length,
                                            password: hash,
                                            account_type: "d"
                                        });

                                        dipendente.save((err) => {
                                            if (errHandler(res, err, "Errore nella registrazione del dipendente.", false, 409)) {

                                                user.dipendenti_list = user.dipendenti_list || [];
                                                user.dipendenti_list.push(dipendente._id);
                                                user.number_of_dipendenti = user.number_of_dipendenti + 1;

                                                user.save((err) => {
                                                    if (errHandler(res, err, "Errore nell'aggiornamento dell'utente.", false, 409)) {
                                                        return standardRes(res, 200, "Dipendente creato correttamente.");
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
 *  /api/dipendente/activate_turno:
 *      post:
 *          summary: Attivazione turno dipendente
 *          description: Dato l'id di un evento legato all'utente viene attivato il turno per quell'evento
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
 *                                  description: Id dell'evento di cui attivare il turno
 *          responses:
 *              200:
 *                  description: Turno attivato.
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
 *                                      example: Turno attivato.
 *              401:
 *                  description: Non ti è possibile attivare il turno per questo evento.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: object
 *                              properties:
 *                                  status:
 *                                      type: integer
 *                                      description: http status.
 *                                      example: 401
 *                                  message:
 *                                      type: string
 *                                      description: messaggio.
 *                                      example: Non ti è possibile attivare il turno per questo evento.
 *              409:
 *                  description: Errore nell'attivazione del turno.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: object
 *                              properties:
 *                                  status:
 *                                      type: integer
 *                                      description: http status.
 *                                      example: 401
 *                                  message:
 *                                      type: string
 *                                      description: messaggio.
 *                                      example: Errore nell'attivazione del turno.
 *              500:
 *                  description: Errore nell'attivazione del turno.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: object
 *                              properties:
 *                                  status:
 *                                      type: integer
 *                                      description: http status.
 *                                      example: 500
 *                                  message:
 *                                      type: string
 *                                      description: messaggio.
 *                                      example: Errore nell'attivazione del turno.
 */
routes.post('/activate_turno', authenticateToken, (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [req.body.event_id]
        )
    ) {
        User.find({ $and: [{ email: req.user.mail }, { account_type: "d" }] }, "", (err, users) => {
            if (errHandler(res, err, "utente")) {
                if (users.length === 0) return standardRes(res, 401, "Non ti è possibile attivare il turno.");

                let user = users[0];
                console.log(user);

                Event.find({ _id: req.body.event_id }, "", (err, events) => {
                    if (errHandler(res, err, "eventi")) {
                        if (events.length === 0) return standardRes(res, 409, "Non ti è possibile attivare il turno per questo evento.");

                        let event = events[0];
                        console.log(event);

                        if (!user.events_list.includes(event._id.toString())) return standardRes(res, 401, "Non ti è possibile attivare il turno per questo evento.");

                        user.active_event = event._id;
                        user.save((err) => {
                            if (errHandler(res, err, "Errore nell'attivazione del turno.", false, 409)) {
                                return standardRes(res, 200, "Turno attivato.");
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
 *  /api/dipendente/get_dipendenti:
 *      get:
 *          summary: Ritorna i dipendenti
 *          description: Restituisce i dipendenti dell'utente loggato
 *          security:
 *              - bearerAuth: []
 *          responses:
 *              200:
 *                  description: Dipendenti.
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
 *                                                  description: Id del dipendente.
 *                                                  example: 6288ec25fe5bb453c76a62fa
 *                                              name:
 *                                                  type: string
 *                                                  description: Nome del dipendente.
 *                                                  example: Nome dipendente
 *                                              cognome:
 *                                                  type: string
 *                                                  description: Cognome del dipendente.
 *                                                  example: Cognome dipendente
 *                                              number_of_services:
 *                                                  type: integer
 *                                                  description: Numero di servizi appartenenti al dipendente.
 *                                                  example: 3
 *                                              services_list:
 *                                                  type: array
 *                                                  items:
 *                                                      type: string
 *                                                      description: Nome del servizio.
 *                                                      example: Servizio
 *                                              number_of_events:
 *                                                  type: integer
 *                                                  description: Numero di eventi appartenenti al dipendente.
 *                                                  example: 3
 *                                              events_list:
 *                                                  type: array
 *                                                  items:
 *                                                      type: string
 *                                                      description: Nome dell' evento.
 *                                                      example: Evento
 *              401:
 *                  description: Token email errata.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: object
 *                              properties:
 *                                  status:
 *                                      type: integer
 *                                      description: http status.
 *                                      example: 401
 *                                  message:
 *                                      type: string
 *                                      description: messaggio.
 *                                      example: Token email errata.
 *              500:
 *                  description: Errore nella ricerca di utente.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: object
 *                              properties:
 *                                  status:
 *                                      type: integer
 *                                      description: http status.
 *                                      example: 500
 *                                  message:
 *                                      type: string
 *                                      description: messaggio.
 *                                      example: Errore nella ricerca di utente.
 */
routes.get('/get_dipendenti', authenticateToken, (req, res) => {
    User.find({ $and: [{ email: req.user.mail }, { account_type: "o" }] }, "", (err, users) => {
        if (errHandler(res, err, "utente")) {

            if (users.length === 0) return standardRes(res, 401, "Non ti è possibile cercare dipendenti.");

            let user = users[0];
            console.log(user);

            User.find({ $and: [{ _id: user.dipendenti_list }, { account_type: "d" }] }, "name surname email events_list services_list").populate("events_list").populate("services_list").exec().then(dipendenti => {
                console.log(dipendenti);

                let to_return = [];

                dipendenti.forEach(dipendente => {
                    dipendente_info = {};
                    dipendente_info["_id"] = dipendente._id;
                    dipendente_info["name"] = dipendente.name;
                    dipendente_info["surname"] = dipendente.surname;
                    dipendente_info["email"] = dipendente.email;

                    dipendente_info["events_list"] = [];
                    dipendente.events_list.forEach(event => {
                        let events_list = {};
                        events_list["name"] = event.name;
                        events_list["start_datetime"] = event.start_datetime;
                        events_list["address"] = event.address.label;
                        dipendente_info["events_list"].push(events_list);
                    });

                    console.log(dipendente_info.events_list);
                    dipendente_info["services_list"] = [];
                    dipendente.services_list.forEach(service => {
                        let services_list = {};
                        services_list["name"] = service.name;
                        dipendente_info["services_list"].push(services_list);
                    });

                    to_return.push(dipendente_info);
                });

                console.log(to_return);

                return standardRes(res, 200, to_return);
            })
                .catch(err => {
                    errHandler(res, err, "dipendenti");
                });
        }
    });
});

module.exports = routes;