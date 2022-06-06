const request = require('supertest');
const app = require('../../app');
const { mongoose, documents, standardRes, bcrypt, saltRounds } = require("../../utils");
const { authenticateToken, generateAccessToken } = require("../../token");

function generate_url_with_attr(url, _attribute) {
    let final_url = url + "?";
    for (const [key, value] of Object.entries(_attribute)) {
        final_url = final_url.concat(`${key}=${value}&`);
    }
    // return full url without last & simble
    return final_url.slice(0, -1);
}

describe('GET /api/auth/check_avaiability', () => {
    test('GET /api/auth/check_avaiability con username e email disponibili', () => {
        let attribute = {
            "username": "username1",
            "email": "email1"
        };
        return request(app)
            .get(generate_url_with_attr('/api/auth/check_availability', attribute))
            .expect({
                status: 200, message: 'Username e email disponibili.'
            })
    })
})

describe('GET /api/auth/logout', () => {

    test('POST /api/auth/logout con token valido', () => {

        return request(app)
            .post('/api/auth/login')
            .set('Accept', 'application/json')
            .send({
                "username_email": "up",
                "password": "up"
            })
            .expect('Content-Type', /json/)
            .then(
                (res) => {
                    let token = res.body.token;
                    return request(app)
                        .post('/api/auth/logout')
                        .set('Authorization', `Bearer ${token}`)
                        .expect({
                            status: 200, message: 'Logout effettuato con successo.'
                        })
                }
            )
    })

    test('POST /api/auth/logout senza token', () => {
        return request(app)
            .post('/api/auth/logout')
            .set('Accept', 'application/json')
            .expect({
                status: 401, message: 'No token, unauthorized.'
            });
    });

    test('POST /api/auth/logout con token errato', () => {
        let token = "wrongToken";
        return request(app)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${token}`)
            .expect({
                status: 403, message: 'Wrong token, forbidden.'
            })
    })
})


