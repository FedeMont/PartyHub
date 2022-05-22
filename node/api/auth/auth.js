const routes = require('express').Router();
const { mongoose, documents, standardRes, bcrypt, saltRounds } = require("../../utils");
const { authenticateToken, generateAccessToken } = require("../../token");

const { requiredParametersErrHandler, errHandler } = require("../../error_handlers");

const User = mongoose.model("User", documents.userSchema);

/**
 * @openapi
 * paths:
 *  /api/auth/check_availability:
 *      get:
 *          summary: Ritorna la disponibilità di username & email
 *          parameters:
 *              - name: username
 *                in: query
 *                required: true
 *                description: Username da ricercare
 *              - name: email
 *                in: query
 *                required: true
 *                description: E-mail da ricercare
 *                format: email
 *          responses:
 *              200:
 *                  description: Username e email disponibili.
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
 *                                      example: Username e email disponibili.
 *              409:
 *                  description: Username o email già presenti nel database.
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
 *                                      example: Username o email già presenti nel database.
 *              422:
 *                  description: Parametri mancanti.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: object
 *                              properties:
 *                                  status:
 *                                      type: integer
 *                                      description: http status.
 *                                      example: 422
 *                                  message:
 *                                      type: string
 *                                      description: messaggio.
 *                                      example: Parametri mancanti.
 *
 *              500:
 *                  description: Errore nella ricerca di username e email.
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
 *                                      example: Errore nella ricerca di username e email.
 */
routes.get("/check_availability", (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [
                req.query.username, req.query.email
            ]
        )
    ) {
        User.find({$or: [{username: req.query.username}, {email: req.query.email}]}, "", (err, users) => {
            if (errHandler(res, err, "username e email")) {
                if (users.length === 0)
                    return standardRes(res, 200, "Username e email disponibili.");
                else
                    return standardRes(res, 409, "Username o email già presenti nel database.");
            }
        });
    }
});

/**
 * @openapi
 * paths:
 *  /api/auth/signin:
 *      post:
 *          summary: Creazione account
 *          description: Dati i dati dell'utente, il sistema inserisce il nuovo utente
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              name:
 *                                  type: string
 *                                  description: Nome dell'utente
 *                              surname:
 *                                  type: string
 *                                  description: Cognome dell'utente
 *                              username:
 *                                  type: string
 *                                  description: Nome utente dell'utente
 *                              email:
 *                                  type: string
 *                                  fromat: email
 *                                  description: E-mail dell'utente
 *                              birthday:
 *                                  type: string
 *                                  format: date
 *                                  description: Data di nascita dell'utente
 *                              description:
 *                                  type: string
 *                                  description: Descrizione dell'utente
 *                              user_profile:
 *                                  type: string
 *                                  description: Foto profilo dell'utente
 *                              password:
 *                                  type: string
 *                                  format: password
 *                                  description: Password dell'utente
 *          responses:
 *              200:
 *                  description: Registrazione avvenuta con successo.
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
 *                                      example: Registrazione avvenuta con successo.
 *              409:
 *                  description: Errore nella registrazione.
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
 *                                      example: Errore nella registrazione.
 *              422:
 *                  description: Parametri mancanti.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: object
 *                              properties:
 *                                  status:
 *                                      type: integer
 *                                      description: http status.
 *                                      example: 422
 *                                  message:
 *                                      type: string
 *                                      description: messaggio.
 *                                      example: Parametri mancanti.
 *
 *              500:
 *                  description: Errore nella generazione dell'hash della password.
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
 *                                      example: Errore nella generazione dell'hash della password.
 */
routes.post("/signin", (req, res) => {
    if (
        requiredParametersErrHandler(
            res, [
            req.body.name, req.body.surname, req.body.username, req.body.email, req.body.password, req.body.birthday
            ]
        )
    ) {
        bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
            if (errHandler(res, err, "Errore nella generazione dell'hash della password.", false)) {

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
                    if (errHandler(res, err, "Errore nella registrazione.", false, 409))
                        return standardRes(res, 200, "Registrazione avvenuta con successo.");
                });
            }
        });
    }
});

/**
 * @openapi
 * paths:
 *  /api/auth/login:
 *      post:
 *          summary: Login
 *          description: Dati username e password il sistema verifica la corrispondenza della password salvata sul database e genera il token in caso di match
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              username_email:
 *                                  type: string
 *                                  description: Username o email dell'utente
 *                              password:
 *                                  type: string
 *                                  fromat: password
 *                                  description: Password dell'utente
 *          responses:
 *              200:
 *                  description: Login avvenuto con successo.
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
 *                                      example: Login avvenuto con successo.
 *                                  permissions:
 *                                      type: string
 *                                      description: token
 *                                      example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *              401:
 *                  description: Username o password errate.
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
 *                                      example: Username o password errate.
 *              422:
 *                  description: Parametri mancanti.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: object
 *                              properties:
 *                                  status:
 *                                      type: integer
 *                                      description: http status.
 *                                      example: 422
 *                                  message:
 *                                      type: string
 *                                      description: messaggio.
 *                                      example: Parametri mancanti.
 *
 *              500:
 *                  description: Errore nella ricerca di username e email.
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
 *                                      example: Errore nella ricerca di username e email.
 */
routes.post('/login', (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [
                req.body.username_email, req.body.password
            ]
        )
    ) {
        User.find({ $or: [{username: req.body.username_email}, {email: req.body.username_email}] }, "", (err, users) => {
            if (errHandler(res, err, "username e email")) {

                if (users.length === 0) return standardRes(res, 401, "Username o password errate.");

                let user = users[0];
                console.log(user, req.body.password);

                bcrypt.compare(req.body.password, user.password, function (err, result) {
                    if (errHandler(res, err, "Username o password errate.", false, 401)) {
                        let token = generateAccessToken(user.email, user.account_type, user.name + " " + user.surname);
                        return standardRes(res, 200, "Login avvenuto con successo.", token);
                    }
                });
            }
        });
    }
});

/**
 * @openapi
 * paths:
 *  /api/auth/get_user_info:
 *      get:
 *          summary: User info
 *          description: Ritorna le informazioni dell'utente loggato
 *          security:
 *              - bearerAuth: []
 *          responses:
 *              200:
 *                  description: Token valido.
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
 *                                      type: object
 *                                      properties:
 *                                          _id:
 *                                              type: string
 *                                              description: Id dell'utente.
 *                                              example: 6288ec25fe5bb453c76a62fa
 *                                          name:
 *                                              type: string
 *                                              description: Il nome dell'utente.
 *                                              example: Nome
 *                                          surnname:
 *                                              type: string
 *                                              description: Il cognome dell'utente.
 *                                              example: Cognome
 *                                          birthday:
 *                                              type: string
 *                                              format: date
 *                                              description: Data di nascita dell'utente
 *                                              example: 2000-05-21T00:00:00.000Z
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
 *              500:
 *                  description: Errore nella ricerca dell'utente.
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
 *                                      example: Errore nella ricerca dell'utente.
 */
routes.get('/get_user_info', authenticateToken, (req, res) => {
    User.find({ email: req.user.mail }, "name surname birthday", (err, users) => {
        if (errHandler(res, err, "dell'utente")) {

            if (users.length === 0) return standardRes(res, 401, "Token email errata.");

            let user = users[0];
            console.log(user);
            return standardRes(res, 200, user);
        }
    });
});

module.exports = routes;