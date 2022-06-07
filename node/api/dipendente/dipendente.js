const routes = require('express').Router();
const { mongoose, documents, standardRes, bcrypt, saltRounds } = require("../../utils");
const { authenticateToken } = require("../../token");
const { requiredParametersErrHandler, errHandler } = require("../../error_handlers");
const { createEmailMessage, sendMail } = require("../../emailer");

const User = mongoose.model("User", documents.userSchema);
const Event = mongoose.model("Event", documents.eventSchema);
const Service = mongoose.model("Service", documents.serviceSchema);


/**
 * @openapi
 * paths:
 *  /dipendente/crea:
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

                if (users.length === 0) return standardRes(res, 500, "Token email o account type errati.");

                let user = users[0];
                console.log(users);

                Event.find({ $and: [{ _id: req.body.events_list }, { owner: user._id }] }, "", (err, events) => {
                    if (errHandler(res, err, "eventi")) {
                        if (events.length === 0) return standardRes(res, 409, "Nessun evento trovato.");

                        console.log(events);

                        Service.find({ $and: [{ _id: req.body.services_list }, { owner: user._id }] }, "", (err, services) => {
                            if (errHandler(res, err, "servizi")) {
                                if (services.length === 0) return standardRes(res, 409, "Nessun servizio trovato.");

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
                                            if (errHandler(res, err, "Errore nella registrazione del dipendente.", false)) {

                                                user.dipendenti_list = user.dipendenti_list || [];
                                                user.dipendenti_list.push(dipendente._id);
                                                user.number_of_dipendenti = user.number_of_dipendenti + 1;

                                                user.save((err) => {
                                                    if (errHandler(res, err, "Errore nell'aggiornamento dell'utente.", false)) {

                                                        let link = "https://partyhub.herokuapp.com/recupera_password"

                                                        let message = createEmailMessage(
                                                            dipendente.email,
                                                            "PartyHub - benvenuto come diependente",
                                                            `
                                                                <p>Il tuo account di tipo dipendente è stato attivato</p>
                                                                <p>Le tue credenziali di accesso sono:</p>
                                                                <p>Email: ${dipendente.email}</p>
                                                                <p>Password: ${dipendente.email}</p>
                                                                <p>Ti consigliamo di effettuare un recupero password seguendo le istruzioni presso:</p>
                                                                <a href="${link}">${link}</a>
                                                            `);

                                                        sendMail(message)
                                                            .then((result) => {
                                                                return standardRes(res, 200, "Dipendente creato correttamente.");
                                                            })
                                                            .catch((err) => {
                                                                errHandler(res, err, "Errore nell'invio dell'email.", false);
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
    }
});

/**
 * @openapi
 * paths:
 *  /dipendente/activate_turno:
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
 *                  $ref: "#/components/responses/NoToken"
 *              403:
 *                  $ref: "#/components/responses/ForbiddenError"
 *              409:
 *                  description: Non ti è possibile attivare il turno per questo evento.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code409"
 *              422:
 *                  $ref: "#/components/responses/MissingParameters"
 *              500:
 *                  description: Errore nell'attivazione del turno.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code500"
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
                if (users.length === 0) return standardRes(res, 500, "Token email o account type errati.");

                let user = users[0];
                console.log(user);

                Event.find({ _id: req.body.event_id }, "", (err, events) => {
                    if (errHandler(res, err, "eventi")) {
                        if (events.length === 0) return standardRes(res, 409, "Nessun evento trovato.");

                        let event = events[0];
                        console.log(event);

                        if (!user.events_list.includes(event._id.toString())) return standardRes(res, 409, "Non ti è possibile attivare il turno per questo evento.");

                        user.active_event = event._id;
                        user.save((err) => {
                            if (errHandler(res, err, "Errore nell'attivazione del turno.", false)) {
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
 *  /dipendente/get_dipendenti:
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
 *                  $ref: "#/components/responses/NoToken"
 *              403:
 *                  $ref: "#/components/responses/ForbiddenError"
 *              500:
 *                  description: Errore nella ricerca di utente.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/component/schemas/Code500"
 */
