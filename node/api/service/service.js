const routes = require('express').Router();
const { mongoose, documents, standardRes } = require("../../utils");
const { authenticateToken } = require("../../token");
const { requiredParametersErrHandler, errHandler } = require("../../error_handlers");

const User = mongoose.model("User", documents.userSchema);
const Product = mongoose.model("Product", documents.productSchema);
const Service = mongoose.model("Service", documents.serviceSchema);
const Biglietto = mongoose.model("Biglietto", documents.bigliettoSchema);


/**
 * @openapi
 * paths:
 *  /api/v2/service/crea:
 *      post:
 *          summary: Crea servizio
 *          description: Dati i dati del servizio e dei prodotti il sistema crea il nuovo servizio
 *          security:
 *              - bearerAuth: []
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              name:
 *                                  type: string
 *                                  description: Nome del servizio
 *                              products:
 *                                  type: array
 *                                  items:
 *                                      name:
 *                                          type: string
 *                                          description: Nome del prodotto
 *                                      price:
 *                                          type: integer
 *                                          description: Prezzo del prodotto
 *          responses:
 *              200:
 *                  description: Servizio creato correttamente.
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
 *                                      example: Servizio creato correttamente.
 *              401:
 *                  $ref: "#/components/responses/NoToken"
 *              403:
 *                  $ref: "#/components/responses/ForbiddenError"
 *              422:
 *                  $ref: "#/components/responses/MissingParameters"
 *              500:
 *                  description: Errore nella ricerca di utente.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code500"
 */
routes.post('/crea', authenticateToken, (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [req.body.name, req.body.products]
        )
    ) {
        User.find({ $and: [{ email: req.user.mail }, { account_type: "o" }] }, "", (err, users) => {
            if (errHandler(res, err, "utente")) {

                if (users.length === 0)  return standardRes(res, 500, "Token email o account type errati.");

                let user = users[0];
                console.log(user);

                let products = [];
                req.body.products.forEach(product => {
                    products.push(new Product({
                        name: product.name,
                        price: product.price,
                    }));
                });

                const service = new Service({
                    _id: new mongoose.Types.ObjectId(),
                    owner: user._id,
                    name: req.body.name,
                    number_of_products: products.length,
                    products_list: products
                });

                service.save((err) => {
                    if (errHandler(res, err, "Errore nella creazione del servizio.", false)) {
                        user.services_list = user.services_list || [];
                        user.services_list.push(service._id);
                        user.number_of_services = user.number_of_services + 1;

                        user.save((err) => {
                            if (errHandler(res, err, "Errore nell'aggiornamento dell'utente.", false)) {
                                return standardRes(res, 200, "Servizio creato correttamente.");
                            }
                        });
                    }
                });
            }
        });
    }
});

/**
 * @openapi
 * paths:
 *  /api/v2/service/get_servizi:
 *      get:
 *          summary: Ritorna i servizi
 *          description: Restituisce i servizi dell'utente loggato
 *          security:
 *              - bearerAuth: []
 *          responses:
 *              200:
 *                  description: Servizi.
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
 *                                              _id:
 *                                                  type: string
 *                                                  description: Id del servizo.
 *                                                  example: 6288ec25fe5bb453c76a62fa
 *                                              owner:
 *                                                  type: string
 *                                                  description: Id del proprietario del servizio (eg. l'utente loggato).
 *                                                  example: 6288ec25fe5bb453c76a62fa
 *                                              name:
 *                                                  type: string
 *                                                  description: Nome del servizo.
 *                                                  example: Nome servizio
 *                                              number_of_products:
 *                                                  type: integer
 *                                                  description: Numero di prodotti all'interno del servizio.
 *                                                  example: 3
 *                                              products_list:
 *                                                  type: array
 *                                                  items:
 *                                                      type: object
 *                                                      properties:
 *                                                          name:
 *                                                              type: string
 *                                                              description: Nome del prodotto
 *                                                              example: Long Island
 *                                                          price:
 *                                                              type: integer
 *                                                              description: Prezzo del prodotto
 *                                                              example: 7.0
 *              401:
 *                  $ref: "#/components/responses/NoToken"
 *              403:
 *                  $ref: "#/components/responses/ForbiddenError"
 *              500:
 *                  description: Errore nella ricerca di utente.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code500"
 */
