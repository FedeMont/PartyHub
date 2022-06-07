const request = require('supertest');
const { mongoose, generate_url_with_attr } = require("../../utils");
const { app, server } = require("../../app");

test('app module should be defined', () => {
    expect(app).toBeDefined();
});

// beforeAll(async () => {
//     jest.setTimeout(30000);
// })

afterAll(async () => {
    await mongoose.connection.close();
    await server.close();
});

// TEST DIPENDENTE CREA
describe('GET /api/v2/dipendente/crea', () => {
    jest.setTimeout(30000);
    // TEST SPRINT-1 10
    test('POST /api/v2/dipendente/crea con parametri necessari', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_o",
                "password": "test_o"
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/dipendente/crea')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "name": "Test",
                            "surname": "Dipendente",
                            "email": "dipendenteTest@gmail.com",
                            "events_list": ["629dfdc4002f39011b92bc0f", "629e093a21af11d285d001f1"],
                            "services_list": ["629f50084f546229ed671879"]
                        })
                        .expect({
                            status: 200,
                            message: 'Dipendente creato correttamente.'
                        })
                }
            );
    });
    // TEST SPRINT-1 10.1
    test('POST /api/v2/dipendente/crea senza token', () => {
        return request(app)
            .post('/api/v2/dipendente/crea')
            .send({
                "name": "Test",
                "surname": "Dipendente",
                "email": "dipendenteTest@gmail.com",
                "events_list": ["event_id"],
                "services_list": ["service_id"]
            })
            .expect({
                status: 401,
                message: "No token, unauthorized."
            })
    });
    // TEST SPRINT-1 10.2
    test('POST /api/v2/dipendente/crea con token errato', () => {
        let token = "wrongToken";
        return request(app)
            .post('/api/v2/dipendente/crea')
            .set('Authorization', `Bearer ${token}`)
            .send({
                "name": "Test",
                "surname": "Dipendente",
                "email": "dipendenteTest@gmail.com",
                "events_list": ["event_id"],
                "services_list": ["service_id"]
            })
            .expect({
                status: 403,
                message: "Wrong token, forbidden."
            })
    });
    // TEST SPRINT-1 10.3
    test('POST /api/v2/dipendente/crea con event_list errata', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_o",
                "password": "test_o"
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/dipendente/crea')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "name": "Test",
                            "surname": "Dipendente",
                            "email": "dipendenteTest@gmail.com",
                            "events_list": ["629e090c21af11d285d001a5"],
                            "services_list": ["629e090c21af11d285d001a5"]
                        })
                        .expect({
                            status: 409,
                            message: "Nessun evento trovato."
                        })
                }
            );
    });
    // TEST SPRINT-1 10.4
    test('POST /api/v2/dipendente/crea con service_list errata', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_o",
                "password": "test_o"
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/dipendente/crea')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "name": "Test",
                            "surname": "Dipendente",
                            "email": "dipendenteTest@gmail.com",
                            "events_list": ["629dfdc4002f39011b92bc0f"],
                            "services_list": ["629e090c21af11d285d001a5"]
                        })
                        .expect({
                            status: 409,
                            message: 'Nessun servizio trovato.'
                        })
                }
            );
    });
    // TEST SPRINT-1 10.5
    test('POST /api/v2/dipendente/crea con parametri mancanti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_o",
                "password": "test_o"
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/dipendente/crea')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "name": "Test",
                            "surname": "Dipendente",
                            "email": "dipendenteTest@gmail.com"
                        })
                        .expect({
                            status: 422,
                            message: 'Parametri mancanti.'
                        })
                }
            );
    });
});