routes.get('/get_dipendenti', authenticateToken, (req, res) => {
    User.find({ $and: [{ email: req.user.mail }, { account_type: "o" }] }, "", (err, users) => {
        if (errHandler(res, err, "utente")) {

            if (users.length === 0) return standardRes(res, 500, "Token email o account type errati.");

            let user = users[0];
            console.log(user);

            User.find({ $and: [{ _id: user.dipendenti_list }, { account_type: "d" }] }, "name surname email events_list services_list")
                .populate("events_list")
                .populate("services_list")
                .exec()
                .then(dipendenti => {
                    console.log(dipendenti);
                    if (dipendenti.length === 0) return standardRes(res, 200, []);

                    let to_return = [];

                    dipendenti.forEach(dipendente => {
                        let dipendente_info = {};
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

/**
 * @openapi
 * paths:
 *  /dipendente/modifica:
 *      put:
 *          summary: Modifica il dipendente
 *          description: Dato l'id, il nome, il cognome, la lista degli eventi e dei servizi del dipendente modifica le sue informazioni
 *          security:
 *              - bearerAuth: []
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              id:
 *                                  type: string
 *                                  description: Id del dipendente
 *                              name:
 *                                  type: string
 *                                  description: Nome del dipendente
 *                              surname:
 *                                  type: string
 *                                  description: Cognome del dipendente
 *                              events_list:
 *                                  type: array
 *                                  items:
 *                                      type: string
 *                                      description: Nome dell' evento.
 *                                      example: Evento
 *                              services_list:
 *                                  type: array
 *                                  items:
 *                                      type: string
 *                                      description: Nome del servizio.
 *                                      example: Servizio
 *          responses:
 *              200:
 *                  description: Dipendente modificato.
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
 *                                      example: Dipendente modificato.
 *              401:
 *                  $ref: "#/components/responses/NoToken"
 *              403:
 *                  $ref: "#/components/responses/ForbiddenError"
 *              409:
 *                  description: Nessun dipendente trovato.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code409"
 *              422:
 *                  $ref: "#/components/responses/MissingParameters"
 *              500:
 *                  description: Errore nella ricerca di dipendente.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code500"
 */
routes.put('/modifica', authenticateToken, (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [req.body.id, req.body.name, req.body.surname, req.body.services_list, req.body.events_list]
        )
    ) {
        User.find({ $and: [{ email: req.user.mail }, { account_type: "o" }] }, "", (err, users) => {
            if (errHandler(res, err, "utente")) {

                if (users.length === 0) return standardRes(res, 500, "Token email o account type errati.");

                let user = users[0];
                console.log(users);

                User.find({ $and: [{ _id: req.body.id }, { _id: user.dipendenti_list }] }, "", (err, dipendenti) => {
                    if (errHandler(res, err, "dipendente")) {
                        if (dipendenti.length === 0) return standardRes(res, 409, "Nessun dipendente trovato.");

                        let dipendente = dipendenti[0];
                        console.log(dipendente);

                        Event.find({ _id: req.body.events_list }, "", (err, events) => {
                           if (errHandler(res, err, "eventi")) {
                               if (events.length === 0) return standardRes(res, 409, "Nessun evento trovato.");

                               Service.find({ _id: req.body.services_list }, "", (err, services) => {
                                   if (errHandler(res, err, "servizi")) {
                                        if (services.length === 0) return standardRes(res, 409, "Nessun servizio trovato.");

                                        dipendente["name"] = req.body.name;
                                        dipendente["surname"] = req.body.surname;
                                        dipendente["number_of_services"] = req.body.services_list.length;
                                        dipendente["services_list"] = req.body.services_list;
                                        dipendente["events_list"] = req.body.events_list;
                                        dipendente["number_of_events"] = req.body.events_list.length;

                                        if (!req.body.active_event)
                                            dipendente["active_event"] = undefined;

                                        dipendente.save((err) => {
                                            if (errHandler(res, err, "Errore nell'aggiornamento del dipendente", false)) {
                                                return standardRes(res, 200, "Dipendente modificato.");
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
 *  /dipendente/get_by_id:
 *      get:
 *          summary: Informazioni del dipendente
 *          description: Dato l'id di un dipendente ritorna le informazioni di quel dipendente
 *          security:
 *              - bearerAuth: []
 *          parameters:
 *              - name: dipendente_id
 *                in: query
 *                required: true
 *                description: Id del dipendente
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
 *                                      type: object
 *                                      properties:
 *                                          _id:
 *                                              type: string
 *                                              description: Id del dipendente.
 *                                              example: 6288ec25fe5bb453c76a62fa
 *                                          name:
 *                                              type: string
 *                                              description: Nome del dipendente.
 *                                              example: Nome dipendente
 *                                          surname:
 *                                              type: string
 *                                              description: Cognome del dipendente.
 *                                              example: Cognome dipendente
 *                                          email:
 *                                              type: string
 *                                              description: Email del dipendente.
 *                                              example: nome.cognome@email.com
 *                                          number_of_services:
 *                                              type: integer
 *                                              description: Numero di servizi appartenenti al dipendente.
 *                                              example: 3
 *                                          services_list:
 *                                              type: array
 *                                              items:
 *                                                  type: string
 *                                                  description: Id del servizio.
 *                                                  example: 6288ec25fe5bb453c76a62fa
 *                                          number_of_events:
 *                                              type: integer
 *                                              description: Numero di eventi appartenenti al dipendente.
 *                                              example: 3
 *                                          events_list:
 *                                              type: array
 *                                              items:
 *                                                  type: string
 *                                                  description: Id dell' evento.
 *                                                  example: 6288ec25fe5bb453c76a62fa
 *              401:
 *                  $ref: "#/components/responses/NoToken"
 *              403:
 *                  $ref: "#/components/responses/ForbiddenError"
 *              409:
 *                  description: Nessun dipendente trovato.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code409"
 *              422:
 *                  $ref: "#/components/responses/MissingParameters"
 *              500:
 *                  description: Errore nella ricerca di dipendente.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code500"
 */
routes.get('/get_by_id', authenticateToken, (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [req.query.dipendente_id]
        )
    ) {
        User.find({ $and: [{ email: req.user.mail }, { account_type: "o" }] }, "", (err, users) => {
            if (errHandler(res, err, "utente")) {

                if (users.length === 0) return standardRes(res, 500, "Token email o account type errati.");

                let user = users[0];
                console.log(users);

                User.find({ $and: [{ _id: req.query.dipendente_id }, { _id: user.dipendenti_list }] }, "", (err, dipendenti) => {
                    if (errHandler(res, err, "dipendente")) {
                        if (dipendenti.length === 0) return standardRes(res, 409, "Nessun dipendente trovato.");

                        let dipendente = dipendenti[0];
                        console.log(dipendente);

                        return standardRes(res, 200, dipendente);
                    }
                });
            }
        });
    }
});

module.exports = routes;