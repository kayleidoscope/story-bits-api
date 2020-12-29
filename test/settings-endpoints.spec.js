const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const { StripTagBody } = require('xss');
const app = require('../src/app')
const {makeStoriesArray} = require('./stories-fixtures')
const {makeUsersArray} = require('./users-fixtures')
const {makeSettingsArray} = require('./settings-fixtures');
const e = require('express');

describe('Settings  endpoints', function() {
    let db;

    const testUsers = makeUsersArray()
    const testStories = makeStoriesArray()
    const testSettings = makeSettingsArray()

    before('make next instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
        app.set('db', db)
    })

    before(() => db.raw('TRUNCATE story_bits_settings, story_bits_stories, story_bits_users RESTART IDENTITY CASCADE'))

    afterEach(() => db.raw('TRUNCATE story_bits_settings, story_bits_stories, story_bits_users RESTART IDENTITY CASCADE'))

    after('disconnect from db', () => db.destroy())

    describe('GET /api/settings', () => {
        
        context('Given there are stories in the database', () => {
            beforeEach(() => {
            return db
                .into('story_bits_users')
                .insert(testUsers)
                .then(() => {
                    return db
                        .into('story_bits_stories')
                        .insert(testStories)
                })
                .then(() => {
                    return db
                        .into('story_bits_settings')
                        .insert(testSettings)
                })
            })

            it('GET /api/settings responds with 200 and all of the settings', () => {
                return supertest(app)
                    .get('/api/settings')
                    .expect(200, testSettings)
            })
        })

        context('Given there are no settings in the database', () => {
            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/api/settings')
                    .expect(200, [])
            })
        })
    })

    describe('GET /api/settings/:id', () => {
        beforeEach(() => {
            return db
                .into('story_bits_users')
                .insert(testUsers)
                .then(() => {
                    return db
                        .into('story_bits_stories')
                        .insert(testStories)
                })
                .then(() => {
                    return db
                        .into('story_bits_settings')
                        .insert(testSettings)
                })
        })

        context('Given there are settings in the database', () => {
            it('GET /api/settings/:id responds with 200 and that setting ', () => {
                const settingId = 2
                const expectedSetting = testSettings[settingId - 1]

                return supertest(app)
                    .get(`/api/settings/${settingId}`)
                    .expect(200, expectedSetting)
            })
        })

        context('Given an XSS attack Setting', () => {
            const evilSetting = {
                id: 911,
                story_id: 1,
                name: '<script>alert("xss");</script>',
                isresidence: false,
                decor: 'Pristine <script>alert("xss");</script>'
            }

            beforeEach('insert evil Setting', () => {
                return db
                    .into('story_bits_settings')
                    .insert([evilSetting])
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/settings/${evilSetting.id}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.name).to.eql('&lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                        expect(res.body.decor).to.eql('Pristine &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                    })
            })
        })
    })

    describe('POST /api/settings', () => {
        beforeEach(() => {
            return db
                .into('story_bits_users')
                .insert(testUsers)
                .then(() => {
                    return db
                        .into('story_bits_stories')
                        .insert(testStories)
                })
        })

        context('Given an XSS attack Setting', () => {
            const evilSetting = {
                id: 911,
                story_id: 1,
                name: '<script>alert("xss");</script>',
                isresidence: false,
                decor: 'Pristine <script>alert("xss");</script>'
            }

            it('removes XSS attack content', () => {
                return supertest(app)
                    .post(`/api/settings`)
                    .send(evilSetting)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.name).to.eql('&lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                        expect(res.body.decor).to.eql('Pristine &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                    })
            })
        })

        it('creates a new Setting, responding with 201 and the new Setting', function() {
            const newSetting = {
                story_id: 3,
                name: 'Placeholder Name',
                isresidence: true,
                decor: 'Placeholder decor'
            }

            return supertest(app)
                .post('/api/settings')
                .send(newSetting)
                .expect(201)
                .expect(res => {
                    expect(res.body.story_id).to.eql(newSetting.story_id)
                    expect(res.body.name).to.eql(newSetting.name)
                    expect(res.body.isresidence).to.eql(newSetting.isresidence)
                    expect(res.body.decor).to.eql(newSetting.decor)
                    expect(res.body).to.have.property('id')
                })
                .then(res =>
                    supertest(app)
                        .get(`/api/settings/${res.body.id}`)
                        .expect(res.body)
                )
        })

        it('responds with 400 and an error message when story_id is missing', () => {
            const newSetting = {
                name: 'Apartments33',
                isresidence: true,
                decor: 'Bright and shiny'
            }

            return supertest(app)
                .post('/api/settings')
                .send(newSetting)
                .expect(400, {
                    error: {message: `Missing story_id in request`}
                })
        })

        it('responds with 400 and an error message when name is missing', () => {
            const newSetting = {
                story_id: 3,
                isresidence: true,
                decor: 'Untidy'
            }

            return supertest(app)
                .post('/api/settings')
                .send(newSetting)
                .expect(400, {
                    error: {message: `Missing name in request`}
                })
        })

        it('responds with 201 and the new setting when only story_id and name are provided', () => {
            const newSetting = {
                story_id: 3,
                name: 'Placeholder Name'
            }

            return supertest(app)
                .post('/api/settings')
                .send(newSetting)
                .expect(201)
                .then(res =>
                    supertest(app)
                        .get(`/api/settings/${res.body.id}`)
                        .expect(res.body)
                )
        })
    })

    describe('DELETE /api/settings/:id', () => {
        context('Given no settings in the database', () => {
            it('responds with 404', () => {
                const settingId = 123
                return supertest(app)
                    .delete(`/api/settings/${settingId}`)
                    .expect(404, {error: {message: `Setting doesn't exist`}})
            })
        })

        context('Given there are stories', () => {
            beforeEach(() => {
                return db
                    .into('story_bits_users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('story_bits_stories')
                            .insert(testStories)
                    })
                    .then(() => {
                        return db
                            .into('story_bits_settings')
                            .insert(testSettings)
                    })
            })

            it('responds with 204 and removes the story', () => {
                const idToRemove = 2
                const expectedSettings  = testSettings.filter(setting => setting.id !== idToRemove)

                return supertest(app)
                    .delete(`/api/settings/${idToRemove}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get('/api/settings')
                            .expect(expectedSettings )
                    )
            })
        })
    })

    describe('PATCH /api/settings/:id', () => {
        context('Given no settings', () => {
            it('responds with 404', () => {
                const settingId = 12432
                return supertest(app)
                    .patch(`/api/settings/${settingId}`)
                    .expect(404, {error: {message: `Setting doesn't exist`}})
            })
        })

        context('Given there are settings in the database', () => {
            beforeEach(() => {
                return db
                    .into('story_bits_users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('story_bits_stories')
                            .insert(testStories)
                    })
                    .then(() => {
                        return db
                            .into('story_bits_settings')
                            .insert(testSettings)
                    })
            })

            it('responds with 204 and updates the story', () => {
                const idToUpdate = 2
                const updatedSetting = {
                    story_id: 3,
                    name: 'Zoey`s bedroom',
                    isresidence: true,
                    decor: 'Stylishly decorated and peaceful'
                }

                const expectedSetting = {
                    ...testSettings[idToUpdate - 1],
                    ...updatedSetting
                }

                return supertest(app)
                    .patch(`/api/settings/${idToUpdate}`)
                    .send(updatedSetting)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/settings/${idToUpdate}`)
                            .expect(expectedSetting)
                    )
            })

            it('responds with 204 when updating only a subset of fields', () => {
                const idToUpdate = 2
                const updatedSetting = {
                    name: 'Zoey`s bedroom'
                }

                const expectedSetting = {
                    ...testSettings[idToUpdate - 1],
                    ...updatedSetting
                }

                return supertest(app)
                    .patch(`/api/settings/${idToUpdate}`)
                    .send(updatedSetting)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/settings/${idToUpdate}`)
                            .expect(expectedSetting)
                    )
            })
        })
    })
})