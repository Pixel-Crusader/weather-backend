const app = require('../app');
const chai = require('chai');
const sinon = require('sinon');
const fetch = require('node-fetch');
const DbHelper = require('../routes/dbHelper');

chai.use(require('chai-http'));
chai.should();
const request = chai.request;
const sandbox = sinon.createSandbox();

const stubResponse = {
    ok: true,
    status: 200,
    json: async () => ({"coord":{"lon":37.62,"lat":55.75},"weather":[{"id":803,"main":"Clouds","description":"broken clouds","icon":"04n"}],"base":"stations","main":{"temp":-7.33,"feels_like":-14.61,"temp_min":-8,"temp_max":-7,"pressure":1020,"humidity":79},"visibility":10000,"wind":{"speed":6,"deg":190},"clouds":{"all":75},"dt":1608747929,"sys":{"type":1,"id":9029,"country":"RU","sunrise":1608703113,"sunset":1608728326},"timezone":10800,"id":524901,"name":"Moscow","cod":200})
};

const stubCitiesList = [
    {
        "city": "Moscow"
    },
    {
        "city": "Saint Petersburg"
    }
]

describe('Routes', () => {
    describe('/weather/', () => {
        describe('city', () => {
            let fetchStub;
            before(() => {
                fetchStub = sandbox.stub(fetch, 'Promise').resolves(stubResponse);
            });
            after(() => {
                sandbox.restore();
            });
            afterEach(() => {
                sandbox.resetHistory();
            })
            it('should return weather in city', (done) => {
                request(app)
                    .get("/weather/city?q=Moscow")
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.have.property('name').equal('Moscow');
                        fetchStub.callCount.should.equal(1);
                        done();
                    });
            });
            it('should return code 400 without specified city', (done) => {
                request(app)
                    .get("/weather/city")
                    .end((err, res) => {
                        res.should.have.status(400);
                        fetchStub.callCount.should.equal(0);
                        done();
                    });
            });
        });
        describe('coordinates', () => {
            let fetchStub;
            before(() => {
                fetchStub = sandbox.stub(fetch, 'Promise').resolves(stubResponse);
            });
            after(() => {
                sandbox.restore();
            });
            afterEach(() => {
                fetchStub.resetHistory();
            })
            it('should return weather in city', (done) => {
                request(app)
                    .get("/weather/coordinates?lat=0.5&long=0.5")
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.have.property('name').equal('Moscow');
                        fetchStub.callCount.should.equal(1);
                        done();
                    });
            });
            it('should return code 400 without specified lat', (done) => {
                request(app)
                    .get("/weather/coordinates?long=0.5")
                    .end((err, res) => {
                        res.should.have.status(400);
                        fetchStub.callCount.should.equal(0);
                        done();
                    });
            });
            it('should return code 400 without specified long', (done) => {
                request(app)
                    .get("/weather/coordinates?lat=0.5")
                    .end((err, res) => {
                        res.should.have.status(400);
                        fetchStub.callCount.should.equal(0);
                        done();
                    });
            });
            it('should return code 400 without specified lat & long', (done) => {
                request(app)
                    .get("/weather/coordinates")
                    .end((err, res) => {
                        res.should.have.status(400);
                        fetchStub.callCount.should.equal(0);
                        done();
                    });
            });
        });
    });
    describe('/favorites/', () => {
        let fetchStub;
        let getStub;
        let deleteStub;
        let insertStub;
        let validateStub;
        let getIdStub;
        beforeEach(() => {
            fetchStub = sandbox.stub(fetch, 'Promise').resolves(stubResponse);
            getStub = sandbox.stub(DbHelper.prototype, 'getAll').resolves(stubCitiesList);
            insertStub = sandbox.stub(DbHelper.prototype, 'insert').resolves(true);
            deleteStub = sandbox.stub(DbHelper.prototype, 'delete').resolves(1);
            getIdStub = sandbox.stub(DbHelper.prototype, 'getId').resolves(2);
            validateStub = sandbox.stub(DbHelper.prototype, 'validateId');
            validateStub.withArgs('1').resolves(true);
            validateStub.resolves(false);
        });
        afterEach(() => {
            sandbox.restore();
        });
        describe('GET', () => {
            it('should return list of cities', done => {
                request(app)
                    .get("/favorites/")
                    .set("Cookie", 'userId=1')
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.have.cookie('userId', '1');
                        res.body.length.should.not.equal(0);
                        getStub.callCount.should.equal(1);
                        done();
                    });
            });
            it('should return empty list with no userId specified', done => {
                request(app)
                    .get("/favorites/")
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.not.have.cookie('userId');
                        res.body.length.should.equal(0);
                        getStub.callCount.should.equal(0);
                        done();
                    });
            });
        });
        describe('POST', () => {
            it('should add city and create new user', done => {
                request(app)
                    .post("/favorites/")
                    .send({
                        name: "Moscow"
                    })
                    .end((err, res) => {
                        res.should.have.status(201);
                        res.should.have.cookie('userId', '2');
                        res.should.be.json;
                        insertStub.callCount.should.equal(1);
                        fetchStub.callCount.should.equal(1);
                        done();
                    });
            });
            it('should validate user and add city', done => {
                request(app)
                    .post("/favorites/")
                    .set("Cookie", "userId=1")
                    .send({
                        name: "Moscow"
                    })
                    .end((err, res) => {
                        res.should.have.status(201);
                        res.should.have.cookie('userId', '1');
                        res.should.be.json;
                        insertStub.callCount.should.equal(1);
                        fetchStub.callCount.should.equal(1);
                        done();
                    });
            });
            it('should return code 409 if city is present', done => {
                insertStub.restore();
                let newInsertStub = sandbox.stub(DbHelper.prototype, 'insert').resolves(false);
                request(app)
                    .post("/favorites/")
                    .set("Cookie", "userId=1")
                    .send({
                        name: "Saint Petersburg"
                    })
                    .end((err, res) => {
                        res.should.have.status(409);
                        res.should.have.cookie('userId', '1');
                        newInsertStub.callCount.should.equal(1);
                        fetchStub.callCount.should.equal(1);
                        done();
                    });
            });
            it('should return code 400 if city not specified', done => {
                request(app)
                    .post("/favorites/")
                    .set("Cookie", "userId=1")
                    .send({
                    })
                    .end((err, res) => {
                        res.should.have.status(400);
                        res.should.be.json;
                        insertStub.callCount.should.equal(0);
                        fetchStub.callCount.should.equal(0);
                        done();
                    });
            });
            it('should return code 400 if there is no body', done => {
                request(app)
                    .post("/favorites/")
                    .set("Cookie", "userId=1")
                    .end((err, res) => {
                        res.should.have.status(400);
                        res.should.be.json;
                        insertStub.callCount.should.equal(0);
                        fetchStub.callCount.should.equal(0);
                        done();
                    });
            });
        });
        describe('DELETE', () => {
            it('should delete city from favorites', done => {
                request(app)
                    .delete("/favorites?name=Moscow")
                    .set("Cookie", "userId=1")
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.have.cookie('userId', '1');
                        deleteStub.callCount.should.equal(1);
                        fetchStub.callCount.should.equal(1);
                        done();
                    });
            });
            it('should return code 400 if city not specified', done => {
                request(app)
                    .delete("/favorites")
                    .set("Cookie", "userId=1")
                    .end((err, res) => {
                        res.should.have.status(400);
                        deleteStub.callCount.should.equal(0);
                        fetchStub.callCount.should.equal(0);
                        done();
                    });
            });
            it('should return code 401 if no userId is present', done => {
                request(app)
                    .delete("/favorites?name=Moscow")
                    .end((err, res) => {
                        res.should.have.status(401);
                        res.should.not.have.cookie('userId');
                        deleteStub.callCount.should.equal(0);
                        fetchStub.callCount.should.equal(0);
                        done();
                    });
            });
        });
    });
});