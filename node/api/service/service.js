const routes = require('express').Router();
const { mongoose, documents, standardRes } = require("../../utils");
const { authenticateToken } = require("../../token");
const {requiredParametersErrHandler, errHandler} = require("../../error_handlers");

const User = mongoose.model("User", documents.userSchema);
const Product = mongoose.model("Product", documents.productSchema);
const Service = mongoose.model("Service", documents.serviceSchema);
const Biglietto = mongoose.model("Biglietto", documents.bigliettoSchema);


/**
 * @openapi
 * paths:
 *  /api/service/crea:
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
 *                  description: Errore nella creazione del servizio.
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
 *                                      example: Errore nella creazione del servizio.
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
routes.post('/crea', authenticateToken, (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [req.body.name, req.body.products]
        )
    ) {
        User.find({ $and: [{ email: req.user.mail }, { account_type: "o" }] }, "", (err, users) => {
            if (errHandler(res, err, "utente")) {

                if (users.length === 0)  return standardRes(res, 401, "Non ti è possibile creare servizi");

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
                    if (errHandler(res, err, "Errore nella creazione del servizio.", false, 409)) {
                        user.services_list = user.services_list || [];
                        user.services_list.push(service._id);
                        user.number_of_services = user.number_of_services + 1;

                        user.save((err) => {
                            if (errHandler(res, err, "Errore nell'aggiornamento dell'utente.", false, 409)) {
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
 *  /api/service/get_servizi:
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
routes.get('/get_servizi', authenticateToken, (req, res) => {
    User.find({ email: req.user.mail }, "", (err, users) => {

        if (errHandler(res, err, "utente")) {

            if (users.length === 0) return standardRes(res, 401, "Non ti è possibile cercare servizi.");

            let user = users[0];
            console.log(user);

            if (!["o", "d"].includes(user.account_type)) return standardRes(res, 401, "Non ti è possibile cercare i servizi.");

            let projection = (user.account_type === "o")? "name" : "";

            let service_ids = user.services_list;
            Service.find({_id: service_ids}, projection, (err, services) => {
                if (errHandler(res, err, "servizi")) {
                    return standardRes(res, 200, services);
                }
            });
        }
    });
});

/**
 * @openapi
 * paths:
 *  /api/service/get_by_id:
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
 *                  description: Errore nella ricerca di servizio.
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
 *                                      example: Errore nella ricerca di servizio.
 */
routes.get('/get_by_id', authenticateToken, (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [req.query.service_id]
        )
    ) {
        Service.find({ _id: req.query.service_id }, "", (err, services) => {
            if(errHandler(res, err, "servizio")) {
                if (services.length === 0) return standardRes(res, 401, "Non è stato possibile recuperare il servizio.");

                let servizio = services[0];
                console.log(servizio);

                User.find({ $and: [{ _id: servizio.owner }, { email: req.user.mail },  { account_type: "o" }] }, "", (err, users) => {
                    if (errHandler(res, err, "utente")) {
                        if (users.length === 0) return standardRes(res, 401, "Non ti è possibile recuperare il servizio.");

                        // let user = users[0];
                        // console.log(users);

                        return standardRes(res, 200, servizio);
                    }
                });
            }
        });
    }
});

/**
 * @openapi
 * paths:
 *  /api/service/modifica:
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
 *                  description: Errore nell'aggiornamento del servizio.
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
 *                                      example: Errore nell'aggiornamento del servizio.
 *              500:
 *                  description: Errore nella ricerca di servizio.
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
 *                                      example: Errore nella ricerca di servizio.
 */
routes.put('/modifica', authenticateToken, (req, res) => {
    if (
        requiredParametersErrHandler(
            res,
            [req.body.id, req.body.name, req.body.products]
        )
    ) {
        Service.find({ _id: req.body.id }, "", (err, services) => {
            if(errHandler(res, err, "servizio")) {
                if (services.length === 0) return standardRes(res, 401, "Non è stato possibile recuperare il servizio.");

                let service = services[0];
                console.log(service);

                User.find({ $and: [{ _id: service.owner },  { account_type: "o" }] }, "", (err, users) => {
                    if (errHandler(res, err, "utente")) {
                        if (users.length === 0) return standardRes(res, 401, "Non ti è possibile recuperare il servizio.");

                        // let user = users[0];
                        // console.log(users);

                        service["name"] = req.body.name;
                        service["products_list"] = req.body.products;

                        service.save((err) => {
                            if (errHandler(res, err, "Errore nell'aggiornamento del servizio", false, 409)) {
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
 *  /api/service/sell_products:
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
 *                  description: Errore nell'aggiornamento del biglietto.
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
 *                                      example: Errore nell'aggiornamento del biglietto.
 *              500:
 *                  description: Errore nella ricerca di biglietto.
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
 *                                      example: Errore nella ricerca di biglietto.
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
        Biglietto.find({ _id: req.body.biglietto_id }, "", (err, biglietti) => {
            if (errHandler(res, err, "biglietti")) {

                if (biglietti.length === 0) return standardRes(res, 401, "Non è stato possibile recuperare il biglietto.");

                let biglietto = biglietti[0];
                console.log(biglietto);

                Service.find({ "products_list._id": req.body.products_list }, "", (err, services) => {
                    if (errHandler(res, err, "servizio")) {

                        if (services.length === 0) return standardRes(res, 401, "Non è stato possibile recuperare il servizio");

                        let service = services[0];
                        console.log(service);

                        User.find({ $and: [{ email: req.user.mail }, { account_type: "d" }] }, "", (err, users) => {
                            if (errHandler(res, err, "utente")) {
                                if (users.length === 0) return standardRes(res, 401, "Non ti è stato possibile accreditare prodotti.");

                                let user = users[0];
                                console.log(user);

                                if (user.active_event === null || user.active_event === undefined) return standardRes(res, 401, "Non hai ancora attivato il turno.");

                                if (!user.active_event.equals(biglietto.event)) return standardRes(res, 401, "Non ti è possibile vendere prodotti a questo biglietto.");

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
                                    if (errHandler(res, err, "Errore nell'aggiornamento del biglietto.", false, 409))
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