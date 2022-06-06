const routes = require('express').Router();
const fs = require('fs');
const path = require('path');

const { mongoose, documents, standardRes, bcrypt, saltRounds, upload } = require("../../utils");
const { authenticateToken, generateAccessToken } = require("../../token");
const { requiredParametersErrHandler, errHandler } = require("../../error_handlers");
const { createEmailMessage, sendMail } = require("../../emailer");

const User = mongoose.model("User", documents.userSchema);
const TokenBlackList = mongoose.model("TokenBlackList", documents.tokenBlackListSchema);


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
 *                              $ref: "#/components/schemas/Code200"
 *              409:
 *                  description: Username o email già presenti nel database.
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
routes.get("/check_availability", (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [
                req.query.username, req.query.email
            ]
        )
    ) {
        User.find({ $or: [{ username: req.query.username }, { email: req.query.email }] }, "", (err, users) => {
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
 *                  multipart/form-data:
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
 *                                  format: email
 *                                  description: E-mail dell'utente
 *                              file:
 *                                  type: string
 *                                  format: binary
 *                                  description: Foto profile dell'utente
 *                              birthday:
 *                                  type: string
 *                                  format: date
 *                                  description: Data di nascita dell'utente
 *                              description:
 *                                  type: string
 *                                  description: Descrizione dell'utente
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
 *                              $ref: "#/components/schemas/Code200"
 *              409:
 *                  description: Username o email già presenti nel database.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code409"
 *              422:
 *                  $ref: "#/components/responses/MissingParameters"
 *              500:
 *                  description: Errore nella registrazione.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code500"
 */
routes.post("/signin", upload.single('profile_picture'), (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [
                req.body.name, req.body.surname, req.body.username, req.body.email, req.body.password, req.body.birthday
            ]
        )
    ) {
        User.find({ $or: [{ username: req.query.username }, { email: req.query.email }] }, "", (err, users) => {
            if (errHandler(res, err, "username e email")) {
                if (users.length === 0) {

                    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
                        if (errHandler(res, err, "Errore nella generazione dell'hash della password.", false)) {

                            let profile_picture = "";
                            if(req.file !== undefined){
                                profile_picture = fs.readFileSync(path.resolve('./uploads/' + req.file.filename)).toString('base64');
                                fs.unlinkSync(path.resolve('./uploads/' + req.file.filename));
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
                                profile_picture: profile_picture
                            });

                            user.save((err) => {
                                if (errHandler(res, err, "Errore nella registrazione.", false, 500))
                                    return standardRes(res, 200, "Registrazione avvenuta con successo.");
                            });
                        }
                    });

                } else {
                    return standardRes(res, 409, "Username o email già presenti nel database.");
                }
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
 *          produces:
 *              - application/json
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
 *                                  format: password
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
 *                                  token:
 *                                      type: string
 *                                      description: token
 *                                      example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *              401:
 *                  description: Username o password errate.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code401"
 *              422:
 *                  $ref: "#/components/responses/MissingParameters"
 *              500:
 *                  description: Errore nella ricerca di utente.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code500"
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
        User.find({ $or: [{ username: req.body.username_email }, { email: req.body.username_email }] }, "", (err, users) => {
            if (errHandler(res, err, "username e email")) {

                if (users.length === 0) return standardRes(res, 401, "Username o password errate.");

                let user = users[0];
                console.log(user, req.body.password);

                bcrypt.compare(req.body.password, user.password, function (err, result) {
                    if (errHandler(res, err, "Username o password errate.", false, 401)) {

                        console.log(result);
                        if (!result) return standardRes(res, 401, "Username o password errate.");

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
 *  /api/auth/logout:
 *      post:
 *          summary: Logout
 *          description: Dati username e password il sistema verifica la corrispondenza della password salvata sul database e genera il token in caso di match
 *          security:
 *              - bearerAuth: []
 *          responses:
 *              200:
 *                  description: Logout effettuato con successo.
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
 *                                      example: Logout effettuato con successo.
 *              401:
 *                  $ref: "#/components/responses/NoToken"
 *              403:
 *                  $ref: "#/components/responses/ForbiddenError"
 *              500:
 *                  description: Errore nel logout.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code500"
 */
routes.post("/logout", authenticateToken, (req, res) => {
    console.log(req.user.token);

    const token = new TokenBlackList({
       _id: new mongoose.Types.ObjectId(),
       token: req.user.token
    });

    token.save((err) => {
       if (errHandler(res, err, "Errore nel logout", false)) {
           return standardRes(res, 200, "Logout effettuato con successo.");
       }
    });
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
 *                                          active_event:
 *                                              type: string
 *                                              description: Id evento attivo del turno dipendente.
 *                                              example: 6288ec25fe5bb453c76a62fa
 *              401:
 *                  $ref: "#/components/responses/NoToken"
 *              403:
 *                  $ref: "#/components/responses/ForbiddenError"
 *              500:
 *                  description: Errore nella ricerca dell'utente.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code500"
 */
routes.get('/get_user_info', authenticateToken, (req, res) => {
    User.find({ email: req.user.mail }, "name account_type surname birthday active_event", (err, users) => {
        if (errHandler(res, err, "utente")) {
            if (users.length === 0) return standardRes(res, 500, "Token email errata.");

            let user = users[0];
            console.log(user);

            let to_return = JSON.stringify(user);
            to_return = JSON.parse(to_return);
            delete to_return.account_type;

            if (user.account_type !== "d")
                delete to_return.active_event;

            return standardRes(res, 200, to_return);
        }
    });
});

/**
 * @openapi
 * paths:
 *  /api/auth/get_profile_picture_by_id:
 *      get:
 *          summary: User info
 *          description: Ritorna le informazioni dell'utente loggato
 *          security:
 *              - bearerAuth: []
 *          parameters:
 *              - in: query
 *                name: id
 *                description: Id dell'utente di cui si vuole recuperare l'immagine profilo
 *                required: true
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
 *                                      type: string
 *                                      description: Foto profilo dell'utente.
 *                                      example: /9j/4QSkRXhpZgAASUkqAAgAAAANAAABBAABAAAAo...
 *              401:
 *                  $ref: "#/components/responses/NoToken"
 *              403:
 *                  $ref: "#/components/responses/ForbiddenError"
 *              409:
 *                  description: Nessun utente trovato.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code409"
 *              422:
 *                  $ref: "#/components/responses/MissingParameters"
 *              500:
 *                  description: Errore nella ricerca dell'utente.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code500"
 */
routes.get('/get_profile_picture_by_id', authenticateToken, (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [req.query.id]
        )
    ) {
        User.find({ _id: req.query.id }, (err, users) => {
            if (errHandler(res, err, "utente")) {

                if (users.length === 0) return standardRes(res, 409, "Nessun utente trovato.");

                let user = users[0];
                console.log(user);

                return standardRes(res, 200, user.profile_picture);
            }
        });
    }
});

/**
 * @openapi
 * paths:
 *  /api/auth/validate_token:
 *      get:
 *          summary: Validate token
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
 *                                      type: string
 *                                      description: Tipo account
 *                                      example: "up"
 *              401:
 *                  $ref: "#/components/responses/NoToken"
 *              403:
 *                  $ref: "#/components/responses/ForbiddenError"
 */
routes.get("/validate_token", authenticateToken, (req, res) => {
    return standardRes(res, 200, req.user.role);
});

/**
 * @openapi
 * paths:
 *  /api/auth/recupera_password:
 *      get:
 *          summary: Email per recupero password
 *          description: Invia una email all'email specificata per il recupero della password dell'account collegato a quella email.
 *          parameters:
 *              - in: query
 *                name: email
 *                description: email dell'account di cui recupeare la password.
 *                required: true
 *          responses:
 *              200:
 *                  description: Email inviata.
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
 *                                      example: Email inviata.
 *              409:
 *                  description: Non è stato possibile trovare un utente con questa email.
 *                  content:
 *                      application/json:
 *                          $ref: "#/componentes/schemas/Code409"
 *              422:
 *                  $ref: "#/components/responses/MissingParameters"
 *              500:
 *                  description: Errore nella ricerca di utente.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code500"
 */
routes.get("/recupera_password", (req, res) => {
    if (
        requiredParametersErrHandler(
            res, [req.query.email]
        )
    ) {
        User.find({ email: req.query.email }, "", (err, users) => {
            if (errHandler(res, err, "utente")) {

                if (users.length === 0) return standardRes(res, 409, "Non è stato possibile trovare un utente con questa email.");

                let user = users[0];
                console.log(user);

                let link = "http://localhost:3001/recupero_password?email=" + user.email + "&auth=" + user.password.slice(user.password.length - 10);

                let message = createEmailMessage(
                    user.email,
                    "PartyHub - recupero password",
                    `
                        <p>Hai richiesto un recupero password?</p>
                        <p>Se non sei stato tu puoi ignorare questa email, altrimenti segui il link:</p>
                        <a href="${link}">${link}</a>
                    `);

                sendMail(message)
                    .then((result) => {
                        return standardRes(res, 200, "Email inviata.");
                    })
                    .catch((err) => {
                        errHandler(res, err, "Errore nell'invio dell'email.", false, 500);
                    });
            }
        });
    }
});

/**
 * @openapi
 * paths:
 *  /api/auth/cambia_password:
 *      get:
 *          summary: Cambia password
 *          description: Data l'email di un account, gli ultimi 10 caratteri dell'hash della password vecchia e una nuova password il sistema cambia la password.
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              email:
 *                                  type: string
 *                                  description: Email dell'utente.
 *                              auth:
 *                                  type: string
 *                                  description: Ultimi 10 caratteri dell'hash della vecchia password.
 *                              new_password:
 *                                  type: string
 *                                  format: password
 *                                  description: Nuova password dell'utente.
 *          responses:
 *              200:
 *                  description: Password cambiata correttamente.
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
 *                                      example: Password cambiata correttamente.
 *              403:
 *                  description: Auth errato, prova ad inviare una nuova richeista di cambio password.
 *                  content:
 *                      application/json:
 *                  $ref: "#/components/schemas/Code403"
 *              409:
 *                  description: Errore nel cambio della password.
 *                  content:
 *                      application/json:
 *                          $ref: "#/componentes/schemas/Code409"
 *              422:
 *                  $ref: "#/components/responses/MissingParameters"
 *              500:
 *                  description: Errore nella ricerca di utente.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code500"
 */
routes.patch("/cambia_password", (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [
                req.body.email, req.body.auth, req.body.new_password
            ]
        )
    ) {
        User.find({ email: req.body.email }, "", (err, users) => {
            if (errHandler(res, err, "utente")) {

                if (users.length === 0) return standardRes(res, 409, "Non è stato possibile trovare un utente con questa email.");

                let user = users[0];
                console.log(user);

                if (user.password.slice(user.password.length - 10) !== req.body.auth) return standardRes(res, 403, "Auth errato, prova ad inviare una nuova richeista di cambio password.");

                bcrypt.hash(req.body.new_password, saltRounds, function (err, hash) {
                    if (errHandler(res, err, "Errore nella generazione dell'hash della password.", false)) {
                        user["password"] = hash;

                        user.save((err) => {
                           if (errHandler(res, err, "Errore nell'aggiornamento della password.", false, 500)) {
                               return standardRes(res, 200, "Password cambiata correttamente.");
                           }
                        });
                    }
                });
            }
        });
    }
});

module.exports = routes;