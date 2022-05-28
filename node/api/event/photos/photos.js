const routes = require('express').Router();
const multer = require("multer");
const fs = require('fs');
const path = require('path');

const { mongoose, documents, standardRes } = require("../../../utils");
const { authenticateToken } = require("../../../token");
const { requiredParametersErrHandler, errHandler } = require("../../../error_handlers");

const User = mongoose.model("User", documents.userSchema);
const eventPhoto = mongoose.model("EventPhoto", documents.eventPhotoSchema);
const Event = mongoose.model("Event", documents.eventSchema);
const Biglietto = mongoose.model("Biglietto", documents.bigliettoSchema);


var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});

var upload = multer({ storage: storage });

function add_photos(req, res, user) {
    Event.find({ _id: req.body.event_id }, "", (err, events) => {
        if (errHandler(res, err, "evento")) {
            if (events.length === 0) return standardRes(res, 409, "Evento non trovato");
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
                if (errHandler(res, err, "Errore nel caricamento delle foto.", false, 409)) {
                    return standardRes(res, 200, "Foto caricate correttamente");
                }
            }
            )
        }
    })
}



/**
 * @openapi
 * paths:
 *  /api/event/photos/add:
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
 *                                      example: Evento creato correttamente.
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
 *              409:
 *                  description: Errore nell caricamento del file.
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
 *                                      example: Errore nella creazione dell'evento.
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
routes.post('/add', authenticateToken, upload.array('photos'), (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [req.body.event_id]
        )
    ) {
        User.find({ email: req.user.mail }, "", (err, users) => {
            if (errHandler(res, err, "utente")) {

                if (users.length === 0) return standardRes(res, 409, "Utente non trovato");


                let user = users[0];
                console.log(user);

                if (user.account_type === "d") return standardRes(res, 401, "Non ti è possibile caricare foto");

                if (user.account_type === "up") {

                    Biglietto.find({ $and: [{ _id: user.biglietti_list }, { event: req.body.event_id }, { entrance_datetime: { $ne: null } }, { exit_datetime: { $ne: null } }] }, "", (err, biglietti) => {
                        if (errHandler(res, err, "biglietto")) {
                            if (biglietti.length === 0) return standardRes(res, 409, "Non ti è possibile caricacare foto se non appartieni all'evento o non sei ancora uscito dal party ");

                            add_photos(req, res, user);
                        }
                    })

                }

                if (user.account_type === "o") {
                    if (!user.events_list.includes(req.body.event_id)) return standardRes(res, 401, "Non ti è possibile caricare foto per eventi non tuoi");

                    add_photos(req, res, user);
                }
            }
        });
    }
});

module.exports = routes;