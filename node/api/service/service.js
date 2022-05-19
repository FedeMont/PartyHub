const routes = require('express').Router();
const { mongoose, documents, standardRes, bcrypt, saltRounds } = require("../../utils");
const { authenticateToken, generateAccessToken } = require("../../token");
const axios = require('axios');
const { use } = require('bcrypt/promises');

const User = mongoose.model("User", documents.userSchema);
const Product = mongoose.model("Product", documents.productSchema);
const Service = mongoose.model("Service", documents.serviceSchema);

/**
 * @openapi
 * paths:
 *   /servizio/crea:
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

module.exports = routes;