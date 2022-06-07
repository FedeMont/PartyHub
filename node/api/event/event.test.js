const request = require('supertest');
const { mongoose, generate_url_with_attr } = require("../../utils");
const { app, server } = require("../../app");

test('app module should be defined', () => {
    expect(app).toBeDefined();
});

// beforeAll(() => {
//     jest.setTimeout(30000);
// });

afterAll(async () => {
    await mongoose.connection.close();
    await server.close();
});

let event_id = "";
let passato_event_id = "";
let event2_id = "";

const save_event_id = (id, type) => {
    let e_id = id;

    switch (type) {
        case "evento":
            event_id = id;
            break;
        case "passato":
            passato_event_id = id
            break;
        case "evento2":
            event2_id = id;
            break;
    }
    return Promise.resolve(e_id);
};

// TEST CREA EVENTO
describe('POST /api/v2/event/crea', () => {
    jest.setTimeout(30000);

    // TEST SPRINT-1 14
    test('POST /api/v2/event/crea con parametri corretti', async () => {

        return await request(app)
            .post('/api/v2/auth/signin')
            .set('Accept', 'application/json')
            .send({
                "name": "EventTestName",
                "surname": "EventTestSurname",
                "username": "event_test_up",
                "email": "event_test_up@gmail.com",
                "birthday": "2000-01-01T00:00:00.000Z",
                "description": "Ciao Questo è un profilo di test",
                "password": "event_test_up"
            })
            .expect('Content-Type', /json/)
            .then(async () => {
                return await request(app)
                    .post('/api/v2/auth/login')
                    .set('Accept', 'application/json')
                    .send({
                        username_email: "test_o",
                        password: "test_o"
                    })
                    .expect(200)
                    .then(
                        async (res) => {
                            let token = res.body.token;
                            return await request(app)
                                .post('/api/v2/event/crea')
                                .set('Accept', 'application/json')
                                .set('Authorization', `Bearer ${token}`)
                                .send({
                                    name: "Party_test",
                                    address: "Via Giuseppe Verdi, 77, 38122 Trento TN",
                                    // poster: "",
                                    start_datetime: "2022/07/09 21:30",
                                    end_datetime: "2022/07/10 5:00",
                                    age_range: "20-30",
                                    maximum_partecipants: "1"
                                })
                                .expect(200)
                                .then(async (res) => {
                                    await save_event_id(res.body.message, "evento");
        
                                    return await request(app)
                                        .post('/api/v2/event/crea')
                                        .set('Accept', 'application/json')
                                        .set('Authorization', `Bearer ${token}`)
                                        .send({
                                            name: "Party_test_passato",
                                            address: "Via Giuseppe Verdi, 77, 38122 Trento TN",
                                            // poster: "",
                                            start_datetime: "2022/03/09 21:30",
                                            end_datetime: "2022/03/10 5:00",
                                            age_range: "20-30",
                                            maximum_partecipants: "1"
                                        })
                                        .expect(200)
                                        .then(async (res) => {
                                            await save_event_id(res.body.message, "passato");
        
                                            console.log("\x1b[41m\x1b[36m#######################\x1b[0m");
        
                                            let start_datetime = new Date((new Date().setHours(new Date().getHours() - 3))).toLocaleString("en-US", {hour12: false}).replace(',', '');
                                            start_datetime = start_datetime.substring(0, start_datetime.length - 3);
                                            let end_datetime = new Date((new Date().setHours(new Date().getHours() + 3))).toLocaleString("en-US", {hour12: false}).replace(',', '');
                                            end_datetime = end_datetime.substring(0, end_datetime.length - 3);
        
                                            console.log(start_datetime, end_datetime);
        
                                            console.log("\x1b[41m\x1b[36m#######################\x1b[0m");
        
                                            return await request(app)
                                                .post('/api/v2/event/crea')
                                                .set('Accept', 'application/json')
                                                .set('Authorization', `Bearer ${token}`)
                                                .send({
                                                    name: "Party_test_2",
                                                    address: "Via Giuseppe Verdi, 77, 38122 Trento TN",
                                                    // poster: "",
                                                    start_datetime: start_datetime,
                                                    end_datetime: end_datetime,
                                                    age_range: "20-30",
                                                    maximum_partecipants: "100"
                                                })
                                                .expect(200)
                                                .then(async (res) => {
                                                    await save_event_id(res.body.message, "evento2");
                                                });
                                        });
                                });
                        }
                    );
            });
    });

    // TEST SPRINT-1 14.1
    test('POST /api/v2/event/crea senza token', () => {
        return request(app)
            .post('/api/v2/event/crea')
            .set('Accept', 'application/json')
            .send({
                name: "Party_test",
                address: "Via Giuseppe Verdi, 77, 38122 Trento TN",
                // poster: "",
                start_datetime: "2022/07/09 21:30",
                end_datetime: "2022/07/10 5:00",
                age_range: "20-30",
                maximum_partecipants: "1000"
            })
            .expect({
                status: 401,
                message: "No token, unauthorized."
            });
    });

    // TEST SPRINT-1 14.2
    test('POST /api/v2/event/crea con token errato', () => {
        let token = "wrongToken";
        return request(app)
            .post('/api/v2/event/crea')
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: "Party_test",
                address: "Via Giuseppe Verdi, 77, 38122 Trento TN",
                // poster: "",
                start_datetime: "2022/07/09 21:30",
                end_datetime: "2022/07/10 5:00",
                age_range: "20-30",
                maximum_partecipants: "1000"
            })
            .expect({
                status: 403,
                message: "Wrong token, forbidden."
            });
    });

    // TEST SPRINT-1 14.3
    test('POST /api/v2/event/crea con parametri corretti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                username_email: "test_o",
                password: "test_o"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/event/crea')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            name: "Party_test",
                            address: "Via Giuseppe Verdi, 77, 38122 Trento TN",
                            // poster: "",
                            start_datetime: "2022/07/10 21:30",
                            end_datetime: "2022/07/09 5:00",
                            age_range: "20-30",
                            maximum_partecipants: "1000"
                        })
                        .expect({
                            status: 409,
                            message: "La data di fine evento deve succedere quella di inizio evento."
                        });
                }
            );
    });

    // TEST SPRINT-1 14.4
    test('POST /api/v2/event/crea con parametri mancanti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                username_email: "test_o",
                password: "test_o"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/event/crea')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            address: "Via Giuseppe Verdi, 77, 38122 Trento TN",
                            // poster: "",
                            start_datetime: "2022/07/09 21:30",
                            end_datetime: "2022/07/10 5:00",
                            age_range: "20-30",
                            maximum_partecipants: "1000"
                        })
                        .expect({
                            status: 422,
                            message: "Parametri mancanti."
                        });
                }
            );
    });
});

