const routes = require('express').Router();
const { mongoose, documents, standardRes, bcrypt, saltRounds } = require("../../utils");
const { authenticateToken, generateAccessToken } = require("../../token");
const axios = require('axios');

const User = mongoose.model("User", documents.userSchema);
const Product = mongoose.model("Product", documents.productSchema);
const Service = mongoose.model("Service", documents.serviceSchema);
const Biglietto = mongoose.model("Biglietto", documents.bigliettoSchema);

/**
 * @openapi
 * paths:
 *   /service/crea:
 *     post:
 *       description: Dati i dati di un servizio il sistema aggiunge un nuovo servizio
 *       responses:
 *         '200':
 *            description: Servizio creato correttamente
 *         '409':
 *            description: Errore nella creazione dell servizio
 *       parameters:
 *               - in: path
 *                 name: products
 *                 type: JsonArray
 *                 required: true
 *                 description: Array containing Products Objects
 */
routes.post('/crea', authenticateToken, (req, res) => {
    User.find({ $and: [{ email: req.user.mail }, { account_type: "o" }] }, "", (err, user) => {
        if (err) {
            console.log(err);
            return standardRes(res, 500, "Errore nella ricerca di utente.");
        }

        if (user.length === 0) {
            return standardRes(res, 401, "Non ti è possibile creare servizi");
        }

        user = user[0];
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
            if (err) {
                console.log(err);
                return standardRes(res, 409, "Errore nella creazione dell servizio.");
            }

            user.services_list = user.services_list || [];
            user.services_list.push(service._id);
            user.number_of_services = user.number_of_services + 1;
            user.save((err) => {
                if (err) {
                    console.log(err);
                    return standardRes(res, 409, "Errore nell'aggiornamento dell'utente.");
                }

                return standardRes(res, 200, "Servizio creato correttamente.");
            });
        });
    });
});


/**
 * @openapi
 * paths:
 *   /service/get_servizi:
 *     get:
 *       description: Dati i dati di un servizio il sistema aggiunge un nuovo servizio
 *       responses:
 *         '200':
 *            description: Servizi inviati correttamente
 *         '409':
 *            description: Errore nell caricamento dei servizi
 */
routes.get('/get_servizi', authenticateToken, (req, res) => {
    User.find({ $and: [{ email: req.user.mail }, { account_type: "o" }] }, "", (err, user) => {
        if (err) {
            console.log(err);
            return standardRes(res, 500, "Errore nella ricerca di utente.");
        }

        if (user.length === 0) {
            return standardRes(res, 401, "Non ti è possibile creare servizi");
        }

        user = user[0];
        console.log(user);

        let service_ids = user.services_list;
        Service.find({ _id: service_ids }, "name", (err, services) => {
            if (err) {
                console.log(err);
                return standardRes(res, 500, "Errore nella ricerca dei servizi.");
            }
            return standardRes(res, 200, services);
        });
    });
});

/**
 * @openapi
 * paths:
 *   /service/get_user_services:
 *     get:
 *       description: Dati i dati di un servizio il sistema aggiunge un nuovo servizio
 *       responses:
 *         '200':
 *            description: Servizi inviati correttamente
 *         '409':
 *            description: Errore nell caricamento dei servizi
 */
routes.get('/get_user_services', authenticateToken, (req, res) => {
    User.find({ $and: [{ email: req.user.mail }, { account_type: "d" }] }, "", (err, user) => {
        if (err) {
            console.log(err);
            return standardRes(res, 500, "Errore nella ricerca di utente.");
        }

        if (user.length === 0) {
            return standardRes(res, 401, "Non è stato possibile recuperare i servizi");
        }

        user = user[0];
        console.log(user);

        let service_ids = user.services_list;
        Service.find({ _id: service_ids }, "", (err, services) => {
            if (err) {
                console.log(err);
                return standardRes(res, 500, "Errore nella ricerca dei servizi.");
            }

            return standardRes(res, 200, services);
        });
    });
});

/**
 * @openapi
 * paths:
 *   /service/sell_products:
 *     post:
 *       description: Dati i dati di un servizio il sistema aggiunge un nuovo servizio
 *       responses:
 *         '200':
 *            description: Servizi inviati correttamente
 *         '409':
 *            description: Errore nell caricamento dei servizi
 */
routes.post('/sell_products', authenticateToken, (req, res) => {
    console.log(req.body);

    Biglietto.find({ _id: req.body.biglietto_id }, "", (err, biglietto) => {
        if (err) {
            console.log(err);
            return standardRes(res, 500, "Errore nella ricerca di biglietto.");
        }

        if (biglietto.length === 0) {
            return standardRes(res, 401, "Non è stato possibile recuperare il biglietto");
        }

        biglietto = biglietto[0];
        console.log(biglietto);

        Service.find({ "products_list._id" : req.body.products_list }, "", (err, service) => {
            if (err) {
                console.log(err);
                return standardRes(res, 500, "Errore nella ricerca di servizio.");
            }

            if (service.length === 0) {
                return standardRes(res, 401, "Non è stato possibile recuperare il servizio");
            }

            service = service[0];
            console.log(service);

            console.log(service.products_list);

            biglietto.number_of_products += req.body.products_list.length;
            service.products_list.forEach((product) => {
                // console.log("Product: ", req.body.products_list.includes(product._id.toString()));

                if (req.body.products_list.includes(product._id.toString())) {
                    console.log(product)
                    biglietto.total_price += product.price;
                    biglietto.products_list.push(product);
                }
            });

            console.log(biglietto);

            biglietto.save((err) => {
                if (err) {
                    console.log(err);
                    return standardRes(res, 500, "Errore nell'aggiornamento del biglietto.");
                }

                return standardRes(res, 200, "Prodotti accreditati.");
            });
        });
    });
});


module.exports = routes;