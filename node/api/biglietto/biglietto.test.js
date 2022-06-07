const request = require('supertest');
const { mongoose, generate_url_with_attr } = require("../../utils");
const { app, server } = require("../../app");

test('app module should be defined', () => {
    expect(app).toBeDefined();
});

afterAll(async () => {
    await mongoose.connection.close();
    await server.close();
});

// TEST GET BIGLIETTI FUTURI BY USER
describe('GET /api/v2/biglietto/get_biglietti_futuri_by_user', () => {
    // TEST SPRINT-1 6
    test('GET /api/v2/biglietto/get_biglietti_futuri_by_user con token corretto', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect('Content-Type', /json/)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .get('/api/v2/biglietto/get_biglietti_futuri_by_user')
                        .set('Authorization', `Bearer ${token}`)
                        .expect('Content-Type', /json/)
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

    // TEST SPRINT-1 6.1
    test('GET /api/v2/biglietto/get_biglietti_futuri_by_user con token corretto', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "Test_username_futuri",
                "password": "Test_psw_futuri"
            })
            .expect('Content-Type', /json/)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .get('/api/v2/biglietto/get_biglietti_futuri_by_user')
                        .set('Authorization', `Bearer ${token}`)
                        .then(
                            (res) => {
                                let error = true;
                                if (res.body.status === 200 &&
                                    res.body.message === "") {
                                    error = false;
                                }
                                return !error;
                            }
                        );
                }
            );
    });

    // TEST SPRINT-1 6.2
    test('GET /api/v2/biglietto/get_biglietti_futuri_by_user senza token', () => {
        let token = "";
        return request(app)
            .get('/api/v2/biglietto/get_biglietti_futuri_by_user')
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 401,
                message: 'No token, unauthorized.'
            });
    });

    // TEST SPRINT-1 6.3
    test('GET /api/v2/biglietto/get_biglietti_futuri_by_user con token errato', () => {
        let token = "wrongToken";
        return request(app)
            .get('/api/v2/biglietto/get_biglietti_futuri_by_user')
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 403,
                message: 'Wrong token, forbidden.'
            });
    });
});

// TEST GET BIGLIETTI SCADUTI BY USER
describe('GET /api/v2/biglietto/get_biglietti_scaduti_by_user', () => {
    // TEST SPRINT-1 7
    test('GET /api/v2/biglietto/get_biglietti_scaduti_by_user con token corretto', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect('Content-Type', /json/)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .get('/api/v2/biglietto/get_biglietti_scaduti_by_user')
                        .set('Authorization', `Bearer ${token}`)
                        .expect('Content-Type', /json/)
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

    // TEST SPRINT-1 7.1
    test('GET /api/v2/biglietto/get_biglietti_scaduti_by_user con token corretto', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "Test_username_passati",
                "password": "Test_psw_passati"
            })
            .expect('Content-Type', /json/)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .get('/api/v2/biglietto/get_biglietti_scaduti_by_user')
                        .set('Authorization', `Bearer ${token}`)
                        .then(
                            (res) => {
                                let error = true;
                                if (res.body.status === 200 &&
                                    res.body.message === "") {
                                    error = false;
                                }
                                return !error;
                            }
                        );
                }
            );
    });

    // TEST SPRINT-1 7.2
    test('GET /api/v2/biglietto/get_biglietti_scaduti_by_user senza token', () => {
        let token = "";
        return request(app)
            .get('/api/v2/biglietto/get_biglietti_scaduti_by_user')
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 401,
                message: 'No token, unauthorized.'
            });
    });

    // TEST SPRINT-1 7.3
    test('GET /api/v2/biglietto/get_biglietti_scaduti_by_user con token errato', () => {
        let token = "wrongToken";
        return request(app)
            .get('/api/v2/biglietto/get_biglietti_scaduti_by_user')
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 403,
                message: 'Wrong token, forbidden.'
            });
    });
});

