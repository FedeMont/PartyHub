const routes = require('express').Router();
const { mongoose, documents, standardRes, bcrypt, saltRounds } = require("../../utils");
const { authenticateToken, generateAccessToken } = require("../../token");
const axios = require('axios');
const { use } = require('bcrypt/promises');

const User = mongoose.model("User", documents.userSchema);

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
module.exports = routes;