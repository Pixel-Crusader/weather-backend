const Datastore = require('nedb');

class DbHelper {
    favDb;
    usersDb;

    constructor() {
        this.favDb = new Datastore({ filename: './favorites.db', autoload: true });
        this.favDb.ensureIndex({ fieldName: 'compound', unique: true }, err => {});
        this.usersDb = new Datastore( { filename: './users.db', autoload: true });
    }

    getAll(user) {
        return new Promise((resolve, reject) => {
            this.favDb.find({ user: user }, { city: 1, _id: 0 }, (err, docs) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                else {
                    resolve(docs);
                }
            });
        });
    }

    insert(user, cityName, cityId) {
        return new Promise((resolve, reject) => {
            this.favDb.insert({ user: user, city: cityName, compound: user+cityId }, (err, doc) => {
                if (err) {
                    if (err.errorType === 'uniqueViolated') {
                        resolve(false);
                    }
                    else {
                        reject(err);
                    }
                }
                else {
                    resolve(true);
                }
            });
        });
    }

    delete(userId, cityId) {
        return new Promise((resolve, reject) => {
            this.favDb.remove({ compound: userId+cityId }, (err, num) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                else {
                    resolve(num);
                }
            });
        });
    }

    validateId(id) {
        return new Promise((resolve, reject) => {
            this.usersDb.find({ _id: id }, (err, docs) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                else {
                    resolve(docs.length !== 0);
                }
            })
        })
    }

    getId() {
        return new Promise((resolve, reject) => {
            this.usersDb.insert({}, (err, doc) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                else {
                    resolve(doc._id);
                }
            })
        });
    }

}

module.exports = DbHelper