// TEST ISCRIZIONE EVENTO
describe('POST /api/v2/event/iscrizione', () => {
    jest.setTimeout(30000);
    // TEST SPRINT-1 15
    test('POST /api/v2/event/iscrizione con parametri corretti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                username_email: "event_test_up",
                password: "event_test_up"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/event/iscrizione')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            event_id: event_id
                        })
                        .expect({
                            status: 200,
                            message: "Utente iscritto all'evento correttamente."
                        })
                        .then((res) => {
                            return request(app)
                                .post('/api/v2/event/iscrizione')
                                .set('Accept', 'application/json')
                                .set('Authorization', `Bearer ${token}`)
                                .send({
                                    event_id: event2_id
                                })
                                .expect({
                                    status: 200,
                                    message: "Utente iscritto all'evento correttamente."
                                })
                                .then((res) => {
                                    return request(app)
                                        .post('/api/v2/auth/login')
                                        .set('Accept', 'application/json')
                                        .send({
                                            username_email: "test_up_due",
                                            password: "test_up_due"
                                        })
                                        .expect(200)
                                        .then(
                                            (res) => {
                                                let token = res.body.token;
                                                return request(app)
                                                    .post('/api/v2/event/iscrizione')
                                                    .set('Accept', 'application/json')
                                                    .set('Authorization', `Bearer ${token}`)
                                                    .send({
                                                        event_id: event2_id
                                                    })
                                                    .expect({
                                                        status: 200,
                                                        message: "Utente iscritto all'evento correttamente."
                                                    });
                                            }
                                        );
                                });
                        });
                }
            );
    });

    // TEST SPRINT-1 15.1
    test('POST /api/v2/event/iscrizione senza token', () => {
        return request(app)
            .post('/api/v2/event/iscrizione')
            .set('Accept', 'application/json')
            .send({
                event_id: event_id
            })
            .expect({
                status: 401,
                message: "No token, unauthorized."
            });
    });

    // TEST SPRINT-1 15.2
    test('POST /api/v2/event/iscrizione con token errato', () => {
        let token = "wrongToken";
        return request(app)
            .post('/api/v2/event/iscrizione')
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .send({
                event_id: event_id
            })
            .expect({
                status: 403,
                message: "Wrong token, forbidden."
            });
    });

    // TEST SPRINT-1 15.3
    test('POST /api/v2/event/iscrizione con parametri corretti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                username_email: "test_up_due",
                password: "test_up_due"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/event/iscrizione')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            event_id: event_id
                        })
                        .expect({
                            status: 409,
                            message: "Il numero limite di partecipanti è già stato raggiunto."
                        });
                }
            );
    });

    // TEST SPRINT-1 15.4
    test('POST /api/v2/event/iscrizione con parametri corretti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                username_email: "event_test_up",
                password: "event_test_up"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/event/iscrizione')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            event_id: event_id
                        })
                        .expect({
                            status: 409,
                            message: "L'utente è già iscritto a questo evento."
                        });
                }
            );
    });

    // TEST SPRINT-1 15.5
    test('POST /api/v2/event/iscrizione con id evento errato', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                username_email: "event_test_up",
                password: "event_test_up"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/event/iscrizione')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            event_id: "6288ec25fe5bb453c76a62fa"
                        })
                        .expect({
                            status: 409,
                            message: "Nessun evento trovato."
                        });
                }
            );
    });

    // TEST SPRINT-1 15.6
    test('POST /api/v2/event/iscrizione con parametri mancanti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                username_email: "event_test_up",
                password: "event_test_up"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/event/iscrizione')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                        })
                        .expect({
                            status: 422,
                            message: "Parametri mancanti."
                        });
                }
            );
    });
});

