const request = require('supertest');
const { mongoose, generate_url_with_attr } = require("../../utils");
const { app, server } = require("../../app");
const jestConfig = require('../../jest.config');

test('app module should be defined', () => {
    expect(app).toBeDefined();
});

beforeAll(async () => {
    jest.setTimeout(30000);
});

afterAll(async () => {
    await mongoose.connection.close();
    await server.close();
});

let service = "";
let service_due = "";

const save_service = (id, type = "") => {
    let s_id = id;
    switch (type) {
        case "uno":
            service = id;
            break
        case "due":
            service_due = id;
    }
    return Promise.resolve(s_id);
};

// TEST CREA SERVIZI
describe('POST /api/v2/service/crea', () => {
    // TEST SPRINT-1 12
    test('POST /api/v2/service/crea con token e nome, liste dei prodotti corretti', async () => {
        return await request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_o",
                "password": "test_o"
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(
                async (res) => {
                    let token = res.body.token;
                    return await request(app)
                        .post('/api/v2/service/crea')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "name": "Test_servizio1",
                            "products": [{
                                "name": 'Prodotto_test1',
                                "price": 5
                            }]
                        })
                        .expect(200)
                        .then(
                            async (res) => {
                                await save_service(res.body.message, "uno");

                                return await request(app)
                                    .post('/api/v2/auth/login')
                                    .set('Accept', 'application/json')
                                    .send({
                                        "username_email": "test_o_due",
                                        "password": "test_o_due"
                                    })
                                    .expect('Content-Type', /json/)
                                    .expect(200)
                                    .then(
                                        async (res) => {
                                            let token = res.body.token;
                                            return await request(app)
                                                .post('/api/v2/service/crea')
                                                .set('Authorization', `Bearer ${token}`)
                                                .send({
                                                    "name": "Test_servizio2",
                                                    "products": [{
                                                        "name": 'Prodotto_test2',
                                                        "price": 5
                                                    }]
                                                })
                                                .expect(200)
                                                .then(async (res) => {
                                                    await save_service(res.body.message, "due");

                                                    return await request(app)
                                                        .post('/api/v2/auth/signin')
                                                        .set('Accept', 'application/json')
                                                        .send({
                                                            "name": "test_o_senza_servizi",
                                                            "surname": "test_o_senza_servizi",
                                                            "username": "test_o_senza_servizi",
                                                            "email": "test_o_senza_servizi@gmail.com",
                                                            "birthday": "2000-01-01T00:00:00.000Z",
                                                            "description": "test_o_senza_servizi",
                                                            "password": "test_o_senza_servizi",
                                                            "account_type": "o"
                                                        })
                                                        .expect('Content-Type', /json/)
                                                        .then(async (res) => {

                                                            return await request(app)
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
                                                                                "services_list": ["629dfc82806e4bf70c0283e9", "629dfcafc9c4bcabd7e91be2", service.service_id]
                                                                            })
                                                                            .expect({
                                                                                status: 200,
                                                                                message: "Dipendente modificato."
                                                                            });
                                                                    });
                                                        });
                                                });
                                        }
                                    );
                            }
                        );
                }
            );
    });

    // TEST SPRINT-1 12.1
    test('POST /api/v2/service/crea senza token', () => {
        let token = "";
        return request(app)
            .post('/api/v2/service/crea')
            .set('Authorization', `Bearer ${token}`)
            .send({
                "name": "Test_servizio1",
                "products": [{
                    "name": "Prodotto_test1",
                    "price": "5"
                }]
            })
            .expect({
                status: 401,
                message: 'No token, unauthorized.'
            });
    });

    // TEST SPRINT-1 12.2
    test('POST /api/v2/service/crea con token errato', () => {
        let token = "wrongToken";
        return request(app)
            .post('/api/v2/service/crea')
            .set('Authorization', `Bearer ${token}`)
            .send({
                "name": "Test_servizio1",
                "products": [{
                    "name": 'Prodotto_test1',
                    "price": 5
                }]
            })
            .expect({
                status: 403,
                message: 'Wrong token, forbidden.'
            });
    });

    // TEST SPRINT-1 12.3
    test('POST /api/v2/service/crea parametri mancanti', () => {
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
                        .post('/api/v2/service/crea')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "name": "Test_servizio1"
                        })
                        .expect({
                            status: 422,
                            message: 'Parametri mancanti.'
                        });
                }
            );
    });
});

