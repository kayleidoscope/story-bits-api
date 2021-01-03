const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const { StripTagBody } = require('xss');
const app = require('../src/app')
const {makeStoriesArray} = require('./stories-fixtures')
const {makeUsersArray} = require('./users-fixtures')
const {makeCharactersArray} = require('./characters-fixtures')
const {makeSettingsArray} = require('./settings-fixtures')
const {makeResidencesArray} = require('./residences-fixtures')

describe.only('ResidencesEndpoints', function() {
    let db;

    const testUsers = makeUsersArray()
    const testStories = makeStoriesArray()
    const testCharacters = makeCharactersArray()
    const testSettings = makeSettingsArray()
    const testResidences = makeResidencesArray()

    before(() => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL
        })
        app.set('db', db)
    })

    before(() => db.raw('TRUNCATE residences, characters, stories, users RESTART IDENTITY CASCADE'))

    afterEach(() => db.raw('TRUNCATE residences, characters, stories, users RESTART IDENTITY CASCADE'))

    after(() => db.destroy())

    describe('GET /api/residences', () => {
        context('Given there are residences in the db', () => {
            beforeEach(() => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('stories')
                            .insert(testStories)
                    })
                    .then(() => {
                        return db
                            .into('characters')
                            .insert(testCharacters)
                    })
                    .then(() => {
                        return db
                            .into('settings')
                            .insert(testSettings)
                    })
                    .then(() => {
                        return db
                            .into('residences')
                            .insert(testResidences)
                    })
            })

            it('GET /api/residences responds with 200 and all of the stories', () => {
                
                return supertest(app)
                    .get('/api/residences')
                    .expect(200, testResidences)
            })

            it('GET /api/residences?setting_id=[SETTING_ID] responds with 200 and the occupants of a setting', () => {
                const setting_id = 2
                const expectedResidents = testResidences.filter(res => res.setting_id === setting_id)

                return supertest(app)
                    .get(`/api/residences?setting_id=${setting_id}`)
                    .expect(200, expectedResidents)
            })

            it('GET /api/residences?character_id=[CHARACTER_ID] responds with 200 and the occupants of a setting', () => {
                const character_id = 2
                const expectedResidence = testResidences.filter(res => res.character_id === character_id)

                return supertest(app)
                    .get(`/api/residences?character_id=${character_id}`)
                    .expect(200, expectedResidence)
            })
        })
        
        context('Given there are users, stories, chars, and settings but no residences', () => {
            beforeEach(() => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('stories')
                            .insert(testStories)
                    })
                    .then(() => {
                        return db
                            .into('characters')
                            .insert(testCharacters)
                    })
                    .then(() => {
                        return db
                            .into('settings')
                            .insert(testSettings)
                    })
            })

            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/api/residences')
                    .expect(200, [])
            })
        })
    })

    describe('GET /api/residences/:id', () => {
        beforeEach(() => {
            return db
                .into('users')
                .insert(testUsers)
                .then(() => {
                    return db
                        .into('stories')
                        .insert(testStories)
                })
                .then(() => {
                    return db
                        .into('characters')
                        .insert(testCharacters)
                })
                .then(() => {
                    return db
                        .into('settings')
                        .insert(testSettings)
                })
                .then(() => {
                    return db
                        .into('residences')
                        .insert(testResidences)
                })
        })

        context('Given there are residences in the db', () => {
            it('GET /api/residences/:id responds with 200 and that residence', () => {
                const id = 2
                const expectedRes = testResidences[id - 1]

                return supertest(app)
                    .get(`/api/residences/${id}`)
                    .expect(200, expectedRes)
            })
        })
    })

    describe('POST /api/residences', () => {
        beforeEach(() => {
            return db
                .into('users')
                .insert(testUsers)
                .then(() => {
                    return db
                        .into('stories')
                        .insert(testStories)
                })
                .then(() => {
                    return db
                        .into('characters')
                        .insert(testCharacters)
                })
                .then(() => {
                    return db
                        .into('settings')
                        .insert(testSettings)
                })
        })

        it('creates a new residence-character relationship, responding 201 and the entry', () => {
            const newRelationship = {
                character_id: 5,
                setting_id: 1
            }

            return supertest(app)
                .post('/api/residences')
                .send(newRelationship)
                .expect(201)
                .expect(res => {
                    expect(res.body.character_id).to.eql(newRelationship.character_id)
                    expect(res.body.setting_id).to.eql(newRelationship.setting_id)
                })
        })

        it('responds with 400 and an error message when character_id is missing', () => {
            const newRelationship = {
                setting_id: 1
            }

            return supertest(app)
                .post('/api/residences')
                .send(newRelationship)
                .expect(400, {
                    error: {message: 'Missing character_id in request'}
                })
        })

        it('responds with 400 and an error message when setting_id is missing', () => {
            const newRelationship = {
                character_id: 5
            }

            return supertest(app)
                .post('/api/residences')
                .send(newRelationship)
                .expect(400, {
                    error: {message: 'Missing setting_id in request'}
                })
        })
    })

    describe('DELETE /api/residences/:id removes a character-setting relationship', () => {
        context('Given no residence relationships in the db', () => {
            it('responds with 404 and the correct error message', () => {
                const resId = 13242

                return supertest(app)
                    .delete(`/api/residences/${resId}`)
                    .expect(404, {error: {message: `Character-setting relationship doesn't exist`}})
            })
        })

        context('Given there are residences', () => {
            beforeEach(() => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('stories')
                            .insert(testStories)
                    })
                    .then(() => {
                        return db
                            .into('characters')
                            .insert(testCharacters)
                    })
                    .then(() => {
                        return db
                            .into('settings')
                            .insert(testSettings)
                    })
                    .then(() => {
                        return db
                            .into('residences')
                            .insert(testResidences)
                    })
            })

            it('responds with 204 and removes the residence', () => {
                const idToRemove = 2
                const expectedRes = testResidences.filter(res => res.id !== idToRemove)

                return supertest(app)
                    .delete(`/api/residences/${idToRemove}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get('/api/residences')
                            .expect(expectedRes)
                    )
            })
        })
    })

    describe('PATCH /api/residences/:id', () => {
        context('Given no residences', () => {
            it('responds with 404', () => {
                const id = 134231

                return supertest(app)
                    .patch(`/api/residences/${id}`)
                    .expect(404, {error: {message: `Character-setting relationship doesn't exist`}})
            })
        })

        context('Given there are residences in the db', () => {
            beforeEach(() => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('stories')
                            .insert(testStories)
                    })
                    .then(() => {
                        return db
                            .into('characters')
                            .insert(testCharacters)
                    })
                    .then(() => {
                        return db
                            .into('settings')
                            .insert(testSettings)
                    })
                    .then(() => {
                        return db
                            .into('residences')
                            .insert(testResidences)
                    })
            })

            it('responds 204 and updates the residence', () => {
                const idToUpdate = 2
                const updatedId = {
                    character_id: 1,
                    setting_id: 1
                }

                const expectedResidence = {
                    id: idToUpdate,
                    character_id: updatedId.character_id,
                    setting_id: updatedId.setting_id
                }

                return supertest(app)
                    .patch(`/api/residences/${idToUpdate}`)
                    .send(updatedId)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/residences/${idToUpdate}`)
                            .expect(expectedResidence)
                    )
            })

            it('responds 204 when updating only a subset of fields', () => {
                const idToUpdate = 2
                const updatedId = {
                    setting_id: 1
                }

                const expectedResidence = {
                    ...testResidences[idToUpdate - 1],
                    ...updatedId
                }

                return supertest(app)
                    .patch(`/api/residences/${idToUpdate}`)
                    .send(updatedId)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/residences/${idToUpdate}`)
                            .expect(expectedResidence)
                    )
            })
        })
    })
})