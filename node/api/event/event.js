const routes = require('express').Router();
const { mongoose, documents, standardRes, bcrypt, saltRounds } = require("../../utils");
const { authenticateToken, generateAccessToken } = require("../../token");
const axios = require('axios');

const User = mongoose.model("User", documents.userSchema);
const GeopositionData = mongoose.model("GeopositionData", documents.geopositionSchema);
const Event = mongoose.model("Event", documents.eventSchema);

/**
 * @openapi
 * /crea:
 *   post:
 *     description: Dati i dati di un evento il sistema aggiunge un nuovo
 *     responses:
 *       200:
 *         description: Evento creato correttamente
 *       409:
 *          description: Errore nella creazione dell'evento o Errore nell'aggiornamento dell'utente
 *       500:
 *          description: Errore nella ricerca di utente o La data di fine evento deve venire dopo della data di inizio evento.
 */
routes.post('/crea', authenticateToken, (req, res) => {
    User.find({email: req.user.mail}, "", (err, user) => {
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

        axios.get('http://api.positionstack.com/v1/forward', {params})
        .then(response => {
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

        }).catch(error => {
            console.log(error);
            return standardRes(res, 500, "Errore nella richiesta a positionstack APIs.");
        });
    });


});

module.exports = routes;