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
app.use('/crea_evento', express.static(path.join(__dirname, '/ui/organizzatore/events/crea_evento')));
// 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(port, () => {
    console.log(`Api app listening at http://localhost:${port}`)
});