// TEST ATTIVA BIGLIETTO
describe('POST /api/v2/biglietto/activate', () => {
    // TEST SPRINT-1 8
    test('POST /api/v2/biglietto/activate con token corretto', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect('Content-Type', /json/)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/biglietto/activate')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "biglietto_id": "629e090c21af11d285d001a5",
                            "event_id": "629dfdc4002f39011b92bc0f"
                        })
                        .expect('Content-Type', /json/)
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

    // TEST SPRINT-1 8.1
    test('POST /api/v2/biglietto/activate senza token', () => {
        let token = "";
        return request(app)
            .post('/api/v2/biglietto/activate')
            .set('Authorization', `Bearer ${token}`)
            .send({
                "biglietto_id": "629e090c21af11d285d001a5",
                "event_id": "629dfdc4002f39011b92bc0f"
            })
            .expect({
                status: 401,
                message: 'No token, unauthorized.'
            });
    });

    // TEST SPRINT-1 8.2
    test('POST /api/v2/biglietto/activate con token errato', () => {
        let token = "wrongToken";
        return request(app)
            .post('/api/v2/biglietto/activate')
            .set('Authorization', `Bearer ${token}`)
            .send({
                "biglietto_id": "629e090c21af11d285d001a5",
                "event_id": "629dfdc4002f39011b92bc0f"
            })
            .expect({
                status: 403,
                message: 'Wrong token, forbidden.'
            });
    });

    // TEST SPRINT-1 8.3
    test('POST /api/v2/biglietto/activate con token corretto e biglietto id non presente nel database', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect('Content-Type', /json/)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/biglietto/activate')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "biglietto_id": "629dfdc4002f39011b92bc0f",
                            "event_id": "629dfdc4002f39011b92bc0f"
                        })
                        .expect({
                            status: 409,
                            message: 'Nessun biglietto trovato.'
                        });
                }
            );
    });

    // TEST SPRINT-1 8.4
    test('POST /api/v2/biglietto/activate con token corretto e event id non presente nel database', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect('Content-Type', /json/)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/biglietto/activate')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "biglietto_id": "629e090c21af11d285d001a5",
                            "event_id": "629e090c21af11d285d001a5"
                        })
                        .expect({
                            status: 409,
                            message: 'Nessun evento trovato.'
                        });
                }
            );
    });

    // TEST SPRINT-1 8.5
    test('POST /api/v2/biglietto/activate con token coretto, biglietto id e evento id presenti nel database', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect('Content-Type', /json/)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/biglietto/activate')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "biglietto_id": "629e093a21af11d285d001f1",
                            "event_id": "629dfdc4002f39011b92bc0f"
                        })
                        .expect({
                            status: 409,
                            message: 'Non ti è possibile attivare il biglietto per questo evento.'
                        });
                }
            );
    });

    // TEST SPRINT-1 8.6
    test('POST /api/v2/biglietto/activate con token coretto, biglietto id e evento id presenti nel database', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect('Content-Type', /json/)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/biglietto/activate')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "biglietto_id": "629e12fa39d773df4999a843",
                            "event_id": "629e0040291ae58430fda201"
                        })
                        .expect({
                            status: 409,
                            message: 'Non ti è possibile attivare il biglietto per un evento che deve ancora iniziare.'
                        });
                }
            );
    });

    // TEST SPRINT-1 8.7
    test('POST /api/v2/biglietto/activate parametri mancanti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect('Content-Type', /json/)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/biglietto/activate')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "biglietto_id": "629e093a21af11d285d001f1"
                        })
                        .expect({
                            status: 422,
                            message: 'Parametri mancanti.'
                        });
                }
            );
    });
});

// TEST LISTA PRODOTTI
describe('GET /api/v2/biglietto/get_products', () => {
    // TEST SPRINT-1 9
    test('GET /api/v2/biglietto/get_products con token e biglietto id corretti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect('Content-Type', /json/)
            .then(
                (res) => {
                    let token = res.body.token;
                    let attribute = { "biglietto_id": "629e090c21af11d285d001a5" };

                    return request(app)
                        .get(generate_url_with_attr('/api/v2/biglietto/get_products', attribute))
                        .set('Authorization', `Bearer ${token}`)
                        .expect('Content-Type', /json/)
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

    // TEST SPRINT-1 9.1
    test('GET /api/v2/biglietto/get_products senza token', () => {
        let token = "";
        let attribute = { "biglietto_id": "629e090c21af11d285d001a5" };

        return request(app)
            .get(generate_url_with_attr('/api/v2/biglietto/get_products', attribute))
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 401,
                message: 'No token, unauthorized.'
            });
    });

    // TEST SPRINT-1 9.2
    test('GET /api/v2/biglietto/get_products con token errato e biglietto id corretto', () => {
        let token = "wrongToken";
        let attribute = { "biglietto_id": "629e090c21af11d285d001a5" };

        return request(app)
            .get(generate_url_with_attr('/api/v2/biglietto/get_products', attribute))
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 403,
                message: 'Wrong token, forbidden.'
            });
    });

    // TEST SPRINT-1 9.3
    test('GET /api/v2/biglietto/get_products con token corretto e biglietto id errato', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect('Content-Type', /json/)
            .then(
                (res) => {
                    let token = res.body.token;
                    let attribute = {
                        "biglietto_id": "629dfdc4002f39011b92bc0f"
                    };

                    return request(app)
                        .get(generate_url_with_attr('/api/v2/biglietto/get_products', attribute))
                        .set('Authorization', `Bearer ${token}`)
                        .expect({
                            status: 409,
                            message: 'Nessun biglietto trovato.'
                        });
                }
            );
    });

    // TEST SPRINT-2 4.6
    test('GET /api/v2/biglietto/get_products parametri mancanti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect('Content-Type', /json/)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .get('/api/v2/biglietto/get_products')
                        .set('Authorization', `Bearer ${token}`)
                        .expect({
                            status: 422,
                            message: 'Parametri mancanti.'
                        });
                }
            );
    });
});