// TEST DISISCRIZIONE EVENTO
describe('POST /api/v2/event/disiscrizione', () => {
    jest.setTimeout(30000);
    // TEST SPRINT-1 16
    test('POST /api/v2/event/disiscrizione con parametri corretti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                username_email: "event_test_up",
                password: "event_test_up"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/event/disiscrizione')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            event_id: event_id
                        })
                        .expect({
                            status: 200,
                            message: "Disiscrizione effettuata."
                        });
                }
            );
    });

    // TEST SPRINT-1 16.1
    test('POST /api/v2/event/disiscrizione senza token', () => {
        return request(app)
            .post('/api/v2/event/disiscrizione')
            .set('Accept', 'application/json')
            .send({
                event_id: event_id
            })
            .expect({
                status: 401,
                message: "No token, unauthorized."
            });
    });

    // TEST SPRINT-1 16.2
    test('POST /api/v2/event/iscrizione con token errato', () => {
        let token = "wrongToken";
        return request(app)
            .post('/api/v2/event/disiscrizione')
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .send({
                event_id: event_id
            })
            .expect({
                status: 403,
                message: "Wrong token, forbidden."
            });
    });

    // TEST SPRINT-1 15.3
    test('POST /api/v2/event/disiscrizione con parametri corretti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                username_email: "test_up_due",
                password: "test_up_due"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/event/disiscrizione')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            event_id: event_id
                        })
                        .expect({
                            status: 409,
                            message: "L'utente non è ancora iscritto a questo evento."
                        });
                }
            );
    });

    // TEST SPRINT-1 16.4
    test('POST /api/v2/event/disiscrizione con id evento errato', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                username_email: "event_test_up",
                password: "event_test_up"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/event/disiscrizione')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            event_id: "6288ec25fe5bb453c76a62fa"
                        })
                        .expect({
                            status: 409,
                            message: "Nessun evento trovato."
                        });
                }
            );
    });

    // TEST SPRINT-1 15.5
    test('POST /api/v2/event/disiscrizione con parametri mancanti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                username_email: "event_test_up",
                password: "event_test_up"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/event/disiscrizione')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                        })
                        .expect({
                            status: 422,
                            message: "Parametri mancanti."
                        });
                }
            );
    });
});

