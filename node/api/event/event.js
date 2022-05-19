const routes = require('express').Router();
const { mongoose, documents, standardRes, bcrypt, saltRounds } = require("../../utils");
const { authenticateToken, generateAccessToken } = require("../../token");
const axios = require('axios');
const { use } = require('bcrypt/promises');

const User = mongoose.model("User", documents.userSchema);
const GeopositionData = mongoose.model("GeopositionData", documents.geopositionSchema);
const Event = mongoose.model("Event", documents.eventSchema);
const Biglietto = mongoose.model("Biglietto", documents.bigliettoSchema);

/**
 * @openapi
 * /crea:
 *   post:
 *     description: Dati i dati di un evento il sistema aggiunge un nuovo
 *     responses:
 *       200:
 *         description: Evento creato correttamente
 *       409:
 *          description: Errore nella creazione dell'evento o Errore nell'aggiornamento dell'utente o Errore nella richiesta a positionstack APIs
 *       500:
 *          description: Errore nella ricerca di utente o La data di fine evento deve venire dopo della data di inizio evento .
 */
routes.post('/crea', authenticateToken, (req, res) => {
    User.find({ email: req.user.mail }, "", (err, user) => {
        if (err) {
            console.log(err);
            return standardRes(res, 500, "Errore nella ricerca di utente.");
        }

        user = user[0];
        console.log(user);

        if (req.body.start_datetime >= req.body.end_datetime) {
            return standardRes(res, 500, "La data di fine evento deve venire dopo della data di inizio evento.");
        }

        let age_range = req.body.age_range.split('-');

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
                    // code: { type: String, required: true },
                    name: req.body.name,
                    address: geopositionData,
                    start_datetime: req.body.start_datetime,
                    end_datetime: req.body.end_datetime,
                    // poster: Image(),
                    age_range_min: age_range[0],
                    age_range_max: age_range[1],
                    maximum_partecipants: req.body.maximum_partecipants,
                    description: req.body.description,
                    owner: user._id
                });

                event.save((err) => {
                    if (err) {
                        console.log(err);
                        return standardRes(res, 409, "Errore nella creazione dell'evento.");
                    }

                    user.events_list = user.events_list || [];
                    user.events_list.push(event._id);
                    user.number_of_events = user.number_of_events + 1;
                    user.save((err) => {
                        if (err) {
                            console.log(err);
                            return standardRes(res, 409, "Errore nell'aggiornamento dell'utente.");
                        }

                        return standardRes(res, 200, "Evento creato correttamente.");
                    });
                });
            })
            .catch((error) => {
                console.log(error);
                return standardRes(res, 409, "Errore nella richiesta a positionstack APIs.");
            });
    });
});

/**
 * @openapi
 * /get_events:
 *   post:
 *     description: restituisce gli eventi vicini all'utente
 *     responses:
 *       200:
 *         description: eventi trovati
 *       409:
 *          description: Errore nella creazione dell'evento o Errore nell'aggiornamento dell'utente o Errore nella richiesta a positionstack APIs
 *       500:
 *          description: Errore nella ricerca degli eventi.
 */
routes.get('/get_events', authenticateToken, (req, res) => {
    if (req.user.role !== "up") {
        return standardRes(res, 401, "Tipo utente non consetito");
    }

    if (req.query.ext_api !== "false") {

        console.log(req.query);

        const params = {
            access_key: process.env.positionstack_api_key,
            query: req.query.latitude + "," + req.query.longitude,
            output: "json"
        }

        axios.get('http://api.positionstack.com/v1/reverse', { params })
            .then((response) => {
                console.log(response.data.data[0]);
                let data = response.data.data[0];

                Event.find({ "address.locality": data.locality },
                    "",
                    (err, events) => {
                        if (err) {
                            console.log(err);
                            return standardRes(res, 500, "Errore nella ricerca degli eventi.");
                        }

                        console.log(events);
                        return standardRes(res, 200, events);
                    });
            })
            .catch((error) => {
                console.log(error);
                return standardRes(res, 409, "Errore nella richiesta a positionstack APIs.");
            });
    }
    else {
        Event.find({}, "", (err, events) => {
            return standardRes(res, 200, events);
        });
    }
});

/**
 * @openapi
 * /get_events_by_address:
 *   post:
 *     description: restituisce gli eventi vicini all'utente
 *     responses:
 *       200:
 *         description: Evento creato correttamente
 *       409:
 *          description: Errore nella creazione dell'evento o Errore nell'aggiornamento dell'utente o Errore nella richiesta a positionstack APIs
 *       500:
 *          description: Errore nella ricerca degli eventi.
 */
