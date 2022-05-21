const routes = require('express').Router();
const { mongoose, documents, standardRes, bcrypt, saltRounds } = require("../../utils");
const { authenticateToken, generateAccessToken } = require("../../token");

const User = mongoose.model("User", documents.userSchema);
const Event = mongoose.model("Event", documents.eventSchema);

/**
 * @openapi
 * paths:
 *   /dipendente/crea:
 *     post:
 *       description: Dati i dati di un servizio inseriti dall'utente, il sistema inserisce il nuovo utente e manda una mail
 *       security:
 *         -BearerAuth:
 *            -type: http
 *            -scheme: bearer
 *       responses:
 *         '200':
 *            description: Dipendente inserito correttamente
 *         '409':
 *            description: Dipendente non inserito correttamente
 *         '401':
 *            description: Permessi non sufficenti
 *         '500':
 *            description: Errore nella ricerca dell'utente richiedente
 *       parameters:
 *               - in: path
 *                 name: name
 *                 type: String
 *                 required: true
 *                 description: Nome del dipendente
 *               - in: path
 *                 name: surname
 *                 type: String
 *                 required: true
 *                 description: Cognome del dipendente
 *               - in: path
 *                 name: email
 *                 type: String
 *                 required: true
 *                 description: Email del dipendente
 *               - in: path
 *                 name: events_list
 *                 type: Array
 *                 required: true
 *                 description: Array contenente la lista di eventi da associare
 *               - in: path
 *                 name: services_list
 *                 type: Array
 *                 required: true
 *                 description: Array contenente la lista di servizi da associare
 */
// TODO: Implementare invio della mail
routes.post('/crea', authenticateToken, (req, res) => {
    User.find({ $and: [{ email: req.user.mail }, { account_type: "o" }] }, "", (err, user) => {
        if (err) {
            console.log(err);
            return standardRes(res, 500, "Errore nella ricerca di utente.");
        }
        if (user.length === 0) {
            return standardRes(res, 401, "Non ti è possibile creare dipendenti");
        }

        user = user[0];
        console.log(user);

        bcrypt.hash(req.body.email, saltRounds, function (err, hash) {
            if (err) {
                console.log(err);
                return standardRes(res, 500, "Errore nella generazione dell'hash della password.");
            }

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
                password: hash
            });

            dipendente.save((err) => {
                if (err) {
                    console.log(err);
                    return standardRes(res, 409, "Errore nella registrazione del dipendente.");
                }

                return standardRes(res, 200, "Registrazione avvenuta con successo.");
            });
        });
    });
});

/**
 * @openapi
 * paths:
 *   /dipendente/activate_turno:
 *     post:
 *       description: Dati i dati di un servizio inseriti dall'utente, il sistema inserisce il nuovo utente e manda una mail
 *       security:
 *         -BearerAuth:
 *            -type: http
 *            -scheme: bearer
 *       responses:
 *         '200':
 *            description: Dipendente inserito correttamente
 *         '409':
 *            description: Dipendente non inserito correttamente
 *         '401':
 *            description: Permessi non sufficenti
 *         '500':
 *            description: Errore nella ricerca dell'utente richiedente
 *       parameters:
 *               - in: path
 *                 name: name
 *                 type: String
 *                 required: true
 *                 description: Nome del dipendente
 *               - in: path
 *                 name: surname
 *                 type: String
 *                 required: true
 *                 description: Cognome del dipendente
 *               - in: path
 *                 name: email
 *                 type: String
 *                 required: true
 *                 description: Email del dipendente
 *               - in: path
 *                 name: events_list
 *                 type: Array
 *                 required: true
 *                 description: Array contenente la lista di eventi da associare
 *               - in: path
 *                 name: services_list
 *                 type: Array
 *                 required: true
 *                 description: Array contenente la lista di servizi da associare
 */
// TODO: Implementare invio della mail
routes.post('/activate_turno', authenticateToken, (req, res) => {
    User.find({ $and: [{ email: req.user.mail }, { account_type: "d" }] }, "", (err, user) => {
        if (err) {
            console.log(err);
            return standardRes(res, 500, "Errore nella ricerca di utente.");
        }
        if (user.length === 0) {
            return standardRes(res, 401, "Non ti è possibile creare dipendenti");
        }

        user = user[0];
        console.log(user);

        Event.find({ _id: req.body.event_id }, "", (err, event) => {
            if (err) {
                console.log(err);
                return standardRes(res, 500, "Errore nella ricerca di eventi.");
            }
            if (event.length === 0) {
                return standardRes(res, 409, "Non è stato trovato alcun evento.");
            }

            event = event[0];
            console.log(event);

            if (!user.events_list.includes(event._id.toString())) {
                return standardRes(res, 409, "Non ti è possibile attivare il turno per questo evento.");
            }

            user.active_event = event._id;
            user.save((err) => {
                if (err) {
                    console.log(err);
                    return standardRes(res, 500, "Errore nell'attivazione del turno.");
                }

                return standardRes(res, 200, "Turno attivato.");
            });
        });

    });
});
module.exports = routes;