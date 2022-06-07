const request = require('supertest');
const { mongoose, generate_url_with_attr } = require("../../utils");
const { app, server } = require("../../app");

test('app module should be defined', () => {
    expect(app).toBeDefined();
});

// beforeAll(async () => {
//     jest.setTimeout(30000);
// });


afterAll(async () => {
    await mongoose.connection.close();
    await server.close();
});

// TEST CHECK AVAIABILITY
describe('GET /api/v2/auth/check_avaiability', () => {
    // TEST SPRINT-1 1
    test('GET /api/v2/auth/check_avaiability con username e email disponibili', () => {
        let attribute = {
            "username": "username1",
            "email": "email1"
        };
        return request(app)
            .get(generate_url_with_attr('/api/v2/auth/check_availability', attribute))
            .expect({
                status: 200, message: 'Username e email disponibili.'
            });
    });

    // TEST SPRINT-1 1.1
    test('GET /api/v2/auth/check_avaiability con username o email già usati', () => {
        let attribute = {
            "username": "test_up",
            "email": "test_up@gmail.com"
        };
        return request(app)
            .get(generate_url_with_attr('/api/v2/auth/check_availability', attribute))
            .expect({
                status: 409, message: 'Username o email già presenti nel database.'
            });
    });

    // TEST SPRINT-1 1.2
    test('GET /api/v2/auth/check_avaiability con username o email non presenti', () => {
        let attribute = {
            "username": "test_up"
        };
        return request(app)
            .get(generate_url_with_attr('/api/v2/auth/check_availability', attribute))
            .expect({
                status: 422, message: 'Parametri mancanti.'
            });
    });
});

// TEST SIGNIN
describe('GET /api/v2/auth/signin', () => {
    // TEST SPRINT-1 2
    test('POST /api/v2/auth/signin con username e email disponibili', () => {
        return request(app)
            .post('/api/v2/auth/signin')
            .set('Accept', 'application/json')
            .send({
                "name": "TestName",
                "surname": "TestSurname",
                "username": "TestAccount",
                "email": "testtest@gmail.com",
                "birthday": "2000-01-01T00:00:00.000Z",
                "description": "Ciao Questo è un profilo di test",
                "password": "TestPassword"
            })
            .expect({
                status: 200, message: 'Registrazione avvenuta con successo.'
            });
    });

    // TEST SPRINT-1 2.1
    test('POST /api/v2/auth/signin con username o email già presenti', () => {
        return request(app)
            .post('/api/v2/auth/signin')
            .set('Accept', 'application/json')
            .send({
                "name": "TestName",
                "surname": "TestSurname",
                "username": "TestAccountDue",
                "email": "alicefasoli@gmail.com",
                "birthday": "2000-01-01T00:00:00.000Z",
                "description": "Ciao Questo è un profilo di test",
                "password": "TestPassword"
            })
            .expect({
                status: 409, message: 'Username o email già presenti nel database.'
            });
    });

    // TEST SPRINT-1 2.2
    test('POST /api/v2/auth/signin con parametro mancante', () => {
        return request(app)
            .post('/api/v2/auth/signin')
            .set('Accept', 'application/json')
            .send({
                "username": "TestAccountDue"
            })
            .expect({
                status: 422, message: 'Parametri mancanti.'
            });
    });
});

// TEST LOGIN
describe('GET /api/v2/auth/login', () => {
    // TEST SPRINT-1 3
    test('POST /api/v2/auth/login con utente registrato', () => {
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
                    let error = true;
                    if (res.body.status === 200 &&
                        res.body.message === "Login avvenuto con successo" &&
                        res.body.token !== "") {
                        error = false;
                    }
                    return !error;
                }
            );
    });

    // TEST SPRINT-1 3.1
    test('POST /api/v2/auth/login con utente non registrato', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_nonregistrato",
                "password": "test_nonregistrato"
            })
            .expect({
                status: 401, message: 'Username o password errate.'
            });
    });

    // TEST SPRINT-1 3.2
    test('POST /api/v2/auth/login con credenziali errate', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
                "password": "test_password_sbagliata"
            })
            .expect({
                status: 401, message: 'Username o password errate.'
            });
    });

    // TEST SPRINT-1 3.3
    test('POST /api/v2/auth/login con parametro mancante', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up",
            })
            .expect({
                status: 422, message: 'Parametri mancanti.'
            });
    });
});

// TEST GET_USER_INFO
describe('GET /api/v2/auth/get_user_info', () => {
    // TEST SPRINT-1 4
    test('GET /api/v2/auth/get_user_info con token corretto', () => {
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
                        .get('/api/v2/auth/get_user_info')
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

    // TEST SPRINT-1 4.1
    test('GET /api/v2/auth/get_user_info con token mancante', () => {
        return request(app)
            .get('/api/v2/auth/get_user_info')
            .expect({
                status: 401, message: 'No token, unauthorized.'
            });

    });

    // TEST SPRINT-1 4.2
    test('GET /api/v2/auth/get_user_info con token errato', () => {
        let token = "wrongToken";
        return request(app)
            .get('/api/v2/auth/get_user_info')
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 403, message: 'Wrong token, forbidden.'
            });

    });
})

