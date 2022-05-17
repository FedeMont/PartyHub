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
 *       409:
 *          description: Username o email già presenti nel database
 *       500:
 *          description: Errore nella ricerca di username
 */
routes.post("/check_availability", (req, res) => {
    User.findOne({username: req.body.username}, "", (err, result) => {
        if (err) {
            console.log(err);
            return standardRes(res, 500, "Errore nella ricerca di username.")
        }

        if (result === null || result.length === 0)
            return standardRes(res, 200, "Username e email disponibili.");
        else
            return standardRes(res, 409, "Username o email già presenti nel database.");
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
 *       409:
 *          description: Utente non inserito correttamente
 *       500:
 *          description: Errore nella generazione dell'hash della password
 */
routes.post("/signin", (req, res) => {
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        if (err) {
            console.log(err);
            return standardRes(res, 500, "Errore nella generazione dell'hash della password.");
        }

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
                return standardRes(res, 409, "Errore nella registrazione.");
            }

            return standardRes(res, 200, "Registrazione avvenuta con successo.");
        });
    });
});

/**
 * @openapi
 * /login:
 *   post:
 *     description: Dati username e password il sistema verifica la corrispondenza della password salvata sul database e genera il token
 *     responses:
 *       200:
 *          description: Username e password corrette
 *       401:
 *          description: Username o password errate
 *       500:
 *          description: Errore nella ricerca di username
 */
routes.post('/login', (req, res) => {
    User.find({ username: req.body.username_email}, "", (err, user) => {
        if (err) {
            console.log(err);
            return standardRes(res, 500, "Errore nella ricerca di username.");
        }

        if (user !== null || user.length !== 0) {
            user = user[0];
            console.log(user, req.body.password);

            bcrypt.compare(req.body.password, user.password, function (err, result) {
                if (err) {
                    console.log(err);
                    return standardRes(res, 401, "Username o password errate.");
                }
                else {
                    console.log(result);
                    let token = generateAccessToken(user.email, user.account_type, user.name + " " + user.surname);
                    return standardRes(res, 200, "Login avvenuto con successo.", token);
                }
            });
        } else {
            return standardRes(res, 401, "Username o password errate.");
        }
    });
});

module.exports = routes;