// TEST MODIFICA EVENTO
describe('PATCH /api/v2/event/modifica', () => {
    jest.setTimeout(30000);
    // TEST SPRINT-2 11
    test('PATCH /api/v2/event/modifica con parametri corretti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                username_email: "test_o",
                password: "test_o"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .patch('/api/v2/event/modifica')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            id: event_id,
                            name: "Party_test_modifica",
                            address: "Via Giuseppe Verdi, 77, 38122 Trento TN",
                            // poster: "",
                            start_datetime: "2022/07/09 21:30",
                            end_datetime: "2022/07/10 5:00",
                            age_range: "20-30",
                            maximum_partecipants: "1"
                        })
                        .expect({
                            status: 200,
                            message: "Evento aggiornato correttamente."
                        });
                }
            );
    });

    // TEST SPRINT-2 11.1
    test('PATCH /api/v2/event/modifica senza token', () => {
        return request(app)
            .patch('/api/v2/event/modifica')
            .set('Accept', 'application/json')
            .send({
                id: event_id,
                name: "Party_test_modifica",
                address: "Via Giuseppe Verdi, 77, 38122 Trento TN",
                // poster: "",
                start_datetime: "2022/07/09 21:30",
                end_datetime: "2022/07/10 5:00",
                age_range: "20-30",
                maximum_partecipants: "1000"
            })
            .expect({
                status: 401,
                message: "No token, unauthorized."
            });
    });

    // TEST SPRINT-2 11.2
    test('PATCH /api/v2/event/modifica con token errato', () => {
        let token = "wrongToken";
        return request(app)
            .patch('/api/v2/event/modifica')
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .send({
                id: event_id,
                name: "Party_test_modifica",
                address: "Via Giuseppe Verdi, 77, 38122 Trento TN",
                // poster: "",
                start_datetime: "2022/07/09 21:30",
                end_datetime: "2022/07/10 5:00",
                age_range: "20-30",
                maximum_partecipants: "1000"
            })
            .expect({
                status: 403,
                message: "Wrong token, forbidden."
            });
    });

    // TEST SPRINT-2 11.3
    test('PATCH /api/v2/event/modifica con parametri corretti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                username_email: "test_o",
                password: "test_o"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .patch('/api/v2/event/modifica')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            id: passato_event_id,
                            name: "Party_test_passato_modifica",
                            address: "Via Giuseppe Verdi, 77, 38122 Trento TN",
                            // poster: "",
                            start_datetime: "2022/06/09 21:30",
                            end_datetime: "2022/06/10 5:00",
                            age_range: "20-30",
                            maximum_partecipants: "1"
                        })
                        .expect({
                            status: 403,
                            message: "Non è possibile modificare un evento passato."
                        });
                }
            );
    });

    // TEST SPRINT-2 11.4
    test('PATCH /api/v2/event/modifca con parametri corretti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                username_email: "test_o",
                password: "test_o"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .patch('/api/v2/event/modifica')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            id: event_id,
                            name: "Party_test_modifica",
                            address: "Via Giuseppe Verdi, 77, 38122 Trento TN",
                            // poster: "",
                            start_datetime: "2022/07/10 21:30",
                            end_datetime: "2022/07/09 5:00",
                            age_range: "20-30",
                            maximum_partecipants: "1000"
                        })
                        .expect({
                            status: 409,
                            message: "La data di fine evento deve succedere quella di inizio evento."
                        });
                }
            );
    });

    // TEST SPRINT-2 11.5
    test('PATCH /api/v2/event/modifca con parametri corretti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                username_email: "test_o_due",
                password: "test_o_due"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .patch('/api/v2/event/modifica')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            id: event_id,
                            name: "Party_test_modifica",
                            address: "Via Giuseppe Verdi, 77, 38122 Trento TN",
                            // poster: "",
                            start_datetime: "2022/07/10 21:30",
                            end_datetime: "2022/07/09 5:00",
                            age_range: "20-30",
                            maximum_partecipants: "1000"
                        })
                        .expect({
                            status: 409,
                            message: "Nessun evento trovato."
                        });
                }
            );
    });

    // TEST SPRINT-2 11.6
    test('PATCH /api/v2/event/modifica con parametri mancanti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                username_email: "test_o",
                password: "test_o"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .patch('/api/v2/event/modifica')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            address: "Via Giuseppe Verdi, 77, 38122 Trento TN",
                            // poster: "",
                            start_datetime: "2022/07/09 21:30",
                            end_datetime: "2022/07/10 5:00",
                            age_range: "20-30",
                            maximum_partecipants: "1000"
                        })
                        .expect({
                            status: 422,
                            message: "Parametri mancanti."
                        });
                }
            );
    });
});

