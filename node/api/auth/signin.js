const routes = require('express').Router();
const { mongoose, documents, standardRes, bcrypt, saltRounds } = require("../../utils");
const { authenticateToken, generateAccessToken } = require("../../token");

const User = mongoose.model("User", documents.userSchema);

/**
 * @openapi
 * /check_availability:
 *   post:
 *     description: Dati uno username e una email il sistema controlla se esistono altri utenti con lo stesso username o la stessa email inserite
 *     responses:
 *       200:
 *         description: Username e email disponibili
 *       500:
 *          description: Username o email già presenti nel database
 */

routes.post("/check_availability", (req, res) => {
    User.findOne({"username": req.body.username}, "", (err, result) => {
        if (err) console.log(err);

        if (result === null || result.length === 0)
            return standardRes(res, 200, "Username e email disponibili.");
        else
            return standardRes(res, 500, "Username o email già presenti nel database.");
    });
});

/**
 * @openapi
 * /signin:
 *   post:
 *     description: Dati i dati dell'utente, il sistema inserisce il nuovo utente e genera il token di login
 *     responses:
 *       200:
 *         description: Utente inserito correttamente
 *       500:
 *          description: Utente non inserito correttamente
 */
routes.post("/signin", (req, res) => {
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        if (err) console.log(err);

        const user = new User({
            _id: new mongoose.Types.ObjectId(),
            name: req.body.name,
            surname: req.body.surname,
            username: req.body.username,
            email: req.body.email,
            password: hash,
            birthday: Date.parse(req.body.birthday.replace(/(\d+[/])(\d+[/])/, '$2$1')),
            description: req.body.description,
            // profile_picture: req.body.profile_picture,
        });

        user.save((err) => {
            if (err) {
                console.log(err);
                return standardRes(res, 500, "Errore nella registrazione.");
            }

            return standardRes(res, 200, "Registrazione avvenuta con successo.");
        });
    });
});

module.exports = routes;