// TEST VENDITA PRODOTTI
describe('POST /api/v2/service/sell_products', () => {
    jest.setTimeout(30000);
    
    // TEST SPRINT-1 13
    test('POST /api/v2/service/sell_products con token e biglietto id, liste dei prodotti corretti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "alice.fasoli@studenti.unitn.it",
                "password": "alice.fasoli@studenti.unitn.it"
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;

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
                                    .then((res) => {
                                        return request(app)
                                        .post('/api/v2/service/sell_products')
                                        .set('Authorization', `Bearer ${token}`)
                                        .send({
                                            "biglietto_id": "629e090c21af11d285d001a5",
                                            "products_list": [
                                                service.products_ids[0]
                                            ]
                                        })
                                        .expect({
                                            status: 200,
                                            message: 'Prodotti accreditati.'
                                        });
                                    });
                            }
                        );
                }
            );
    });

    // TEST SPRINT-1 13.1
    test('POST /api/v2/service/sell_products senza token', () => {
        return request(app)
            .post('/api/v2/service/sell_products')
            .send({
                "biglietto_id": "629e090c21af11d285d001a5",
                "products_list": [
                    service.products_ids[0]
                ]
            })
            .expect({
                status: 401,
                message: 'No token, unauthorized.'
            });
    });

    // TEST SPRINT-1 13.2
    test('POST /api/v2/service/sell_products con token errato e biglietto id, lista dei prodotti corretti', () => {
        let token = "wrongToken";
        return request(app)
            .post('/api/v2/service/sell_products')
            .set('Authorization', `Bearer ${token}`)
            .send({
                "biglietto_id": "629e090c21af11d285d001a5",
                "products_list": [
                    service.products_ids[0]
                ]
            })
            .expect({
                status: 403,
                message: 'Wrong token, forbidden.'
            });
    });

    // TEST SPRINT-1 13.4
    test('POST /api/v2/service/sell_products con token e biglietto id, liste dei prodotti corretti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "alice.fasoli@studenti.unitn.it",
                "password": "alice.fasoli@studenti.unitn.it"
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
                        .then((res) => {
                            return request(app)
                                .post('/api/v2/service/sell_products')
                                .set('Authorization', `Bearer ${token}`)
                                .send({
                                    "biglietto_id": "629e093a21af11d285d001f1",
                                    "products_list": [
                                        service.products_ids[0]
                                    ]
                                })
                                .expect({
                                    status: 403,
                                    message: 'Non ti è possibile vendere prodotti a questo biglietto.'
                                });
                        });
                }
            );
    });

    // TEST SPRINT-1 13.5
    test('POST /api/v2/service/sell_products con token e lista dei prodotti corretti, biglietto id errato', () => {
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
                        .post('/api/v2/service/sell_products')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "biglietto_id": "629dfdc4002f39011b92bc0f",
                            "products_list": [
                                service.products_ids[0]
                            ]
                        })
                        .expect({
                            status: 409,
                            message: 'Nessun biglietto trovato.'
                        });
                }
            );
    });

    // TEST SPRINT-1 13.6
    test('POST /api/v2/service/sell_products con token e biglietto id corretti, lista prodotti errata', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "alice.fasoli@studenti.unitn.it",
                "password": "alice.fasoli@studenti.unitn.it"
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/service/sell_products')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "biglietto_id": "629e090c21af11d285d001a5",
                            "products_list": [
                                "629dfdc4002f39011b92bc0f"
                            ]
                        })
                        .expect({
                            status: 409,
                            message: 'Nessun prodotto trovato.'
                        });
                }
            );
    });

    // TEST SPRINT-1 13.7
    test('POST /api/v2/service/sell_products parametri mancanti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "alice.fasoli@studenti.unitn.it",
                "password": "alice.fasoli@studenti.unitn.it"
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/service/sell_products')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "biglietto_id": "629e090c21af11d285d001a5"
                        })
                        .expect({
                            status: 422,
                            message: 'Parametri mancanti.'
                        });
                }
            );
    });

    // TEST SPRINT-1 13.3
    test('POST /api/v2/service/sell_products con parametri corretti', () => {
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
                        "services_list": ["629dfc82806e4bf70c0283e9", "629dfcafc9c4bcabd7e91be2", service.service_id],
                        "active_event": null
                    })
                    .expect({
                        status: 200,
                        message: "Dipendente modificato."
                    })
                    .then((res) => {
                        return request(app)
                            .post('/api/v2/auth/login')
                            .set('Accept', 'application/json')
                            .send({
                                "username_email": "alice.fasoli@studenti.unitn.it",
                                "password": "alice.fasoli@studenti.unitn.it"
                            })
                            .expect('Content-Type', /json/)
                            .expect(200)
                            .then(
                                (res) => {
                                    let token = res.body.token;

                                    return request(app)
                                        .post('/api/v2/service/sell_products')
                                        .set('Authorization', `Bearer ${token}`)
                                        .send({
                                            "biglietto_id": "629e090c21af11d285d001a5",
                                            "products_list": [
                                                service.products_ids[0]
                                            ]
                                        })
                                        .expect({
                                            status: 403,
                                            message: 'Non hai ancora attivato il turno.'
                                        });
                                }
                            );
                    });
            }
        );
    });
});

