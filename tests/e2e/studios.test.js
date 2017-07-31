const chai = require('chai');
const assert = chai.assert;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

process.env.MONGODB_URI = 'mongodb://localhost:27017/ripe-banana-test';

require('../../lib/connect');

const connection = require('mongoose').connection;

const app = require('../../lib/app');
const request = chai.request(app);

describe('studio REST api', () => {

    before(() => connection.dropDatabase());



    it('initial /GET returns empty list', () => {
        return request.get('/studios')
            .then(req => {
                const studios = req.body;
                assert.deepEqual(studios, []);
            });
    });

    let universal = {
        name: 'Universal Pictures',
        address: {
            city: 'Hollywood',
            state: 'California',
            zip: '91608'
        }
    };

    let warner = {
        name: 'Warner Bros. Pictures',
        address: {
            city: 'Hollywood',
            state: 'California',
            zip: '91522'
        }
    };

    let fox = {
        name: '20th Century Fox',
        address: {
            city: 'Los Angeles',
            state: 'California',
            zip: '90067'
        }
    };

    function saveStudio(studio) {

        return request.post('/studios')
            .send(studio)
            .then(res => res.body);
    }

    it('roundtrips a new studio', () => {
        return saveStudio(universal)
            .then(saved => {
                assert.ok(saved._id, 'saved has id');
                universal = saved;
            })
            .then(() => {
                return request.get(`/studios/${universal._id}`);
            })
            .then(res => res.body)
            .then(got => {
                assert.deepEqual(got, universal);
            });
    });

    it('GET returns 404 for non-existent id', () => {
        const nonId = '597e9d4a119656c01e87d37e';
        return request.get(`/${nonId}`)
            .then(
                () => { throw new Error('expected 404'); },
                res => {
                    assert.equal(res.status, 404);
                }
            );
    });

    it('returns list of all studios', () => {
        return Promise.all([
            saveStudio(warner),
            saveStudio(fox)
        ])
            .then(savedStudios => {
                warner = savedStudios[0];
                fox = savedStudios[1];
            })
            .then(() => request.get('/studios'))
            .then(res => res.body)
            .then(studios => {
                assert.equal(studios.length, 3);
                assert.deepInclude(studios, universal);
                assert.deepInclude(studios, warner);
                assert.deepInclude(studios, fox);
            });
    });

    it('updates studio', () => {
        universal.name = 'Universal Studios';
        return request.put(`/studios/${universal._id}`)
            .send(universal)
            .then(res => res.body)
            .then(updated => {
                assert.equal(updated.name, 'Universal Studios');
            });
    });

    it('deletes a studio', () => {
        return request.delete(`/studios/${fox._id}`)
            .then(res => res.body)
            .then(result => {
                assert.isTrue(result.removed);
            })
            .then(() => request.get('/studios'))
            .then(res => res.body)
            .then(studios => {
                assert.equal(studios.length, 2);
            });

    });

    it('delete a non-existent studio is removed false', () => {
        return request.delete(`/studios/${fox._id}`)
            .then(res => res.body)
            .then(result => {
                assert.isFalse(result.removed);
            });
    });

    it('errors on validation failure', () => {
        return saveStudio({})
            .then(
                () => { throw new Error('expected failure'); },
                () => { }
            );
    });

});