// TEST DIPENDENTE ACTIVATE_TURNO
describe('GET /api/v2/dipendente/activate_turno', () => {
    jest.setTimeout(30000);
    // TEST SPRINT-1 11
    test('POST /api/v2/dipendente/activate_turno con token e event_id presenti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "dipendenteTest@gmail.com",
                "password": "dipendenteTest@gmail.com"
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/dipendente/activate_turno')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "event_id": "629dfdc4002f39011b92bc0f"
                        })
                        .expect({
                            status: 200,
                            message: 'Turno attivato.'
                        })
                }
            );
    });
    // TEST SPRINT-1 11.1
    test('POST /api/v2/dipendente/activate_turno con token mancante', () => {
        return request(app)
            .post('/api/v2/dipendente/activate_turno')
            .send({
                "event_id": "629dfdc4002f39011b92bc0f"
            })
            .expect({
                status: 401,
                message: 'No token, unauthorized.'
            })
    });
    // TEST SPRINT-1 11.2
    test('POST /api/v2/dipendente/activate_turno con token errato', () => {
        let token = "wrongToken";
        return request(app)
            .post('/api/v2/dipendente/activate_turno')
            .set('Authorization', `Bearer ${token}`)
            .send({
                "event_id": "629dfdc4002f39011b92bc0f"
            })
            .expect({
                status: 403,
                message: 'Wrong token, forbidden.'
            })
    });
    // TEST SPRINT-1 11.3
    test('POST /api/v2/dipendente/activate_turno con event_id non registrato', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "dipendenteTest@gmail.com",
                "password": "dipendenteTest@gmail.com"
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/dipendente/activate_turno')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "event_id": "629e093a21af11d285d001f1"
                        })
                        .expect({
                            status: 409,
                            message: 'Nessun evento trovato.'
                        })
                })
    });

    // TEST SPRINT-1 11.4
    test('POST /api/v2/dipendente/activate_turno con token e event_id presenti ma event_id non appartentente al dipendente', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "dipendenteTest@gmail.com",
                "password": "dipendenteTest@gmail.com"
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/dipendente/activate_turno')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "event_id": "629e028b0146210e3c41c2d2"
                        })
                        .expect({
                            status: 409,
                            message: 'Non ti è possibile attivare il turno per questo evento.'
                        })
                }
            );
    });

    // TEST SPRINT-1 11.5
    test('POST /api/v2/dipendente/activate_turno con token ma parametri mancanti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "dipendenteTest@gmail.com",
                "password": "dipendenteTest@gmail.com"
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/dipendente/activate_turno')
                        .set('Authorization', `Bearer ${token}`)
                        .expect({
                            status: 422,
                            message: 'Parametri mancanti.'
                        })
                }
            );
    });
})

// TEST DIPENDENTE GET_DIPENDENTI
describe('GET /api/v2/dipendente/get_dipendenti', () => {
    jest.setTimeout(30000);
    // TEST SPRINT-2 5
    test('GET /api/v2/dipendente/get_dipendenti con nessun dipendente creato dall\' organizzatore', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_o_due",
                "password": "test_o_due"
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .get('/api/v2/dipendente/get_dipendenti')
                        .set('Authorization', `Bearer ${token}`)
                        .expect({
                            status: 200,
                            message: []
                        })
                }
            );
    });
    // TEST SPRINT-2 5.1
    test('GET /api/v2/dipendente/get_dipendenti con token mancante', () => {
        return request(app)
            .get('/api/v2/dipendente/get_dipendenti')
            .expect({
                status: 401,
                message: "No token, unauthorized."
            })
    });
    // TEST SPRINT-2 5.2
    test('GET /api/v2/dipendente/get_dipendenti con token errato', () => {
        let token = "wrongToken";
        return request(app)
            .get('/api/v2/dipendente/get_dipendenti')
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 403,
                message: "Wrong token, forbidden."
            })
    });
    // TEST SPRINT-2 5.3
    test('GET /api/v2/dipendente/get_dipendenti con token corretto e utente in possesso di dipendenti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_o",
                "password": "test_o"
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .get('/api/v2/dipendente/get_dipendenti')
                        .set('Authorization', `Bearer ${token}`)
                        .expect('Content-Type', /json/)
                        .then(
                            (res) => {
                                let error = true;
                                if (res.body.status === 200 &&
                                    res.body.message !== []) {
                                    error = false;
                                }
                                return !error;
                            });
                });
    });
})

