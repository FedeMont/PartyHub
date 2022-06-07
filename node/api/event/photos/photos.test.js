const request = require('supertest');
const { mongoose, generate_url_with_attr } = require("../../../utils");
const { app, server } = require("../../../app");

const testImage = `images.jpg`

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

// TEST EVENT/PHOTOS ADD
describe('GET /api/v2/event/photos/add', () => {
    jest.setTimeout(30000);
    // TEST SPRINT-2 18
    test('POST /api/v2/event/photos/add con parametri corretti', () => {
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
                        .post('/api/v2/event/photos/add')
                        .set('Authorization', `Bearer ${token}`)
                        .field("photos", testImage)
                        .field("event_id", "629dfdc4002f39011b92bc0f")
                        .expect({
                            status: 200,
                            message: "Foto caricate correttamente."
                        })
                }
            );
    });
    // TEST SPRINT-2 18.1
    test('POST /api/v2/event/photos/add con token mancante', () => {
        return request(app)
            .post('/api/v2/event/photos/add')
            .field("photos", testImage)
            .field("event_id", "629dfdc4002f39011b92bc0f")
            .expect({
                status: 401,
                message: "No token, unauthorized."
            })
    });
    // TEST SPRINT-2 18.2
    test('POST /api/v2/event/photos/add con token errato', () => {
        let token = "wrongToken";
        return request(app)
            .post('/api/v2/event/photos/add')
            .set('Authorization', `Bearer ${token}`)
            .field("photos", testImage)
            .field("event_id", "629dfdc4002f39011b92bc0f")
            .expect({
                status: 403,
                message: "Wrong token, forbidden."
            })
    });
    // TEST SPRINT-2 18.3
    test('POST /api/v2/event/photos/add con parametri corretti ma utente non iscritto', () => {
        return request(app)
            .post('/api/v2/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "test_up_due",
                "password": "test_up_due"
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/v2/event/photos/add')
                        .set('Authorization', `Bearer ${token}`)
                        .field("photos", testImage)
                        .field("event_id", "629dfdc4002f39011b92bc0f")
                        .expect({
                            status: 409,
                            message: "Non ti è possibile caricare foto se non sei iscritto all'evento o non sei ancora uscito dal party."
                        })
                }
            );
    });
    // TEST SPRINT-2 18.4
    test('POST /api/v2/event/photos/add con token corretto ma parametri mancanti', () => {
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
                        .post('/api/v2/event/photos/add')
                        .set('Authorization', `Bearer ${token}`)
                        .field("photos", testImage)
                        .expect({
                            status: 422,
                            message: "Parametri mancanti."
                        })
                }
            );
    });
})

// TEST EVENT/PHOTOS ADD
describe('GET /api/v2/event/photos/get_photos', () => {
    jest.setTimeout(30000);
    // TEST SPRINT-2 19
    test('GET /api/v2/event/photos/get_photos con con parametri corretti', () => {
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
                        "event_id": "629dfdc4002f39011b92bc0f"
                    }
                    return request(app)
                        .get(generate_url_with_attr('/api/v2/event/photos/get_photos', attribute))
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
    // TEST SPRINT-2 19.1
    test('GET /api/v2/event/photos/get_photos con token mancante', () => {
        let attribute = {
            "event_id": "629dfdc4002f39011b92bc0f"
        }
        return request(app)
            .get(generate_url_with_attr('/api/v2/event/photos/get_photos', attribute))
            .expect({
                status: 401,
                message: "No token, unauthorized."
            })
    });
    // TEST SPRINT-2 19.2
    test('GET /api/v2/event/photos/get_photos con token errato', () => {
        let token = "wrongToken";
        let attribute = {
            "event_id": "629dfdc4002f39011b92bc0f"
        }
        return request(app)
            .get(generate_url_with_attr('/api/v2/event/photos/get_photos', attribute))
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 403,
                message: "Wrong token, forbidden."
            })
    });

    // TEST SPRINT-2 19.3
    test('GET /api/v2/event/photos/get_photos con token corretto e parametri mancanti', () => {
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
                        .get('/api/v2/event/photos/get_photos')
                        .set('Authorization', `Bearer ${token}`)
                        .expect({
                            status: 422,
                            message: "Parametri mancanti."
                        })
                });
    });
})