routes.get('/get_servizi', authenticateToken, (req, res) => {
    User.find({ email: req.user.mail }, "", (err, users) => {
        if (errHandler(res, err, "utente")) {

            if (users.length === 0) return standardRes(res, 500, "Token email errata.");

            let user = users[0];
            console.log(user);

            if (!["o", "d"].includes(user.account_type)) return standardRes(res, 403, "Non ti è possibile cercare i servizi.");

            let projection = (user.account_type === "o")? "name" : "";

            let service_ids = user.services_list;
            Service.find({_id: service_ids}, projection, (err, services) => {
                if (errHandler(res, err, "servizi")) {
                    if (services.length === 0) return standardRes(res, 200, []);
                    return standardRes(res, 200, services);
                }
            });
        }
    });
});

/**
 * @openapi
 * paths:
 *  /api/v2/service/get_by_id:
 *      get:
 *          summary: Informazioni del servizio
 *          description: Dato l'id di un servizio ritorna le informazioni di quel servizio
 *          security:
 *              - bearerAuth: []
 *          parameters:
 *              - name: service_id
 *                in: query
 *                required: true
 *                description: Id del servizio
 *          responses:
 *              200:
 *                  description: Servizi.
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
 *                                      $ref: "#/components/schemas/Service"
 *              401:
 *                  $ref: "#/components/responses/NoToken"
 *              403:
 *                  $ref: "#/components/responses/ForbiddenError"
 *              409:
 *                  description: Nessun servizio trovato.
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
routes.get('/get_by_id', authenticateToken, (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [req.query.service_id]
        )
    ) {
        User.find({ $and: [{ email: req.user.mail },  { account_type: "o" }] }, "", (err, users) => {
            if (errHandler(res, err, "utente")) {
                if (users.length === 0) return standardRes(res, 500, "Token email o account type errati.");

                let user = users[0];
                console.log(user);

                Service.find({ $and: [{ _id: req.query.service_id }, { _id: user.services_list }] }, "", (err, services) => {
                    if (errHandler(res, err, "servizio")) {
                        if (services.length === 0) return standardRes(res, 409, "Nessun servizio trovato.");

                        let service = services[0];
                        console.log(service);

                        if (!service.owner.equals(user._id)) return standardRes(res, 403, "Non ti è possibile recuperare questo servizio.");

                        return standardRes(res, 200, service);
                    }
                });
            }
        });
    }
});

/**
 * @openapi
 * paths:
 *  /api/v2/service/modifica:
 *      put:
 *          summary: Modifica il servizio
 *          description: Dato l'id di un servizio modifica le sue informazioni
 *          security:
 *              - bearerAuth: []
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              id:
 *                                  type: string
 *                                  description: Id del servizio
 *                              name:
 *                                  type: string
 *                                  description: Nome del servizio
 *                              products:
 *                                  type: array
 *                                  items:
 *                                      name:
 *                                          type: string
 *                                          description: Nome del prodotto
 *                                      price:
 *                                          type: integer
 *                                          description: Prezzo del prodotto
 *          responses:
 *              200:
 *                  description: Servizio modificato.
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
 *                                      example: Servizio modificato.
 *              401:
 *                  $ref: "#/components/responses/NoToken"
 *              403:
 *                  $ref: "#/components/responses/ForbiddenError"
 *              409:
 *                  description: Nessun servizio trovato.
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
routes.put('/modifica', authenticateToken, (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [req.body.id, req.body.name, req.body.products]
        )
    ) {
        User.find({ $and: [{ email: req.user.mail },  { account_type: "o" }] }, "", (err, users) => {
            if (errHandler(res, err, "utente")) {
                if (users.length === 0) return standardRes(res, 500, "Token email o account type errati.");

                let user = users[0];
                console.log(user);

                Service.find({ $and: [{ _id: req.body.id }, { _id: user.services_list }] }, "", (err, services) => {
                    if (errHandler(res, err, "servizio")) {
                        if (services.length === 0) return standardRes(res, 409, "Nessun servizio trovato.");

                        let service = services[0];
                        console.log(service);

                        if (!service.owner.equals(user._id)) return standardRes(res, 403, "Non ti è possibile recuperare questo servizio.");

                        service["name"] = req.body.name;
                        service["products_list"] = req.body.products;

                        service.save((err) => {
                            if (errHandler(res, err, "Errore nell'aggiornamento del servizio", false)) {
                                return standardRes(res, 200, "Servizio modificato.");
                            }
                        });
                    }
                });
            }
        });
    }
});

/**
 * @openapi
 * paths:
 *  /api/v2/service/sell_products:
 *      post:
 *          summary: Vendita prodotti
 *          description: Dati l'id di un biglietto e la lista degli id dei prodotti il sistema accredita i prodotti al biglietto
 *          security:
 *              - bearerAuth: []
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              biglietto_id:
 *                                  type: string
 *                                  description: Id del biglietto.
 *                              products_list:
 *                                  type: array
 *                                  items:
 *                                      type: string
 *                                      description: Id del prodotto
 *          responses:
 *              200:
 *                  description: Servizi.
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
 *                                      example: Prodotti accreditati.
 *              401:
 *                  $ref: "#/components/responses/NoToken"
 *              403:
 *                  $ref: "#/components/responses/ForbiddenError"
 *              409:
 *                  description: Nessun servizio trovato.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code409"
 *              422:
 *                  $ref: "#/components/responses/MissingParameters"
 *              500:
 *                  description: Errore nella ricerca di servizio.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/Code500"
 */
