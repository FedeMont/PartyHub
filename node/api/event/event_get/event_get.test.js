const request = require('supertest');
const { mongoose, generate_url_with_attr } = require("../../../utils");
const { app, server } = require("../../../app");
const jestConfig = require('../../../jest.config');

test('app module should be defined', () => {
    expect(app).toBeDefined();
});

beforeAll(async () => {
    jest.setTimeout(8000);
});

afterAll(async () => {
    await mongoose.connection.close();
    await server.close();
});

// TEST GET EVENTS
describe('GET /api/v2/event/get/events', () => {
    jest.setTimeout(10000);
    // TEST SPRINT-1 17
    test('GET /api/v2/event/get/events con token corretto', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    let attribute = {
                        "latitude": "46.0664228",
                        "longitude": "11.1257601"
                    };
                    return request(app)
                        .get(generate_url_with_attr('/api/v2/event/get/events', attribute))
                        .set('Accept', 'application/json')
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

    // TEST SPRINT-1 17.1
    test('GET /api/v2/event/get/events con token corretto', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    let attribute = {
                        "latitude": "90.0664228",
                        "longitude": "4.1257601"
                    };
                    return request(app)
                        .get(generate_url_with_attr('/api/v2/event/get/events', attribute))
                        .set('Accept', 'application/json')
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

    // TEST SPRINT-1 17.2
    test('GET /api/v2/event/get/events senza token', () => {
        let token = "";
        let attribute = {
            "latitude": "46.0664228",
            "longitude": "11.1257601"
        };
        return request(app)
            .get(generate_url_with_attr('/api/v2/event/get/events', attribute))
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 401,
                message: 'No token, unauthorized.'
            });
    });

    // TEST SPRINT-1 17.3
    test('GET /api/v2/event/get/events con token errato', () => {
        let token = "wrongToken";
        let attribute = {
            "latitude": "46.0664228",
            "longitude": "11.1257601"
        };
        return request(app)
            .get(generate_url_with_attr('/api/v2/event/get/events', attribute))
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 403,
                message: 'Wrong token, forbidden.'
            });
    });

    // TEST SPRINT-1 17.4
    test('GET /api/v2/event/get/events parametri mancanti', () => {
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
                    let attribute = {
                        "longitude": "11.1257601"
                    };
                    return request(app)
                        .get(generate_url_with_attr('/api/v2/event/get/events', attribute))
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .expect({
                            status: 422,
                            message: 'Parametri mancanti.'
                        });
                }
            );
    });
});

// TEST GET EVENTS BY ADDRESS
describe('GET /api/v2/event/get/by_address', () => {
    jest.setTimeout(10000);
    // TEST SPRINT-1 18
    test('GET /api/v2/event/get/by_address con token corretto', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    let attribute = {
                        "address": "Via sommarive, 5, Povo, Trento"
                    };
                    return request(app)
                        .get(generate_url_with_attr('/api/v2/event/get/by_address', attribute))
                        .set('Accept', 'application/json')
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

    // TEST SPRINT-1 18.1
    test('GET /api/v2/event/get/by_address con token corretto', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    let attribute = {
                        "address": "Via Roma, 5, Povo, Trento"
                    };
                    return request(app)
                        .get(generate_url_with_attr('/api/v2/event/get/by_address', attribute))
                        .set('Accept', 'application/json')
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

    // TEST SPRINT-1 18.2
    test('GET /api/v2/event/get/by_address senza token', () => {
        let token = "";
        let attribute = {
            "address": "Via sommarive, 5, Povo, Trento"
        };
        return request(app)
            .get(generate_url_with_attr('/api/v2/event/get/by_address', attribute))
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 401,
                message: 'No token, unauthorized.'
            });
    });

    // TEST SPRINT-1 18.3
    test('GET /api/v2/event/get/by_address con token errato', () => {
        let token = "wrongToken"
        let attribute = {
            "address": "Via sommarive, 5, Povo, Trento"
        };
        return request(app)
            .get(generate_url_with_attr('/api/v2/event/get/by_address', attribute))
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 403,
                message: 'Wrong token, forbidden.'
            });
    });

    // TEST SPRINT-1 18.4
    test('GET /api/v2/event/get/by_address parametri mancanti', () => {
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
                    let attribute = {};
                    return request(app)
                        .get(generate_url_with_attr('/api/v2/event/get/by_address', attribute))
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .expect({
                            status: 422,
                            message: 'Parametri mancanti.'
                        });
                }
            );
    });
});

