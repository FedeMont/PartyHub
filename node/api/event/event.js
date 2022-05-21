const routes = require('express').Router();
const { mongoose, documents, standardRes, bcrypt, saltRounds } = require("../../utils");
const { authenticateToken, generateAccessToken } = require("../../token");
const axios = require('axios');

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

    User.find({ email: req.user.mail }, "", (err, user) => {
        if (err) {
            console.log(err);
            return standardRes(res, 500, "Errore nella ricerca di utente.");
        }

        user = user[0];
        console.log(user);

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

                    Event.find({ $or: [{ "address.locality": data.locality }, { "address.region": data.region }] },
                        "",
                        (err, events) => {
                            if (err) {
                                console.log(err);
                                return standardRes(res, 500, "Errore nella ricerca degli eventi.");
                            }

                            let to_return = [];

                            events.forEach((event) => {
                                let event_info = {};
                                event_info["_id"] = event._id;
                                event_info["name"] = event.name;
                                event_info["address"] = event.address;
                                event_info["start_datetime"] = event.start_datetime;
                                event_info["number_of_partecipants"] = event.number_of_partecipants;
                                event_info["description"] = event.description;
                                if (event.partecipants_list.includes(user._id)) {
                                    event_info["is_user_iscritto"] = true;
                                }
                                to_return.push(event_info);
                            });

                            console.log(events);
                            return standardRes(res, 200, to_return);
                        });
                })
                .catch((error) => {
                    console.log(error);
                    return standardRes(res, 409, "Errore nella richiesta a positionstack APIs.");
                });
        }
        else {
            Event.find({}, "", (err, events) => {
                let to_return = [];

                events.forEach((event) => {
                    let event_info = {};
                    event_info["_id"] = event._id;
                    event_info["name"] = event.name;
                    event_info["address"] = event.address;
                    event_info["start_datetime"] = event.start_datetime;
                    event_info["number_of_partecipants"] = event.number_of_partecipants;
                    event_info["description"] = event.description;
                    if (event.partecipants_list.includes(user._id)) {
                        event_info["is_user_iscritto"] = true;
                    }
                    to_return.push(event_info);
                });

                console.log(events);
                return standardRes(res, 200, to_return);
            });
        }
    });
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
                    event.number_of_partecipants = event.number_of_partecipants + 1;

                    console.log(event);

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

/**
 * @openapi
 * /disiscrizione:
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
routes.post('/disiscrizione', authenticateToken, (req, res) => {
    if (req.user.role !== "up") return standardRes(res, 401, "Non ti è possibile disiscriverti da un evento.");

    Event.find({ _id: req.body.event_id }, "", (err, event) => {
        if (err) {
            console.log(err);
            return standardRes(res, 500, "Errore nella ricerca di evento.");
        }

        if (event.length === 0) {
            return standardRes(res, 404, "Nessun evento trovato.");
        }

        event = event[0];
        console.log("Event: ", event);
        //
        // if (req.body.number_of_partecipants > req.body.maximum_partecipants) {
        //     return standardRes(res, 500, "Il numero limite di partecipanti è già stato raggiunto");
        // }

        User.find({ email: req.user.mail }, "", (err, user) => {
            if (err) {
                console.log(err);
                return standardRes(res, 500, "Errore nella ricerca di utente.");
            }

            if (user.length === 0) {
                return standardRes(res, 404, "Nessun utente trovato.");
            }

            user = user[0];
            console.log("User: ", user);

            Biglietto.find({ _id: user.biglietti_list }, "", (err, biglietti) => {
                if (err) {
                    console.log(err);
                    return standardRes(res, 500, "Errore nella ricerca di biglietto.");
                }

                if (biglietti.length === 0) {
                    return standardRes(res, 404, "Nessun biglietto trovato.");
                }

                console.log("Biglietti: ", biglietti);
                let biglietto = (biglietti.filter(biglietto => biglietto.event.equals(event._id)))[0];
                console.log("Biglietto: ", biglietto);

                Biglietto.deleteOne({ _id: biglietto._id }, (err) => {
                    if (err) {
                        console.log(err);
                        return standardRes(res, 500, "Errore nell'eliminazione del biglietto.");
                    }

                    event.number_of_partecipants = event.number_of_partecipants - 1;
                    event.partecipants_list = event.partecipants_list.filter(partecipant_id => !partecipant_id.equals(user._id));

                    user.number_of_events = user.number_of_events - 1;
                    user.events_list = user.events_list.filter(event_id => !event_id.equals(event._id));

                    user.number_of_biglietti = user.number_of_biglietti - 1;
                    user.biglietti_list = user.biglietti_list.filter(biglietto_id => !biglietto_id.equals(biglietto._id));

                    event.save((err) => {
                        if (err) {
                            console.log(err);
                            return standardRes(res, 500, "Errore nell'aggiornamento di evento.");
                        }

                        user.save((err) => {
                            if (err) {
                                console.log(err);
                                return standardRes(res, 500, "Errore nell'aggiornamento di utente.");
                            }

                            return standardRes(res, 200, "Disiscrizione effettuata.");
                        });
                    });
                });
            });
        });
    });
});



/**
 * @openapi
 * paths:
 *   /event/get_events_by_user:
 *     get:
 *       description: Dato il token di un utente, restituisce la lista di tutti gli eventi associati
 *       responses:
 *         '200':
 *            description: Eventi inviati correttamente
 *         '409':
 *            description: Errore nell caricamento degli eventi
 */
 routes.get('/get_events_by_user', authenticateToken, (req, res) => {
    User.find({ email: req.user.mail}, "", (err, user) => {
        if (err) {
            console.log(err);
            return standardRes(res, 500, "Errore nella ricerca di utente.");
        }
        if (user.length === 0) {
            return standardRes(res, 404, "Non è stato trovato nessun utente");
        }

        user = user[0];
        console.log(user);

        let event_ids = user.events_list;
        console.log(event_ids);

        Event.find({ _id: event_ids }, "name start_datetime", (err, events) => {
            if (err) {
                console.log(err);
                return standardRes(res, 500, "Errore nella ricerca degli eventi.");
            }
            return standardRes(res, 200, events);
        });
    });
});

/**
 * @openapi
 * /get_event_by_biglietto_id:
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
routes.get('/get_event_by_biglietto_id', authenticateToken, (req, res) => {
    if (req.user.role !== "up") {
        return standardRes(res, 401, "Tipo utente non consetito");
    }

    console.log(req.query);

    Biglietto.find({ _id: req.query.biglietto_id } , "", (err, biglietto) => {
        if (err) {
            console.log(err);
            return standardRes(res, 500, "Errore nella ricerca dei biglietti.");
        }

        if (biglietto.length === 0) {
            return standardRes(res, 409, "Nessun biglietto trovato");
        }

        biglietto = biglietto[0];
        console.log("Biglietti: ", biglietto);

        Event.find({ _id: biglietto.event }, "name start_datetime", (err, event) => {
            if (err) {
                console.log(err);
                return standardRes(res, 500, "Errore nella ricerca degli eventi.");
            }

            if (event.length === 0) {
                return standardRes(res, 409, "Nessun evento trovato");
            }

            event = event[0];

            let to_return = {}
            if (biglietto.entrance_datetime !== null) {
                to_return["biglietto_active"] = true;
                to_return["name"] = event.name;
                to_return["start_datetime"] = event.start_datetime;
                to_return["_id"] = event._id;
            }

            console.log(event);
            return standardRes(res, 200, to_return);
        });
    });


});


module.exports = routes;