routes.post('/sell_products', authenticateToken, (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [
                req.body.biglietto_id,
                req.body.products_list
            ]
        )
    ) {
        User.find({ $and: [{ email: req.user.mail }, { account_type: "d" }] }, "", (err, users) => {
            if (errHandler(res, err, "utente")) {
                if (users.length === 0) return standardRes(res, 500, "Token email o account type errati.");

                let user = users[0];
                console.log(user);

                Biglietto.find({ _id: req.body.biglietto_id }, "", (err, biglietti) => {
                    if (errHandler(res, err, "biglietti")) {

                        if (biglietti.length === 0) return standardRes(res, 409, "Nessun biglietto trovato.");

                        let biglietto = biglietti[0];
                        console.log(biglietto);

                        Service.find({ "products_list._id": req.body.products_list }, "", (err, services) => {
                            if (errHandler(res, err, "servizio")) {

                                if (services.length === 0) return standardRes(res, 409, "Non prodotto trovato.");

                                let service = services[0];
                                console.log(service);

                                if (user.active_event === null || user.active_event === undefined) return standardRes(res, 403, "Non hai ancora attivato il turno.");

                                if (!user.active_event.equals(biglietto.event)) return standardRes(res, 403, "Non ti è possibile vendere prodotti a questo biglietto.");

                                biglietto.number_of_products += req.body.products_list.length;
                                service.products_list.forEach((product) => {
                                    // console.log("Product: ", req.body.products_list.includes(product._id.toString()));

                                    if (req.body.products_list.includes(product._id.toString())) {
                                        console.log(product);
                                        biglietto.total_price += product.price;
                                        biglietto.products_list.push(product);
                                    }
                                });

                                console.log(biglietto);

                                biglietto.save((err) => {
                                    if (errHandler(res, err, "Errore nell'aggiornamento del biglietto.", false))
                                        return standardRes(res, 200, "Prodotti accreditati.");
                                });
                            }
                        });
                    }
                });
            }
        });
    }
});

module.exports = routes;