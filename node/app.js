const express = require('express');
const app = express();
const port = 3000;

require("dotenv").config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const swaggerUi = require('swagger-ui-express');
// const swaggerDocument = require('./swagger.json');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'PartyHub APIs',
            version: '1.0.0',
        },
        servers: [
            {
                url: "http://federicomontagna.ddns.net:3000"
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            },
            schemas: {
                User: {
                    type: "object",
                    properties: {
                        _id: {
                            type: "string",
                            description: "Id dell'utente.",
                            example: "6288ec25fe5bb453c76a62fa"
                        },
                        name: {
                            type: "string",
                            description: "Il nome dell'utente.",
                            example: "Nome"
                        },
                        surnname: {
                            type: "string",
                            description: "Il cognome dell'utente.",
                            example: "Cognome"
                        },
                        username: {
                            type: "string",
                            description: "Il nome utente dell'utente.",
                            example: "username"
                        },
                        email: {
                            type: "string",
                            format: "email",
                            description: "La e-mail dell'utente.",
                            example: "nome.cognome@mail.com"
                        },
                        password: {
                            type: "string",
                            format: "password",
                            description: "La password dell'utente.",
                            example: "Cognome"
                        },
                        account_type: {
                            type: "string",
                            description: "Il tipo di account dell'utente.",
                            example: "up"
                        },
                        birthday: {
                            type: "string",
                            format: "date",
                            description: "Data di nascita dell'utente",
                            example: "2000-05-21T00:00:00.000Z"
                        },
                        description: {
                            type: "string",
                            description: "La descrizione dell'utente.",
                            example: "descrizione"
                        },
                    }
                }
            }
        }
    },
    apis: ['./api/*.js', './api/*/*.js'], // files containing annotations as above
};

const swaggerSpec = swaggerJsdoc(options);

const cors = require('cors');
app.use(cors());

// routes
const auth = require("./api/auth/auth");
const event = require("./api/event/event");
const service = require("./api/service/service");
const dipendente = require("./api/dipendente/dipendente");
const biglietto = require("./api/biglietto/biglietto");

app.use("/api/auth", auth);
app.use("/api/event", event);
app.use("/api/service", service);
app.use("/api/dipendente", dipendente);
app.use("/api/biglietto", biglietto);
// end routes

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(port, () => {
    console.log(`Api app listening at http://localhost:${port}`)
});