// TEST ELIMINA EVENTO
describe('DELETE /api/v2/event/elimina', () => {
    jest.setTimeout(30000);
    // TEST SPRINT-2 12
    test('DELETE /api/v2/event/elimina con parametri corretti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                username_email: "test_o",
                password: "test_o"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .delete('/api/v2/event/elimina')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            event_id: event_id
                        })
                        .expect({
                            status: 200,
                            message: "Evento eliminato correttamente."
                        });
                }
            );
    });

    // TEST SPRINT-2 12.1
    test('DELETE /api/v2/event/elimina senza token', () => {
        return request(app)
            .delete('/api/v2/event/elimina')
            .set('Accept', 'application/json')
            .send({
                event_id: event_id
            })
            .expect({
                status: 401,
                message: "No token, unauthorized."
            });
    });

    // TEST SPRINT-2 12.2
    test('DELETE /api/v2/event/elimina con token errato', () => {
        let token = "wrongToken";
        return request(app)
            .delete('/api/v2/event/elimina')
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .send({
                event_id: event_id
            })
            .expect({
                status: 403,
                message: "Wrong token, forbidden."
            });
    });

    // TEST SPRINT-2 12.3
    test('DELETE /api/v2/event/elimina con parametri corretti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                username_email: "test_o",
                password: "test_o"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .delete('/api/v2/event/elimina')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            event_id: passato_event_id
                        })
                        .expect({
                            status: 403,
                            message: "Non è possibile eliminare un evento passato."
                        });
                }
            );
    });

    // TEST SPRINT-2 12.4
    test('POST /api/v2/event/modifca con parametri corretti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                username_email: "test_o_due",
                password: "test_o_due"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .delete('/api/v2/event/elimina')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            event_id: event_id,
                        })
                        .expect({
                            status: 409,
                            message: "Nessun evento trovato."
                        });
                }
            );
    });

    // TEST SPRINT-2 12.5
    test('POST /api/v2/event/modifica con parametri mancanti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                username_email: "test_o",
                password: "test_o"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .delete('/api/v2/event/elimina')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                        })
                        .expect({
                            status: 422,
                            message: "Parametri mancanti."
                        });
                }
            );
    });
});

