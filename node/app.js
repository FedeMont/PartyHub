const express = require('express');
const app = express();
const port = 3000;

require("dotenv").config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const swaggerUi = require('swagger-ui-express');
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
                url: "http://federicomontagna.ddns.net:3000",
                url: "http://localhost:3000",
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    // type: "apiKey",
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    // name: "authorization",
                    // in: "header"
                }
            },
            responses: {
                NoToken: {
                    description: "No token, unauthorized",
                    content: {
                        "application/json": {
                            schema: {
                                "$ref": "#/components/schemas/Code401"
                            }
                        }
                    }
                },
                ForbiddenError: {
                    description: "Wrong token, forbidden.",
                    content: {
                        "application/json": {
                            schema: {
                                "$ref": "#/components/schemas/Code403"
                            }
                        }
                    }
                },
                MissingParameters: {
                    description: "Parametri mancanti.",
                    content: {
                        "application/json": {
                            schema: {
                                "$ref": "#/components/schemas/Code422"
                            }
                        }
                    }
                },
                ServerError: {
                    description: "Errore nella ricerca di ...",
                    content: {
                        "application/json": {
                            schema: {
                                "$ref": "#/components/schemas/Code500"
                            }
                        }
                    }
                },
            },
            schemas: {
                Code200: {
                    description: "OK",
                    type: "object",
                    properties: {
                        status: {
                            type: "integer",
                            description: "Http status.",
                            example: 200
                        },
                        message: {
                            type: "string",
                            description: "Messaggio.",
                            // example: "No token, unauthorized."
                        },
                    }
                },
                Code401: {
                    description: "Unauthorized",
                    type: "object",
                    properties: {
                        status: {
                            type: "integer",
                            description: "Http status.",
                            example: 401
                        },
                        message: {
                            type: "string",
                            description: "Messaggio.",
                            // example: "No token, unauthorized."
                        },
                    }
                },
                Code403: {
                    description: "Forbidden",
                    type: "object",
                    properties: {
                        status: {
                            type: "integer",
                            description: "Http status.",
                            example: 403
                        },
                        message: {
                            type: "string",
                            description: "Messaggio.",
                            // example: "Non ti è possibile creare ..."
                        },
                    }
                },
                Code409: {
                    description: "Conflict",
                    type: "object",
                    properties: {
                        status: {
                            type: "integer",
                            description: "Http status.",
                            example: 409
                        },
                        message: {
                            type: "string",
                            description: "Messaggio.",
                            // example: "Non ti è possibile creare ..."
                        },
                    }
                },
                Code422: {
                    description: "Unprocessable Entity",
                    type: "object",
                    properties: {
                        status: {
                            type: "integer",
                            description: "Http status.",
                            example: 422
                        },
                        message: {
                            type: "string",
                            description: "Messaggio.",
                            // example: "Alcuni, o tutti, i paramteri richiesti non sono presenti."
                        },
                    }
                },
                Code500: {
                    description: "Internal Server Error",
                    type: "object",
                    properties: {
                        status: {
                            type: "integer",
                            description: "Http status.",
                            example: 500
                        },
                        message: {
                            type: "string",
                            description: "Messaggio.",
                            // example: "Errore nella ricerca di ..."
                        },
                    }
                },
                User: {
                    type: "object",
                    properties: {
                        _id: {
                            type: "string",
                            description: "Id dell'utente",
                            example: "6288ec25fe5bb453c76a62fa"
                        },
                        name: {
                            type: "string",
                            description: "Il nome dell'utente",
                            example: "Nome"
                        },
                        surname: {
                            type: "string",
                            description: "Il cognome dell'utente",
                            example: "Cognome"
                        },
                        username: {
                            type: "string",
                            description: "Il nome utente dell'utente",
                            example: "username"
                        },
                        email: {
                            type: "string",
                            format: "email",
                            description: "La e-mail dell'utente",
                            example: "nome.cognome@mail.com"
                        },
                        password: {
                            type: "string",
                            format: "password",
                            description: "La password dell'utente",
                            example: "Cognome"
                        },
                        account_type: {
                            type: "string",
                            description: "Il tipo di account dell'utente",
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
                            description: "La descrizione dell'utente",
                            example: "descrizione"
                        },
                        profile_picture: {
                            type: "string",
                            description: "Foto profilo utente (base64)"
                        }
                    }
                },
                Dipendente: {
                    type: "object",
                    properties: {
                        _id: {
                            type: "string",
                            description: "Id del dipendente",
                            example: "6288ec25fe5bb453c76a62fa"
                        },
                        name: {
                            type: "string",
                            description: "Il nome del dipendente",
                            example: "Nome"
                        },
                        surname: {
                            type: "string",
                            description: "Il cognome del dipendente",
                            example: "Cognome"
                        },
                        username: {
                            type: "string",
                            description: "Il nome utente del dipendente",
                            example: "username"
                        },
                        email: {
                            type: "string",
                            format: "email",
                            description: "La e-mail del dipendente",
                            example: "nome.cognome@mail.com"
                        },
                        account_type: {
                            type: "string",
                            description: "Il tipo di account del dipendente",
                            example: "d"
                        },
                        number_of_services: {
                            type: "integer",
                            description: "Numero di servizi associati al dipendente",
                            example: 3
                        },
                        services_list: {
                            type: "array",
                            items: {
                                "$ref": "#/components/schemas/Service"
                            }
                        },
                        number_of_events: {
                            type: "integer",
                            description: "Numero di eventi associati al dipendente",
                            example: 3
                        },
                        events_list: {
                            type: "array",
                            items: {
                                "$ref": "#/components/schemas/Event"
                            }
                        }
                    }
                },
                Geoposition: {
                    type: "object",
                    properties: {
                        latitude: {
                            type: "string",
                            description: "Latitudine dell'evento",
                            example: "46.0670758"
                        },
                        longitude: {
                            type: "string",
                            description: "Longitudine dell'evento",
                            example: "11.1502498"
                        },
                        type: {
                            type: "string",
                            description: "Tipo di geoposition data",
                            example: "address"
                        },
                        name: {
                            type: "string",
                            description: "Via e numero civico dell'evento",
                            example: "Via Sommarive 5"
                        },
                        number: {
                            type: "string",
                            description: "Numero civico dell'evento",
                            example: "5"
                        },
                        postal_code: {
                            type: "string",
                            description: "CAP dell'evento",
                            example: "38123"
                        },
                        street: {
                            type: "string",
                            description: "Via dell'evento",
                            example: "Via Sommarive"
                        },
                        confidence: {
                            type: "integer",
                            description: "Confidence sulla risposta",
                            example: 1
                        },
                        region: {
                            type: "string",
                            description: "Provincia dell'evento",
                            example: "Trento"
                        },
                        region_code: {
                            type: "string",
                            description: "Sigla provincia dell'evento",
                            example: "TN"
                        },
                        county: {
                            type: "string",
                            description: "",
                            example: null
                        },
                        locality: {
                            type: "string",
                            description: "Comune dell'evento",
                            example: "Povo"
                        },
                        administrative_area: {
                            type: "string",
                            description: "Provincia dell'evento",
                            example: "Trento"
                        },
                        neighbourhood: {
                            type: "string",
                            description: "",
                            example: null
                        },
                        country: {
                            type: "string",
                            description: "Paese dell'evento",
                            example: "Italy"
                        },
                        country_code: {
                            type: "string",
                            description: "Sigla Paese dell'evento",
                            example: "ITA"
                        },
                        continent: {
                            type: "string",
                            description: "Continente dell'evento",
                            example: "Europe"
                        },
                        label: {
                            type: "string",
                            description: "Via, Numero civico, Comune, Sigla Provincia, Paese dell'evento",
                            example: "Via Sommarive 5, Povo, TN, Italy"
                        },
                        is_user_iscritto: {
                            type: "boolean",
                            description: "Se l'utente loggato è iscritto all'evento.",
                            example: true
                        },
                        number_of_feedbacks: {
                            type: "integer",
                            description: "Numero di feedback dell'evento.",
                            example: 100
                        },
                        avg_feedback: {
                            type: "integer",
                            description: "Media dei feedback.",
                            example: 4.5
                        },
                        biglietto_active: {
                            type: "boolean",
                            description: "Se il biglietto è attivo.",
                            example: true
                        },
                        biglietto_used: {
                            type: "boolean",
                            description: "Se il biglietto è stato attivato e disattivato.",
                            example: true
                        },
                        biglietto_scaduto: {
                            type: "boolean",
                            description: "Se il biglietto è riferito ad un evento passato.",
                            example: true
                        }
                    }
                },
                EventPhotoSchema: {
                    type: "object",
                    properties: {
                        photo: {
                            type: "string",
                            description: "Foto evento (base64)"
                        },
                        datetime: {
                            type: "string",
                            format: "date",
                            description: "Data di caricamento"
                        },
                        user: {
                            type: "string",
                            description: "Id dell'utente organizzatore",
                            example: "6288ec25fe5bb453c76a62fa"
                        }
                    }
                },
                Event: {
                    type: "object",
                    properties: {
                        _id: {
                            type: "string",
                            description: "Id dell'evento",
                            example: "6288ec25fe5bb453c76a62fa"
                        },
                        name: {
                            type: "string",
                            description: "Il nome dell'evento",
                            example: "Nome"
                        },
                        address: {
                            "$ref": "#/components/schemas/Geoposition"
                        },
                        start_datetime: {
                            type: "string",
                            format: "date",
                            description: "Data e ora di inizio evento",
                            example: "2022-05-29T15:30:00.000Z"
                        },
                        end_datetime: {
                            type: "string",
                            format: "date",
                            description: "Data e ora di fine evento",
                            example: "2022-05-29T23:30:00.000Z"
                        },
                        age_range_min: {
                            type: "integer",
                            description: "Età minima",
                            example: 18
                        },
                        age_range_max: {
                            type: "integer",
                            description: "Età massima",
                            example: 38
                        },
                        partecipants_list: {
                            type: "array",
                            items: {
                                type: "string",
                                description: "Id dell'utente iscritto all'evento",
                                example: "6288ec25fe5bb453c76a62fa"
                            }
                        },
                        maximum_partecipants: {
                            type: "integer",
                            description: "Numero massimo di partecipanti",
                            example: 1000
                        },
                        description: {
                            type: "string",
                            description: "Descrizione dell'evento",
                            example: "Descrizione"
                        },
                        poster: {
                            type: "string",
                            description: "Immagine della locandina dell'evento",
                            example: "/9j/4QSkRXhpZgAASUkqAAgAAAANAAABBAABAAAAo..."
                        },
                        number_of_photos: {
                            type: "integer",
                            description: "Numero di foto presenti",
                            example: 10
                        },
                        gallery: {
                            type: "array",
                            items: {
                                "$ref": "#/components/schemas/EventPhotoSchema"
                            }
                        },
                        owner: {
                            type: "string",
                            description: "Id dell'utente organizzatore",
                            example: "6288ec25fe5bb453c76a62fa"
                        }
                    }
                },
                Product: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            description: "Il nome del prodotto",
                            example: "Nome prodotto"
                        },
                        price: {
                            type: "integer",
                            description: "Prezzo prodotto",
                            example: 5
                        }
                    }
                },
                Service: {
                    type: "object",
                    properties: {
                        _id: {
                            type: "string",
                            description: "Id del servizio",
                            example: "6288ec25fe5bb453c76a62fa"
                        },
                        owner: {
                            "$ref": "#/components/schemas/User"
                        },
                        name: {
                            type: "string",
                            description: "Il nome del servizio",
                            example: "Nome servizio"
                        },
                        number_of_products: {
                            type: "integer",
                            description: "Numero di prodotti presenti",
                            example: 10
                        },
                        products_list: {
                            type: "array",
                            items: {
                                "$ref": "#/components/schemas/Product"
                            }
                        }
                    }
                },
                Biglietto: {
                    type: "object",
                    properties: {
                        _id: {
                            type: "string",
                            description: "Id del servizio",
                            example: "6288ec25fe5bb453c76a62fa"
                        },
                        event: {
                            "$ref": "#/components/schemas/Event"
                        },
                        entrance_datetime: {
                            type: "string",
                            format: "date",
                            description: "Data e ora di ingresso all'evento",
                            example: "2022-05-29T15:30:00.000Z"
                        },
                        exit_datetime: {
                            type: "string",
                            format: "date",
                            description: "Data e ora di uscita dall'evento",
                            example: "2022-05-29T23:30:00.000Z"
                        },
                        number_of_products: {
                            type: "integer",
                            description: "Numero di prodotti acquistati durante l'evento",
                            example: 3
                        },
                        total_price: {
                            type: "integer",
                            description: "Prezzo totale dei prodotti acquistati",
                            example: 17.50
                        },
                        products_list: {
                            type: "array",
                            items: {
                                "$ref": "#/components/schemas/Product"
                            }
                        }
                    }
                }
            }
        }
    },
    apis: ['./api/*.js', './api/*/*.js', "./api/*/*/*.js"], // files containing annotations as above
};

const swaggerSpec = swaggerJsdoc(options);

const fs = require("fs");
// fs.writeFileSync("apiary.json", JSON.stringify(swaggerSpec));

const cors = require('cors');
app.use(cors());

// routes
const auth = require("./api/auth/auth");
const event = require("./api/event/event");
const service = require("./api/service/service");
const dipendente = require("./api/dipendente/dipendente");
const biglietto = require("./api/biglietto/biglietto");

app.use("/api/v2/auth", auth);
app.use("/api/v2/event", event);
app.use("/api/v2/service", service);
app.use("/api/v2/dipendente", dipendente);
app.use("/api/v2/biglietto", biglietto);
// end routes

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

let server = app.listen(port, () => {
    console.log(`Api app listening at http://localhost:${port}`)
});

server.close();

module.exports = { app, server };