// TEST DIPENDENTE MODIFICA
describe('GET /api/v2/dipendente/modifica', () => {
    jest.setTimeout(30000);
    // TEST SPRINT-2 6
    test('PUT /api/v2/dipendente/modifica con parametri corretti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_o",
                "password": "test_o"
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .put('/api/v2/dipendente/modifica')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "id": "629e007d291ae58430fda226",
                            "name": "Nome dipendente 1",
                            "surname": "Cognome dipendente 1",
                            "events_list": ["629dfdc4002f39011b92bc0f"],
                            "services_list": ["629dfc82806e4bf70c0283e9", "629dfcafc9c4bcabd7e91be2"]
                        })
                        .expect({
                            status: 200,
                            message: "Dipendente modificato."
                        })
                });
    });
    // TEST SPRINT-2 6.1
    test('PUT /api/v2/dipendente/modifica con token mancante', () => {
        return request(app)
            .put('/api/v2/dipendente/modifica')
            .send({
                "id": "629e007d291ae58430fda226",
                "name": "Nome dipendente 1",
                "surname": "Cognome dipendente 1",
                "events_list": ["629dfdc4002f39011b92bc0f"],
                "services_list": ["629dfc82806e4bf70c0283e9", "629dfcafc9c4bcabd7e91be2"]
            })
            .expect({
                status: 401,
                message: "No token, unauthorized."
            })
    });
    // TEST SPRINT-2 6.2
    test('PUT /api/v2/dipendente/modifica con token errato', () => {
        let token = "wrongToken";
        return request(app)
            .put('/api/v2/dipendente/modifica')
            .set('Authorization', `Bearer ${token}`)
            .send({
                "id": "629e007d291ae58430fda226",
                "name": "Nome dipendente 1",
                "surname": "Cognome dipendente 1",
                "events_list": ["629dfdc4002f39011b92bc0f"],
                "services_list": ["629dfc82806e4bf70c0283e9", "629dfcafc9c4bcabd7e91be2"]
            })
            .expect({
                status: 403,
                message: "Wrong token, forbidden."
            })
    });
    // TEST SPRINT-2 6.3
    test('PUT /api/v2/dipendente/modifica con token corretto e lista degli eventi errata', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_o",
                "password": "test_o"
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .put('/api/v2/dipendente/modifica')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "id": "629e007d291ae58430fda226",
                            "name": "Nome dipendente 1",
                            "surname": "Cognome dipendente 1",
                            "events_list": ["629dfc82806e4bf70c0283e9"],
                            "services_list": ["629dfc82806e4bf70c0283e9", "629dfcafc9c4bcabd7e91be2"]
                        })
                        .expect({
                            status: 409,
                            message: "Nessun evento trovato."
                        })
                });
    });
    // TEST SPRINT-2 6.4
    test('PUT /api/v2/dipendente/modifica con token corretto e lista dei servizi errata', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_o",
                "password": "test_o"
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .put('/api/v2/dipendente/modifica')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "id": "629e007d291ae58430fda226",
                            "name": "Nome dipendente 1",
                            "surname": "Cognome dipendente 1",
                            "events_list": ["629dfdc4002f39011b92bc0f"],
                            "services_list": ["629dfdc4002f39011b92bc0f"]
                        })
                        .expect({
                            status: 409,
                            message: "Nessun servizio trovato."
                        })
                });
    });
    // TEST SPRINT-2 6.5
    test('PUT /api/v2/dipendente/modifica con token corretto e parametri mancanti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_o",
                "password": "test_o"
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .put('/api/v2/dipendente/modifica')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "id": "629e007d291ae58430fda226",
                            "name": "Nome dipendente 1",
                            "surname": "Cognome dipendente 1",
                        })
                        .expect({
                            status: 422,
                            message: "Parametri mancanti."
                        })
                });
    });
})

// TEST DIPENDENTE GET_BY_ID
describe('GET /api/v2/dipendente/get_by_id', () => {
    jest.setTimeout(30000);
    // TEST SPRINT-2 7
    test('GET /api/v2/dipendente/get_by_id con token e dipendete_id corretti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_o",
                "password": "test_o"
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    let attribute = {
                        "dipendente_id": "629e007d291ae58430fda226"
                    }
                    return request(app)
                        .get(generate_url_with_attr('/api/v2/dipendente/get_by_id', attribute))
                        .set('Authorization', `Bearer ${token}`)
                        .expect('Content-Type', /json/)
                        .then((res) => {
                            let error = true;
                            if (res.body.status === 200 &&
                                res.body.message !== []) {
                                error = false;
                            }
                            return !error;
                        })
                });
    });
    // TEST SPRINT-2 7.1
    test('GET /api/v2/dipendente/get_by_id con token mancante', () => {
        let attribute = {
            "dipendente_id": "629e007d291ae58430fda226"
        }
        return request(app)
            .get(generate_url_with_attr('/api/v2/dipendente/get_by_id', attribute))
            .expect({
                status: 401,
                message: "No token, unauthorized."
            })
    });
    // TEST SPRINT-2 7.2
    test('GET /api/v2/dipendente/get_by_id con token errato', () => {
        let token = "wrongToken";
        let attribute = {
            "dipendente_id": "629e007d291ae58430fda226"
        }
        return request(app)
            .get(generate_url_with_attr('/api/v2/dipendente/get_by_id', attribute))
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 403,
                message: "Wrong token, forbidden."
            })
    });
    // TEST SPRINT-2 7.3
    test('GET /api/v2/dipendente/get_by_id con token e dipendete_id corretti ma dipendente non appartenente all\'organizzatore ', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_o_due",
                "password": "test_o_due"
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    let attribute = {
                        "dipendente_id": "629e007d291ae58430fda226"
                    }
                    return request(app)
                        .get(generate_url_with_attr('/api/v2/dipendente/get_by_id', attribute))
                        .set('Authorization', `Bearer ${token}`)
                        .expect({
                            status: 409,
                            message: "Nessun dipendente trovato."
                        })
                });
    });
    // TEST SPRINT-2 7.4
    test('GET /api/v2/dipendente/get_by_id con token corretto e parametri mancanti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_o",
                "password": "test_o"
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .get('/api/v2/dipendente/get_by_id')
                        .set('Authorization', `Bearer ${token}`)
                        .expect({
                            status: 422,
                            message: "Parametri mancanti."
                        })
                });
    });
})