// TEST GET SERVIZI
describe('GET /api/v2/service/get_servizi', () => {
    // TEST SPRINT-2 8
    test('GET /api/v2/service/get_servizi con token corretto', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "alice.fasoli@studenti.unitn.it",
                "password": "alice.fasoli@studenti.unitn.it"
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .get('/api/v2/service/get_servizi')
                        .set('Authorization', `Bearer ${token}`)
                        .then(
                            (res) => {
                                let error = true;
                                if (res.body.status === 200 &&
                                    res.body.message !== "") {
                                    error = false;
                                }
                                return !error;
                            }
                        );
                }
            );
    });

    // TEST SPRINT-2 8.1
    test('GET /api/v2/service/get_servizi con token corretto', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_o_senza_servizi",
                "password": "test_o_senza_servizi"
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .get('/api/v2/service/get_servizi')
                        .set('Authorization', `Bearer ${token}`)
                        .expect({
                            status: 200,
                            message: []
                        });
                }
            );
    });

    // TEST SPRINT-2 8.2
    test('GET /api/v2/service/get_servizi senza token', () => {
        let token = "";
        return request(app)
            .get('/api/v2/service/get_servizi')
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 401,
                message: 'No token, unauthorized.'
            });
    });

    // TEST SPRINT-2 8.3
    test('GET /api/v2/service/get_servizi con token errato', () => {
        let token = "wrongToken";
        return request(app)
            .get('/api/v2/service/get_servizi')
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 403,
                message: 'Wrong token, forbidden.'
            });
    });

    // TEST SPRINT-2 8.4
    test('GET /api/v2/service/get_servizi con token corretto', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .get('/api/v2/service/get_servizi')
                        .set('Authorization', `Bearer ${token}`)
                        .expect({
                            status: 403,
                            message: 'Non ti è possibile cercare i servizi.'
                        });
                }
            );
    });
});

