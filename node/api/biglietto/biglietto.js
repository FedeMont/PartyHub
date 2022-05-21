const routes = require('express').Router();
const { mongoose, documents, standardRes, bcrypt, saltRounds } = require("../../utils");
const { authenticateToken, generateAccessToken } = require("../../token");

const User = mongoose.model("User", documents.userSchema);
const Product = mongoose.model("Product", documents.productSchema);
const Event = mongoose.model("Event", documents.eventSchema);
const Biglietto = mongoose.model("Biglietto", documents.bigliettoSchema);

/**
 * @openapi
 * paths:
 *   /biglietti/get_biglietti_futuri_by_user:
 *     get:
 *       description: Dati i dati di un servizio il sistema aggiunge un nuovo servizio
 *       responses:
 *         '200':
 *            description: Servizi inviati correttamente
 *         '409':
 *            description: Errore nell caricamento dei servizi
 */
routes.get('/get_biglietti_futuri_by_user', authenticateToken, (req, res) => {
    User.find({ $and: [{ email: req.user.mail }, { account_type: "up" }] }, "", (err, user) => {
        if (err) {
            console.log(err);
            return standardRes(res, 500, "Errore nella ricerca di utente.");
        }

        if (user.length === 0) {
            return standardRes(res, 401, "Non ti è possibile cercare biglietti");
        }

        user = user[0];
        console.log("User: ", user);

        let biglietti_ids = user.biglietti_list;
        Biglietto.find({ _id: biglietti_ids }, "", (err, biglietti) => {
            if (err) {
                console.log(err);
                return standardRes(res, 500, "Errore nella ricerca dei biglietti.");
            }

            console.log("Biglietti: ", biglietti);

            let event_ids = [];
            biglietti.forEach((biglietto) => {
                event_ids.push(biglietto.event);
            });

            Event.find({ $and: [{ _id: event_ids, start_datetime: { $gte: new Date() }}] }, "", (err, events) => {
                if (err) {
                    console.log(err);
                    return standardRes(res, 500, "Errore nella ricerca degli eventi.");
                }

                console.log("Eventi:", events);

                let biglietti_futuri_list = [];

                for (let event in events) {
                    // console.log(event);

                    let biglietto_futuro = {};
                    biglietto_futuro["biglietto_id"] = biglietti[event]._id;
                    biglietto_futuro["evento_id"] = events[event]._id;
                    biglietto_futuro["event_name"] = events[event].name;
                    biglietto_futuro["event_start_datetime"] = events[event].start_datetime;

                    biglietti_futuri_list.push(biglietto_futuro);
                }

                return standardRes(res, 200, biglietti_futuri_list);
            });
        });
    });
});

/**
 * @openapi
 * paths:
 *   /biglietti/get_biglietti_scaduti_by_user:
 *     get:
 *       description: Dati i dati di un servizio il sistema aggiunge un nuovo servizio
 *       responses:
 *         '200':
 *            description: Servizi inviati correttamente
 *         '409':
 *            description: Errore nell caricamento dei servizi
 */
routes.get('/get_biglietti_scaduti_by_user', authenticateToken, (req, res) => {
    User.find({ $and: [{ email: req.user.mail }, { account_type: "up" }] }, "", (err, user) => {
        if (err) {
            console.log(err);
            return standardRes(res, 500, "Errore nella ricerca di utente.");
        }

        if (user.length === 0) {
            return standardRes(res, 401, "Non ti è possibile cercare biglietti");
        }

        user = user[0];
        console.log("User: ", user);

        let biglietti_ids = user.biglietti_list;
        Biglietto.find({ _id: biglietti_ids }, "", (err, biglietti) => {
            if (err) {
                console.log(err);
                return standardRes(res, 500, "Errore nella ricerca dei biglietti.");
            }

            console.log("Biglietti: ", biglietti);

            let event_ids = [];
            biglietti.forEach((biglietto) => {
                event_ids.push(biglietto.event);
            });

            Event.find({ $and: [{ _id: event_ids, end_datetime: { $lte: new Date() }}] }, "", (err, events) => {
                if (err) {
                    console.log(err);
                    return standardRes(res, 500, "Errore nella ricerca degli eventi.");
                }

                console.log("Eventi:", events);

                let biglietti_futuri_list = [];

                for (let event in events) {
                    // console.log(event);

                    let biglietto_futuro = {};
                    biglietto_futuro["biglietto_id"] = biglietti[event]._id;
                    biglietto_futuro["evento_id"] = events[event]._id;
                    biglietto_futuro["event_name"] = events[event].name;
                    biglietto_futuro["event_start_datetime"] = events[event].start_datetime;

                    biglietti_futuri_list.push(biglietto_futuro);
                }

                return standardRes(res, 200, biglietti_futuri_list);
            });
        });
    });
});

