const express = require('express');
const app = express();
const port = 3000;

const path = require('path');

const swaggerUi = require('swagger-ui-express');
// const swaggerDocument = require('./swagger.json');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Hello World',
            version: '1.0.0',
        },
    },
    apis: ['./api/*.js'], // files containing annotations as above
};

const swaggerSpec = swaggerJsdoc(options);

const cors = require('cors');
app.use(cors());

// UI
app.use('/public', express.static(path.join(__dirname, '/ui/public')));
app.use('/signin', express.static(path.join(__dirname, '/ui/signin')));
app.use('/login', express.static(path.join(__dirname, '/ui/login')));
app.use('/lista_nuovi_eventi', express.static(path.join(__dirname, '/ui/utente_partecipante/lista_nuovi_eventi')));
app.use('/crea_evento', express.static(path.join(__dirname, '/ui/organizzatore/events/crea_evento')));
app.use('/iscrizione_evento', express.static(path.join(__dirname, '/ui/utente_partecipante/iscrizione_evento')));
app.use('/lista_biglietti', express.static(path.join(__dirname, '/ui/utente_partecipante/lista_biglietti')));
app.use('/attivazione_biglietto', express.static(path.join(__dirname, '/ui/utente_partecipante/attivazione_biglietto')));
app.use('/crea_servizio', express.static(path.join(__dirname, '/ui/organizzatore/services/crea_service')));
app.use('/crea_dipendente', express.static(path.join(__dirname, '/ui/organizzatore/dipendenti/crea_dipendente')));
app.use('/sezione_vendita_prodotti', express.static(path.join(__dirname, '/ui/dipendente/sezione_vendita_prodotti')));
app.use('/attivazione_turno', express.static(path.join(__dirname, '/ui/dipendente/attivazione_turno')));
//

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(port, () => {
    console.log(`Api app listening at http://localhost:${port}`)
});