// TEST GET EVENTS BY USER
describe('GET /api/v2/event/get/by_user', () => {
    // TEST SPRINT-1 19
    test('GET /api/v2/event/get/by_user con token corretto', () => {
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
                        .get('/api/v2/event/get/by_user')
                        .set('Accept', 'application/json')
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

    // TEST SPRINT-1 19.1
    test('GET /api/v2/event/get/by_user con token corretto', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_o_due",
                "password": "test_o_due"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .get('/api/v2/event/get/by_user')
                        .set('Accept', 'application/json')
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

    // TEST SPRINT-1 19.2
    test('GET /api/v2/event/get/by_user senza token', () => {
        let token = "";
        return request(app)
            .get('/api/v2/event/get/by_user')
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 401,
                message: 'No token, unauthorized.'
            });
    });

    // TEST SPRINT-1 19.3
    test('GET /api/v2/event/get/by_user con token errato', () => {
        let token = "wrongToken";
        return request(app)
            .get('/api/v2/event/get/by_user')
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 403,
                message: 'Wrong token, forbidden.'
            });
    });
});

// TEST GET EVENTS BY ID
describe('GET /api/v2/event/get/by_id', () => {
    // TEST SPRINT-2 14
    test('GET /api/v2/event/get/by_id con token corretto', () => {
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
                    let attribute = {
                        "event_id": "629e0040291ae58430fda201"
                    };
                    return request(app)
                        .get(generate_url_with_attr('/api/v2/event/get/by_id', attribute))
                        .set('Accept', 'application/json')
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

    // TEST SPRINT-2 14.1
    test('GET /api/v2/event/get/by_id senza token', () => {
        let token = "";
        let attribute = {
            "event_id": "629e0040291ae58430fda201"
        };
        return request(app)
            .get(generate_url_with_attr('/api/v2/event/get/by_id', attribute))
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 401,
                message: 'No token, unauthorized.'
            });
    });

    // TEST SPRINT-2 14.2
    test('GET /api/v2/event/get/by_id con token errato', () => {
        let token = "wrongToken";
        let attribute = {
            "event_id": "629e0040291ae58430fda201"
        };
        return request(app)
            .get(generate_url_with_attr('/api/v2/event/get/by_id', attribute))
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 403,
                message: 'Wrong token, forbidden.'
            });
    });

    // TEST SPRINT-2 14.3
    test('GET /api/v2/event/get/by_id con token e event id corretto', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    let attribute = {
                        "event_id": "629f4853b188cb658ec3d33e"
                    };
                    return request(app)
                        .get(generate_url_with_attr('/api/v2/event/get/by_id', attribute))
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .expect({
                            status: 409,
                            message: 'Nessun evento trovato.'
                        });
                }
            );
    });

    // TEST SPRINT-2 14.4
    test('GET /api/v2/event/get/by_id parametri mancanti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .get('/api/v2/event/get/by_id')
                        .set('Authorization', `Bearer ${token}`)
                        .expect({
                            status: 422,
                            message: 'Parametri mancanti.'
                        });
                }
            );
    });
});