/**
 * @openapi
 * paths:
 *   /biglietti/activate:
 *     get:
 *       description: Dati i dati di un servizio il sistema aggiunge un nuovo servizio
 *       responses:
 *         '200':
 *            description: Servizi inviati correttamente
 *         '409':
 *            description: Errore nell caricamento dei servizi
 */
routes.post('/activate', authenticateToken, (req, res) => {
    User.find({ $and: [{ email: req.user.mail }, { account_type: "up" }] }, "", (err, user) => {
        if (err) {
            console.log(err);
            return standardRes(res, 500, "Errore nella ricerca di utente.");
        }

        if (user.length === 0) {
            return standardRes(res, 401, "Non ti è possibile cercare biglietti");
        }

        user = user[0];
        console.log("User: ", user);

        Biglietto.find({ _id: req.body.biglietto_id }, "", (err, biglietto) => {
            if (err) {
                console.log(err);
                return standardRes(res, 500, "Errore nella ricerca dei biglietti.");
            }

            if (biglietto.length === 0) {
                return standardRes(res, 401, "Non ti è possibile cercare biglietti");
            }

            biglietto = biglietto[0];
            console.log("Biglietti: ", biglietto);

            if (!biglietto.event.equals(req.body.event_id)) {
                return standardRes(res, 401, "Non ti è possibile attivare il biglietto per questo evento.");
            }

            biglietto.entrance_datetime = new Date();
            biglietto.save((err) => {
                if (err) {
                    console.log(err);
                    return standardRes(res, 500, "Errore nell'attivazione del biglietto.");
                }

                Event.find({ _id: biglietto.event }, "name address start_datetime end_datetime description", (err, event) => {
                    if (err) {
                        console.log(err);
                        return standardRes(res, 500, "Errore nella ricerca dell'evento.");
                    }

                    if (event.length === 0) {
                        return standardRes(res, 409, "Nessun evento trovato.");
                    }

                    event = event[0];
                    console.log("User: ", event);

                    biglietto.event = event;

                    return standardRes(res, 200, biglietto);
                });
            });
        });
    });
});

/**
 * @openapi
 * paths:
 *   /biglietto/get_products:
 *     get:
 *       description: Dati i dati di un servizio il sistema aggiunge un nuovo servizio
 *       responses:
 *         '200':
 *            description: Servizi inviati correttamente
 *         '409':
 *            description: Errore nell caricamento dei servizi
 */
routes.get('/get_products', authenticateToken, (req, res) => {
    User.find({ $and: [{ email: req.user.mail }, { account_type: "up" }] }, "", (err, user) => {
        if (err) {
            console.log(err);
            return standardRes(res, 500, "Errore nella ricerca di utente.");
        }

        if (user.length === 0) {
            return standardRes(res, 401, "Non ti è possibile cercare biglietti");
        }

        user = user[0];
        console.log("User: ", user);

        Biglietto.find({ _id: req.query.biglietto_id }, "", (err, biglietto) => {
            if (err) {
                console.log(err);
                return standardRes(res, 500, "Errore nella ricerca dei biglietti.");
            }

            if (biglietto.length === 0) {
                return standardRes(res, 401, "Non ti è possibile cercare biglietti");
            }

            biglietto = biglietto[0];
            console.log("Biglietti: ", biglietto);

            if (biglietto.entrance_datetime === null || biglietto.entrance_datetime === undefined) {
                return standardRes(res, 409, "Biglieto non attivo.");
            }

            return standardRes(res, 200, biglietto);
        });
    });
});

module.exports = routes;