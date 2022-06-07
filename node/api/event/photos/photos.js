const routes = require('express').Router();
const fs = require('fs');
const path = require('path');

const { mongoose, documents, standardRes, upload } = require("../../../utils");
const { authenticateToken } = require("../../../token");
const { requiredParametersErrHandler, errHandler } = require("../../../error_handlers");

const User = mongoose.model("User", documents.userSchema);
const eventPhoto = mongoose.model("EventPhoto", documents.eventPhotoSchema);
const Event = mongoose.model("Event", documents.eventSchema);
const Biglietto = mongoose.model("Biglietto", documents.bigliettoSchema);


function add_photos(req, res, user) {
    Event.find({ $and: [{ _id: req.body.event_id }, { _id: user.events_list }] }, "", (err, events) => {
        if (errHandler(res, err, "evento")) {
            if (events.length === 0) return standardRes(res, 409, "Nessun evento trovato.");
            let event = events[0];
            console.log(event);

            // cons
            event.gallery = event.gallery || [];
            req.files.forEach(file => {
                event.gallery.push(new eventPhoto({
                    photo: fs.readFileSync(path.resolve('./uploads/' + file.filename)).toString('base64'),
                    user: user._id,
                }));
                fs.unlinkSync(path.resolve('./uploads/' + file.filename));
            });

            event.number_of_photos = event.gallery.length;

            event.save((err) => {
                if (errHandler(res, err, "Errore nel caricamento delle foto.", false)) {
                    return standardRes(res, 200, "Foto caricate correttamente.");
                }
            });
        }
    });
}

function get_photos(event_id, only_owner_photos, res, user) {
    Event.find({ $and: [{ _id: event_id }, { _id: user.events_list } ]}, "", (err, events) => {
        if (events.length === 0) return standardRes(res, 409, "Nessun evento trovato.");
        let event = events[0];
        console.log("Only owner photos: " + only_owner_photos);
        console.log(event.gallery);

        let res_photos = []
        event.gallery.forEach((photo) => {
            if (only_owner_photos) {
                if (photo.user.equals(event.owner)) res_photos.push(photo.photo);
            } else {
                res_photos.push(photo.photo);
            }
        });

        return standardRes(res, 200, res_photos);
    });
}


/**
 * @openapi
 * paths:
 *  /api/v2/event/photos/add:
 *      post:
 *          summary: Aggiunta foto ad evento
 *          description: Dati i dati dell'utente, l'id dell'evento e le foto selezionate, il sistema inserisce le foto all'evento
 *          security:
 *              - bearerAuth: []
 *          requestBody:
 *              required: true
 *              content:
 *                  multipart/form-data:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              photos:
 *                                  type: array
 *                                  items:
 *                                     type: string
 *                                     format: binary
 *                              event_id:
 *                                  type: string
 *                                  description: Event id
 *          responses:
 *              200:
 *                  description: Foro caricata correttamente.
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
 *                                      example: Foto caricate correttamente.
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
routes.post('/add', authenticateToken, upload.array('photos'), (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [req.body.event_id, req.files]
        )
    ) {
        User.find({ email: req.user.mail }, "", (err, users) => {
            if (errHandler(res, err, "utente")) {

                if (users.length === 0) return standardRes(res, 500, "Token email o account type errati.");

                let user = users[0];
                console.log(user);

                if (user.account_type === "d") return standardRes(res, 401, "Non ti è possibile caricare foto");

                if (user.account_type === "up") {

                    Biglietto.find(
                    { $and: [
                            { _id: user.biglietti_list },
                            { event: req.body.event_id },
                            { entrance_datetime: { $ne: null } },
                            { exit_datetime: { $ne: null } }
                        ] },
                    "",
                    (err, biglietti) => {
                        if (errHandler(res, err, "biglietto")) {
                            if (biglietti.length === 0) return standardRes(res, 409, "Non ti è possibile caricare foto se non sei iscritto all'evento o non sei ancora uscito dal party.");

                            add_photos(req, res, user);
                        }
                    });
                }

                if (user.account_type === "o") {
                    if (!user.events_list.includes(req.body.event_id)) return standardRes(res, 401, "Non ti è possibile caricare foto per eventi non tuoi.");

                    add_photos(req, res, user);
                }
            }
        });
    }
});

/**
 * @openapi
 * paths:
 *  /api/v2/event/photos/get_photos:
 *      get:
 *          summary:  Ritorna le foto degli eventi in base ai permessi
 *          description: Restituisce la lista contenente le immagini caricate all'evento. Vengono restituite in base ai permessi e alla partecipazione all'evento da parte dell'utente
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
 *                                  description: ID dell'evento di riferimento
 *          responses:
 *              200:
 *                  description: Foto dell'evento.
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
 *                                              photo:
 *                                                  type: string
 *                                                  description: Foto base64.
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
routes.get('/get_photos', authenticateToken, (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [req.query.event_id]
        )
    ) {
        User.find({ email: req.user.mail }, "", (err, users) => {
            if (errHandler(res, err, "utente")) {
                if (users.length === 0) return standardRes(res, 500, "Token email o account type errati.");

                let user = users[0];
                console.log(user);

                if (user.account_type === "d") return standardRes(res, 401, "Non ti è possibile visualizzare le foto dell'evento.");

                if (user.account_type === "o") {
                    if (!user.events_list.includes(req.query.event_id)) return standardRes(res, 401, "Non ti è possibile visualizzare le foto per eventi non creati da te.");
                    get_photos(req.query.event_id, false, res, user);
                }

                if (user.account_type === "up") {
                    Biglietto.find({ $and: [{ _id: user.biglietti_list }, { event: req.query.event_id }, { entrance_datetime: { $ne: null } }, { exit_datetime: { $ne: null } }] }, "", (err, biglietti) => {
                        if (errHandler(res, err, "biglietto")) {
                            let only_owner_photos = (biglietti.length === 0);
                            get_photos(req.query.event_id, only_owner_photos, res, user);
                        }
                    });
                }
            }
        });
    }
});

module.exports = routes;