// TEST DISATTIVA BIGLIETTO
describe('POST /api/v2/biglietto/deactivate', () => {
    // TEST SPRINT-2 4
    test('POST /api/v2/biglietto/deactivate con token corretto, biglietto id e evento id presenti nel database', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect('Content-Type', /json/)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/biglietto/deactivate')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "biglietto_id": "629e090c21af11d285d001a5",
                            "event_id": "629dfdc4002f39011b92bc0f"
                        })
                        .expect('Content-Type', /json/)
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

    // TEST SPRINT-2 4.1
    test('POST /api/v2/biglietto/deactivate senza token', () => {
        let token = "";
        return request(app)
            .post('/api/v2/biglietto/deactivate')
            .set('Authorization', `Bearer ${token}`)
            .send({
                "biglietto_id": "629e090c21af11d285d001a5",
                "event_id": "629dfdc4002f39011b92bc0f"
            })
            .expect({
                status: 401,
                message: 'No token, unauthorized.'
            });
    });

    // TEST SPRINT-2 4.2
    test('POST /api/v2/biglietto/deactivate con token errato, event id e biglietto id corretti', () => {
        let token = "wrongToken";
        return request(app)
            .post('/api/v2/biglietto/deactivate')
            .set('Authorization', `Bearer ${token}`)
            .send({
                "biglietto_id": "629e090c21af11d285d001a5",
                "event_id": "629dfdc4002f39011b92bc0f"
            })
            .expect({
                status: 403,
                message: 'Wrong token, forbidden.'
            });
    });

    // TEST SPRINT-2 4.3
    test('POST /api/v2/biglietto/deactivate con biglietto id non presente nel database', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect('Content-Type', /json/)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/biglietto/deactivate')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "biglietto_id": "629dfdc4002f39011b92bc0f",
                            "event_id": "629dfdc4002f39011b92bc0f"
                        })
                        .expect({
                            status: 409,
                            message: 'Nessun biglietto trovato.'
                        });
                }
            );
    });

    // TEST SPRINT-2 4.4
    test('POST /api/v2/biglietto/deactivate con evento id non presente nel database', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect('Content-Type', /json/)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/biglietto/deactivate')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "biglietto_id": "629e090c21af11d285d001a5",
                            "event_id": "629e090c21af11d285d001a5"
                        })
                        .expect({
                            status: 409,
                            message: 'Nessun evento trovato.'
                        });
                }
            );
    });

    // TEST SPRINT-2 4.5
    test('POST /api/v2/biglietto/deactivate con token coretto, biglietto id e evento id presenti nel database', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect('Content-Type', /json/)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/biglietto/deactivate')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "biglietto_id": "629e093a21af11d285d001f1",
                            "event_id": "629dfdc4002f39011b92bc0f"
                        })
                        .expect({
                            status: 409,
                            message: 'Non ti è possibile disattivare il biglietto per questo evento.'
                        });
                }
            );
    });

    // TEST SPRINT-2 4.6
    test('POST /api/v2/biglietto/deactivate parametri mancanti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect('Content-Type', /json/)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/biglietto/deactivate')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            "biglietto_id": "629e093a21af11d285d001f1"
                        })
                        .expect({
                            status: 422,
                            message: 'Parametri mancanti.'
                        });
                }
            );
    });
});