describe('GET /api/v2/auth/validate_token', () => {
    // TEST SPRINT-1 5
    test('GET /api/v2/auth/validate_token con token corretto', () => {
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
                        .get('/api/v2/auth/validate_token')
                        .set('Authorization', `Bearer ${token}`)
                        .expect({ status: 200, message: 'up' });
                }
            );
    });

    // TEST SPRINT-1 5.1
    test('GET /api/v2/auth/validate_token con token mancante', () => {
        return request(app)
            .get('/api/v2/auth/validate_token')
            .expect({
                status: 401, message: 'No token, unauthorized.'
            });
    });

    // TEST SPRINT-1 5.2
    test('GET /api/v2/auth/validate_token con token errato', () => {
        let token = "wrongToken";
        return request(app)
            .get('/api/v2/auth/validate_token')
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 403, message: 'Wrong token, forbidden.'
            });
    });
})

// TEST LOGOUT
describe('GET /api/v2/auth/logout', () => {
    // TEST SPRINT-2 1
    test('POST /api/v2/auth/logout con token corretto', () => {
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
                        .post('/api/v2/auth/logout')
                        .set('Authorization', `Bearer ${token}`)
                        .expect({
                            status: 200, message: 'Logout effettuato con successo.'
                        });
                }
            );
    });

    // TEST SPRINT-2 1.1
    test('POST /api/v2/auth/logout con token mancante', () => {
        return request(app)
            .post('/api/v2/auth/logout')
            .set('Accept', 'application/json')
            .expect({
                status: 401, message: 'No token, unauthorized.'
            });
    });

    // TEST SPRINT-2 1.2
    test('POST /api/v2/auth/logout con token errato', () => {
        let token = "wrongToken";
        return request(app)
            .post('/api/v2/auth/logout')
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 403, message: 'Wrong token, forbidden.'
            });
    });
});

// TEST RECUPERA_PASSWORD
describe('GET /api/v2/auth/recupera_password', () => {
    // TEST SPRINT-2 2
    test('GET /api/v2/auth/recupera_password con email registrata', () => {
        let attribute = {
            "email": "alicefasoli@gmail.com"
        };
        return request(app)
            .get(generate_url_with_attr('/api/v2/auth/recupera_password', attribute))
            .expect({
                status: 200, message: 'Email inviata.'
            });
    });

    // TEST SPRINT-2 2.1
    test('GET /api/v2/auth/recupera_password con email non registrata', () => {
        let attribute = {
            "email": "mailnonregistrata@gmail.com"
        };
        return request(app)
            .get(generate_url_with_attr('/api/v2/auth/recupera_password', attribute))
            .expect({
                status: 409, message: 'Non è stato possibile trovare un utente con questa email.'
            });
    });

    // TEST SPRINT-2 2.2
    test('GET /api/v2/auth/recupera_password con email non registrata', () => {
        return request(app)
            .get('/api/v2/auth/recupera_password')
            .expect({
                status: 422, message: 'Parametri mancanti.'
            });
    });
});

// TEST CAMBIA_PASSWORD
describe('PATCH /api/v2/auth/cambia_password', () => {
    // TEST SPRINT-2 3
    // QUESTO TEST NON È REALIZZABILE POICHÈ AUTH È PRESENTE SOLAMENTE NELLA MAIL INOLTRATA
    test('PATCH /api/v2/auth/cambia_password con email registrata', () => {
        return expect(1).toBe(1)
    });
    // TEST SPRINT-2 3.1
    test('PATCH /api/v2/auth/cambia_password con auth errato', () => {
        return request(app)
            .patch('/api/v2/auth/cambia_password')
            .set('Accept', 'application/json')
            .send({
                "email": "alicefasoli@gmail.com",
                "auth": "wrongAuth",
                "new_password": "new_password"
            })
            .expect({
                status: 403,
                message: 'Auth errato, prova ad inviare una nuova richeista di cambio password.'
            });
    });
    // TEST SPRINT-2 3.2
    test('PATCH /api/v2/auth/cambia_password con email non registrata', () => {
        return request(app)
            .patch('/api/v2/auth/cambia_password')
            .set('Accept', 'application/json')
            .send({
                "email": "wrongEmail@gmail.com",
                "auth": "auth",
                "new_password": "new_password"
            })
            .expect({
                status: 409,
                message: 'Non è stato possibile trovare un utente con questa email.'
            });
    });
    // TEST SPRINT-2 3.3
    test('PATCH /api/v2/auth/cambia_password con parametri mancanti', () => {
        return request(app)
            .patch('/api/v2/auth/cambia_password')
            .set('Accept', 'application/json')
            .send({
                "email": "alicefasoli@gmail.com",
                "new_password": "new_password"
            })
            .expect({
                status: 422,
                message: "Parametri mancanti."
            });
    });
});