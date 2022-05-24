const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const path = require('path');

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
                url: "http://federicomontagna.ddns.net:3000"
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "apiKey",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    name: "authorization",
                    in: "header"
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
                    description: "Non ti è permesso effettuare questa operazione.",
                    content: {
                        "application/json": {
                            schema: {
                                "$ref": "#/components/schemas/Code403"
                            }
                        }
                    }
                },
                MissingParameters: {
                    description: "Parametri richiesti mancanti.",
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
                                "$ref": "#/components/schemas/User"
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
                        number_of_photos: {
                            type: "integer",
                            description: "Numero di foto presenti", 
                            example: 10
                        },
                        owner:{
                            "$ref": "#/components/schemas/User"
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
                        owner:{
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

// UI

app.use('/public', express.static(path.join(__dirname, '/ui/public')));

// auth
app.use('/login', express.static(path.join(__dirname, '/ui/login')));
app.use('/signin', express.static(path.join(__dirname, '/ui/signin')));
// end - auth

// utente partecipante
app.use('/utente/', express.static(path.join(__dirname, '/ui/utente_partecipante/lista_nuovi_eventi')));
app.use('/utente/iscrizione_evento', express.static(path.join(__dirname, '/ui/utente_partecipante/iscrizione_evento')));
app.use('/utente/lista_biglietti', express.static(path.join(__dirname, '/ui/utente_partecipante/lista_biglietti')));
app.use('/utente/biglietto', express.static(path.join(__dirname, '/ui/utente_partecipante/biglietto')));
// end - utente partecipante

// dipendente
app.use('/dipendente/', express.static(path.join(__dirname, '/ui/dipendente/attivazione_turno')));
app.use('/dipendente/sezione_vendita_prodotti', express.static(path.join(__dirname, '/ui/dipendente/sezione_vendita_prodotti')));
// end - dipendente

// organizzatore
app.use('/organizzatore/', express.static(path.join(__dirname, '/ui/organizzatore/services/crea_service')));
app.use('/organizzatore/crea_evento', express.static(path.join(__dirname, '/ui/organizzatore/events/crea_evento')));
// app.use('/organizzatore/crea_servizio', express.static(path.join(__dirname, '/ui/organizzatore/services/crea_service')));
app.use('/organizzatore/crea_dipendente', express.static(path.join(__dirname, '/ui/organizzatore/dipendenti/crea_dipendente')));
// end - organizzatore

//

// routes
const auth = require("./api/auth/auth");
const event = require("./api/event/event");
const service = require("./api/service/service");
const dipendente = require("./api/dipendente/dipendente");
const biglietto = require("./api/biglietto/biglietto");
const { fstat } = require('fs');

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