// TEST GET EVENTS BY BIGLIETTO ID
describe('GET /api/v2/event/get/by_biglietto_id', () => {
    // TEST SPRINT-2 15
    test('GET /api/v2/event/get/by_biglietto_id con token corretto', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    let attribute = {
                        "biglietto_id": "629e12fa39d773df4999a843"
                    };
                    return request(app)
                        .get(generate_url_with_attr('/api/v2/event/get/by_biglietto_id', attribute))
                        .set('Accept', 'application/json')
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

    // TEST SPRINT-2 15.1
    test('GET /api/v2/event/get/by_biglietto_id senza token', () => {
        let token = "";
        let attribute = {
            "biglietto_id": "629e12fa39d773df4999a843"
        };
        return request(app)
            .get(generate_url_with_attr('/api/v2/event/get/by_biglietto_id', attribute))
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 401,
                message: 'No token, unauthorized.'
            });
    });

    // TEST SPRINT-2 15.2
    test('GET /api/v2/event/get/by_biglietto_id con token errato', () => {
        let token = "wrongToken";
        let attribute = {
            "biglietto_id": "629e12fa39d773df4999a843"
        };
        return request(app)
            .get(generate_url_with_attr('/api/v2/event/get/by_biglietto_id', attribute))
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 403,
                message: 'Wrong token, forbidden.'
            });
    });

    // TEST SPRINT-2 15.3
    test('GET /api/v2/event/get/by_biglietto_id con token e event id corretto', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    let attribute = {
                        "biglietto_id": "629f4855b188cb658ec3d35a"
                    };
                    return request(app)
                        .get(generate_url_with_attr('/api/v2/event/get/by_biglietto_id', attribute))
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .expect({
                            status: 409,
                            message: 'Nessun biglietto trovato.'
                        });
                }
            );
    });

    // TEST SPRINT-2 15.4
    test('GET /api/v2/event/get/by_biglietto_id parametri mancanti', () => {
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
                    let attribute = {};
                    return request(app)
                        .get(generate_url_with_attr('/api/v2/event/get/by_biglietto_id', attribute))
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .expect({
                            status: 422,
                            message: 'Parametri mancanti.'
                        });
                }
            );
    });
});

// TEST GET STORICO EVENTI FUTURI
describe('GET /api/v2/event/get/storico_eventi_futuri', () => {
    // TEST SPRINT-1 16
    test('GET /api/v2/event/get/storico_eventi_futuri con token corretto', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .get('/api/v2/event/get/storico_eventi_futuri')
                        .set('Accept', 'application/json')
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

    // TEST SPRINT-2 16.1
    test('GET /api/v2/event/get/storico_eventi_futuri con token corretto', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "Test_username_futuri",
                "password": "Test_psw_futuri"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .get('/api/v2/event/get/storico_eventi_futuri')
                        .set('Accept', 'application/json')
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

    // TEST SPRINT-2 16.2
    test('GET /api/v2/event/get/storico_eventi_futuri senza token', () => {
        let token = "";
        return request(app)
            .get('/api/v2/event/get/storico_eventi_futuri')
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 401,
                message: 'No token, unauthorized.'
            });
    });

    // TEST SPRINT-2 16.3
    test('GET /api/v2/event/get/storico_eventi_futuri con token errato', () => {
        let token = "wrongToken";
        return request(app)
            .get('/api/v2/event/get/storico_eventi_futuri')
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 403,
                message: 'Wrong token, forbidden.'
            });
    });
});


// TEST GET STORICO EVENTI PASSATI
describe('GET /api/v2/event/get/storico_eventi_passati', () => {
    // TEST SPRINT-1 17
    test('GET /api/v2/event/get/storico_eventi_passati con token corretto', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_up"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .get('/api/v2/event/get/storico_eventi_passati')
                        .set('Accept', 'application/json')
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

    // TEST SPRINT-2 17.1
    test('GET /api/v2/event/get/storico_eventi_passati con token corretto', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "Test_username_passati",
                "password": "Test_psw_passati"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .get('/api/v2/event/get/storico_eventi_passati')
                        .set('Accept', 'application/json')
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

    // TEST SPRINT-2 17.2
    test('GET /api/v2/event/get/storico_eventi_passati senza token', () => {
        let token = "";
        return request(app)
            .get('/api/v2/event/get/storico_eventi_passati')
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 401,
                message: 'No token, unauthorized.'
            });
    });

    // TEST SPRINT-2 17.3
    test('GET /api/v2/event/get/storico_eventi_passati con token errato', () => {
        let token = "wrongToken";
        return request(app)
            .get('/api/v2/event/get/storico_eventi_passati')
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 403,
                message: 'Wrong token, forbidden.'
            });
    });
});