// TEST GET SERVIZIO BY ID
describe('GET /api/v2/service/get_by_id', () => {
    // TEST SPRINT-2 9
    test('GET /api/v2/service/get_by_id con token e service id corretti', () => {
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
                        "service_id": service.service_id
                    };
                    return request(app)
                        .get(generate_url_with_attr('/api/v2/service/get_by_id', attribute))
                        .set('Authorization', `Bearer ${token}`)
                        .then(
                            (res) => {
                                let error = true;
                                if (res.body.status === 200 &&
                                    res.body.message !== "") {
                                    error = false;
                                }
                                return !error;
                            }
                        );
                }
            );
    });

    // TEST SPRINT-2 9.1
    test('GET /api/v2/service/get_by_id senza token', () => {
        let token = "";
        let attribute = {
            "service_id": service.service_id
        };
        return request(app)
            .get(generate_url_with_attr('/api/v2/service/get_by_id', attribute))
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 401,
                message: 'No token, unauthorized.'
            });
    });

    // TEST SPRINT-2 9.2
    test('GET /api/v2/service/get_by_id con token errato', () => {
        let token = "wrongToken";
        let attribute = {
            "service_id": service.service_id
        };
        return request(app)
            .get(generate_url_with_attr('/api/v2/service/get_by_id', attribute))
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 403,
                message: 'Wrong token, forbidden.'
            });
    });

    // TEST SPRINT-2 9.3
    test('GET /api/v2/service/get_by_id con token e service id corretti', () => {
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
                        "service_id": service_due.service_id
                    };
                    return request(app)
                        .get(generate_url_with_attr('/api/v2/service/get_by_id', attribute))
                        .set('Authorization', `Bearer ${token}`)
                        .expect({
                            status: 403,
                            message: 'Non ti è possibile recuperare questo servizio.'
                        });
                }
            );
    });

    // TEST SPRINT-2 9.4
    test('GET /api/v2/service/get_by_id con token corretto e service id errato', () => {
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
                        "service_id": "629dfdc4002f39011b92bc0f"
                    };
                    return request(app)
                        .get(generate_url_with_attr('/api/v2/service/get_by_id', attribute))
                        .set('Authorization', `Bearer ${token}`)
                        .expect({
                            status: 409,
                            message: 'Nessun servizio trovato.'
                        });
                }
            );
    });

    // TEST SPRINT-1 9.5
    test('GET /api/v2/service/get_by_id parametri mancanti', () => {
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
                    let attribute = {};
                    return request(app)
                        .get(generate_url_with_attr('/api/v2/service/get_by_id', attribute))
                        .set('Authorization', `Bearer ${token}`)
                        .expect({
                            status: 422,
                            message: 'Parametri mancanti.'
                        });
                }
            );
    });
});

// TEST MODIFICA SERVIZIO
describe('PUT /api/v2/service/modifica', () => {
    // TEST SPRINT-2 10
    test('PUT /api/v2/service/modifica con token e nome, lista dei prodotti corretti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_o",
                "password": "test_o"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .put('/api/v2/service/modifica')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "id": service.service_id,
                            "name": "Test_servizio1",
                            "products": [{
                                "name": 'Prodotto_test1',
                                "price": 5
                            }]
                        })
                        .expect({
                            status: 200,
                            message: 'Servizio modificato.'
                        });
                }
            );
    });

    // TEST SPRINT-2 10.1
    test('PUT /api/v2/service/modifica senza token', () => {
        let token = "";
        return request(app)
            .put('/api/v2/service/modifica')
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .send({
                "id": service.service_id,
                "name": "Test_servizio1",
                "products": [{
                    "name": 'Prodotto_test1',
                    "price": 5
                }]
            })
            .expect({
                status: 401,
                message: 'No token, unauthorized.'
            });
    });

    // TEST SPRINT-2 10.2
    test('PUT /api/v2/service/modifica con token errato', () => {
        let token = "wrongToken";
        return request(app)
            .put('/api/v2/service/modifica')
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .send({
                "id": service.service_id,
                "name": "Test_servizio1",
                "products": [{
                    "name": 'Prodotto_test1',
                    "price": 5
                }]
            })
            .expect({
                status: 403,
                message: 'Wrong token, forbidden.'
            });
    });

    // TEST SPRINT-2 10.3
    test('PUT /api/v2/service/modifica con parametri corretti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_o",
                "password": "test_o"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .put('/api/v2/service/modifica')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "id": service_due.service_id,
                            "name": "Test_servizio1",
                            "products": [{
                                "name": 'Prodotto_test1',
                                "price": 5
                            }]
                        })
                        .expect({
                            status: 403,
                            message: 'Non ti è possibile recuperare questo servizio.'
                        });
                }
            );
    });

    // TEST SPRINT-2 10.4
    test('PUT /api/v2/service/modifica con parametri corretti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_o",
                "password": "test_o"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .put('/api/v2/service/modifica')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "id": "629dfdc4002f39011b92bc0f",
                            "name": "Test_servizio1",
                            "products": [{
                                "name": 'Prodotto_test1',
                                "price" : 10
                            }]
                        })
                        .expect({
                            status: 409,
                            message: 'Nessun servizio trovato.'
                        });
                }
            );
    });

    // TEST SPRINT-2 10.5
    test('PUT /api/v2/service/modifica parametri mancanti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_o",
                "password": "test_o"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .put('/api/v2/service/modifica')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "id": service.service_id,
                            "name": "Test_servizio1"
                        })
                        .expect({
                            status: 422,
                            message: 'Parametri mancanti.'
                        });
                }
            );
    });

});