routes.get('/get_events_by_address', authenticateToken, (req, res) => {
    if (req.user.role !== "up") {
        return standardRes(res, 401, "Tipo utente non consetito");
    }

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
                { "address.locality": data.locality },
                // { $or: [{ "address.locality": data.locality }, { "address.reqion": data.region }] },
                "",
                (err, events) => {
                    if (err) {
                        console.log(err);
                        return standardRes(res, 500, "Errore nella ricerca degli eventi.");
                    }

                    console.log(events);
                    return standardRes(res, 200, events);
                });
        })
        .catch((error) => {
            console.log(error);
            return standardRes(res, 409, "Errore nella richiesta a positionstack APIs.");
        });
});

/**
 * @openapi
 * /get_event_by_id:
 *   post:
 *     description: Dati i dati di un utente il sistema aggiunge un iscrizione
 *     responses:
 *       200:
 *         description: Evento creato correttamente
 *       409:
 *          description: Errore nella creazione dell'evento o Errore nell'aggiornamento dell'utente
 *       500:
 *          description: Errore nella ricerca di utente o La data di fine evento deve venire dopo della data di inizio evento.
 */
routes.get('/get_event_by_id', authenticateToken, (req, res) => {
    if (req.user.role !== "up") {
        return standardRes(res, 401, "Tipo utente non consetito");
    }

    console.log(req.query);

    Event.findOne({ _id: req.query.event_id }, "", (err, event) => {
        if (err) {
            console.log(err);
            return standardRes(res, 500, "Errore nella ricerca degli eventi.");
        }

        console.log(event);
        return standardRes(res, 200, event);
    });
});

/**
 * @openapi
 * /iscrizione:
 *   post:
 *     description: Dati i dati di un utente il sistema aggiunge un iscrizione
 *     responses:
 *       200:
 *         description: Evento creato correttamente
 *       409:
 *          description: Errore nella creazione dell'evento o Errore nell'aggiornamento dell'utente
 *       500:
 *          description: Errore nella ricerca di utente o La data di fine evento deve venire dopo della data di inizio evento.
 */
routes.post('/iscrizione', authenticateToken, (req, res) => {
    Event.find({ name: req.body.event_name }, "", (err, event) => {
        if (err) {
            console.log(err);
            return standardRes(res, 500, "Errore nella ricerca di evento.");
        }

        if (event.length === 0) {
            return standardRes(res, 404, "Nessun evento trovato.");
        }

        event = event[0];
        console.log(event);

        if (req.body.number_of_partecipants > req.body.maximum_partecipants) {
            return standardRes(res, 500, "Il numero limite di partecipanti è già stato raggiunto");
        }

        User.find({ email: req.user.mail }, "", (err, user) => {
            if (err) {
                console.log(err);
                return standardRes(res, 500, "Errore nella ricerca di utente.");
            }

            if (user.length === 0) {
                return standardRes(res, 404, "Nessun utente trovato.");
            }

            user = user[0];
            console.log(user);

            user.events_list = user.events_list || [];
            event.partecipants_list = event.partecipants_list || [];
            if (user.events_list.includes(event._id) || event.partecipants_list.includes(user._id)) {
                return standardRes(res, 409, "L'utente è già iscritto a questo evento.");
            }

            const biglietto = new Biglietto({
                _id: new mongoose.Types.ObjectId(),
                event: event._id
            });

            biglietto.save((err) => {
                if (err) {
                    console.log(err);
                    return standardRes(res, 409, "Errore nella creazione del biglietto.");
                }

                user.events_list.push(event._id);
                user.number_of_events = user.number_of_events + 1;

                user.biglietti_list.push(biglietto._id);
                user.number_of_biglietti = user.number_of_biglietti + 1;

                user.save((err) => {
                    if (err) {
                        console.log(err);
                        return standardRes(res, 409, "Errore nell'aggiornamento dell'utente.");
                    }

                    event.partecipants_list.push(user._id);
                    event.number_of_partecipants = user.number_of_partecipants + 1;

                    event.save((err) => {
                        if (err) {
                            console.log(err);
                            return standardRes(res, 409, "Errore nell'aggiornamento dell'evento.");
                        }
                        return standardRes(res, 200, "Utente iscritto all'evento correttamente.");
                    });
                });
            });
        });
    });
});

module.exports = routes;