// TEST FEEDBACK EVENTO
describe('PATCH /api/v2/event/feedback', () => {
    jest.setTimeout(30000);
    // TEST SPRINT-2 13
    test('PATCH /api/v2/event/feedback con parametri corretti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                username_email: "event_test_up",
                password: "event_test_up"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .get('/api/v2/biglietto/get_biglietti_futuri_by_user')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                        })
                        .expect(200)
                        .then((res) => {
                            let result = res.body.message.filter(result => result.evento_id === event2_id)[0];
                            let biglietto_id = result.biglietto_id;
                            console.log("\x1b[41m\x1b[36m#######################\x1b[0m", res.body.message, result, biglietto_id, event2_id);

                            return request(app)
                                .post('/api/v2/biglietto/activate')
                                .set('Accept', 'application/json')
                                .set('Authorization', `Bearer ${token}`)
                                .send({
                                    biglietto_id: biglietto_id,
                                    event_id: event2_id
                                })
                                .expect(200)
                                .then((res) => {
                                    return request(app)
                                        .post('/api/v2/biglietto/deactivate')
                                        .set('Accept', 'application/json')
                                        .set('Authorization', `Bearer ${token}`)
                                        .send({
                                            biglietto_id: biglietto_id,
                                            event_id: event2_id
                                        })
                                        .expect(200)
                                        .then((res) => {
                                            return request(app)
                                                .patch('/api/v2/event/feedback')
                                                .set('Accept', 'application/json')
                                                .set('Authorization', `Bearer ${token}`)
                                                .send({
                                                    event_id: event2_id,
                                                    feedback: 3
                                                })
                                                .expect({
                                                    status: 200,
                                                    message: "Feedback salvato correttamente."
                                                });
                                        });
                                });
                        });
                }
            );
    });

    // TEST SPRINT-3 13.1
    test('PATCH /api/v2/event/feedback senza token', () => {
        return request(app)
            .patch('/api/v2/event/feedback')
            .set('Accept', 'application/json')
            .send({
                event_id: event2_id,
                feedback: 3
            })
            .expect({
                status: 401,
                message: "No token, unauthorized."
            });
    });

    // TEST SPRINT-2 13.2
    test('PATCH /api/v2/event/feedback con token errato', () => {
        let token = "wrongToken";
        return request(app)
            .patch('/api/v2/event/feedback')
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${token}`)
            .send({
                event_id: event2_id,
                feedback: 3
            })
            .expect({
                status: 403,
                message: "Wrong token, forbidden."
            });
    });

    // TEST SPRINT-2 13.3
    test('PATCH /api/v2/event/feedback con parametri corretti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                username_email: "test_up_due",
                password: "test_up_due"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .get('/api/v2/biglietto/get_biglietti_futuri_by_user')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                        })
                        .expect(200)
                        .then((res) => {
                            let result = res.body.message.filter(result => result.evento_id === event2_id)[0];
                            let biglietto_id = result.biglietto_id;
                            console.log("\x1b[41m\x1b[36m#######################\x1b[0m", res.body.message, result, biglietto_id, event2_id);

                            return request(app)
                                .post('/api/v2/biglietto/activate')
                                .set('Accept', 'application/json')
                                .set('Authorization', `Bearer ${token}`)
                                .send({
                                    biglietto_id: biglietto_id,
                                    event_id: event2_id
                                })
                                .expect(200)
                                .then((res) => {
                                    return request(app)
                                        .patch('/api/v2/event/feedback')
                                        .set('Accept', 'application/json')
                                        .set('Authorization', `Bearer ${token}`)
                                        .send({
                                            event_id: event2_id,
                                            feedback: 3
                                        })
                                        .expect({
                                            status: 403,
                                            message: "Il biglietto deve essere disattivato per lasciare un feedback."
                                        });
                                });
                        });
                }
            );
    });

    // TEST SPRINT-2 13.4
    test('PATCH /api/v2/event/feedback con parametri corretti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                username_email: "test_up_due",
                password: "test_up_due"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .patch('/api/v2/event/feedback')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            event_id: event2_id,
                            feedback: 10
                        })
                        .expect({
                            status: 409,
                            message: "Il valore del feedback deve essere compreso tra 0 e 5."
                        });
                }
            );
    });

    // TEST SPRINT-2 13.5
    test('PATCH /api/v2/event/feedback con parametri corretti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                username_email: "event_test_up",
                password: "event_test_up"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .patch('/api/v2/event/feedback')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            event_id: event_id,
                            feedback: 3
                        })
                        .expect({
                            status: 409,
                            message: "Nessun evento trovato."
                        });
                }
            );
    });

    // TEST SPRINT-2 13.6
    test('PATCH /api/v2/event/feedback con parametri mancanti', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                username_email: "event_test_up",
                password: "event_test_up"
            })
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .patch('/api/v2/event/feedback')
                        .set('Accept', 'application/json')
                        .set('Authorization', `Bearer ${token}`)
                        .send({
                            feedback: 3
                        })
                        .expect({
                            status: 422,
                            message: "Parametri mancanti."
                        });
                }
            );
    });
});