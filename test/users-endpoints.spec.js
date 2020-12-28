const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const app = require('../src/app')
const {makeUsersArray} = require('./users-fixtures')

describe('Users endpoints', function() {
    let db;

    const testUsers = makeUsersArray()

    before('make next instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
        app.set('db', db)
    })
    
    before(() => db.raw('TRUNCATE story_bits_users RESTART IDENTITY CASCADE'))

    afterEach(() => db.raw('TRUNCATE story_bits_users RESTART IDENTITY CASCADE'))
    
    after('disconnect from db', () => db.destroy())
    
    describe('GET /api/users', () => {
        context('Given there are users in the database', () => {

            beforeEach('insert users', () => {
                return db
                    .into('story_bits_users')
                    .insert(testUsers)
            })

            it('GET /api/users responds with 200 and all of the users', () => {
                return supertest(app)
                    .get('/api/users')
                    .expect(200, testUsers.map(user => (
                        {...user, acct_created: user.acct_created.toISOString()}
                    )))
            })
        })

        context('Given there are no users in the database', () => {
            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/api/users')
                    .expect(200, [])
            })
        })
    })

    describe('GET /api/users/:id', () => {
        context('Given there are users in the database', () => {
            const testUsers = makeUsersArray()

            beforeEach('insert users', () => {
                return db
                    .into('story_bits_users')
                    .insert(testUsers)
            })
            
            it('GET /api/users/:id responds with 200 and that user', () => {
                const userId = 2;
                const expectedUser = testUsers[userId - 1]
                return supertest(app)
                    .get(`/api/users/${userId}`)
                    .expect(200, {...expectedUser, acct_created: expectedUser.acct_created.toISOString()})
            })
        })

        context('Given an XSS attack user', () => {
            const evilUser = {
                id: 911,
                username: 'Naughty1<script>alert("xss");</script>'
            }

            beforeEach('insert evil user', () => {
                return db
                    .into('story_bits_users')
                    .insert([evilUser])
            })
            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/users/${evilUser.id}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.username).to.eql('Naughty1&lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                    })
            })
        })
    })

    describe('POST /api/users', () => {
        context('Given an XSS attack user', () => {
            const evilUser = {
                id: 911,
                username: 'Naughty1<script>alert("xss");</script>'
            }
            it('removes XSS attack content', () => {
                return supertest(app)
                    .post(`/api/users`)
                    .send(evilUser)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.username).to.eql('Naughty1&lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                    })
            })
        })

        it('creates a new user, responding with 201 and the new user', function() {
            this.retries(3)

            const newUser = {
                username: 'Prince Zuko'
            }

            return supertest(app)
                .post('/api/users')
                .send(newUser)
                .expect(201)
                .expect(res => {
                    expect(res.body.username).to.eql(newUser.username)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/users/${res.body.id}`)
                    const expected = new Date().toLocaleString()
                    const actual = new Date(res.body.acct_created).toLocaleString()
                    expect(actual).to.eql(expected)
                })
                .then(res => 
                    supertest(app)
                        .get(`/api/users/${res.body.id}`)
                        .expect(res.body)
                )
        })

        it('responds with 400 and an error message when username is missing', () => {
            return supertest(app)
                .post('/api/users')
                .send({})
                .expect(400, {
                    error: {message: 'You must provide a username'}
                })
        })
    })

    describe('DELETE /api/users/:id', () => {
        context('Given no users', () => {
            it('responds with 404', () => {
                const userId = 525600
                return supertest(app)
                    .delete(`/api/users/${userId}`)
                    .expect(404, { error: { message: `User doesn't exist` } })
            })
        })
        context('Given there are users in the database', () => {
            const testUsers = makeUsersArray()

            beforeEach('insert users', () => {
                return db
                    .into('story_bits_users')
                    .insert(testUsers)
            })

            it('responds with 204 and removes the user', () => {
                const idToRemove = 2
                const expectedUsers = testUsers.filter(user => user.id !== idToRemove)
                return supertest(app)
                    .delete(`/api/users/${idToRemove}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get('/api/users')
                            .expect(expectedUsers.map(user => (
                                 {...user, acct_created: user.acct_created.toISOString()} 
                            )))
                    
                    )
            })
        })
    })

    describe('PATCH /api/users/:id', () => {
        context('Given no users', () => {
            it('responds with 404', () => {
                const userId = 525600
                return supertest(app)
                    .patch(`/api/users/${userId}`)
                    .expect(404, { error: { message: `User doesn't exist` } })
            })
        })
        
        context('Given there are users in the database', () => {
            const testUsers = makeUsersArray()

            beforeEach('insert users', () => {
                return db
                    .into('story_bits_users')
                    .insert(testUsers)
            })

            it('responds with 204 and updates the user', () => {
                const idToUpdate = 2
                const updatedUser = {
                    username: 'Dani Dummy'
                }
                const expectedUser = {
                    ...testUsers[idToUpdate - 1],
                    ...updatedUser
                }
                return supertest(app)
                    .patch(`/api/users/${idToUpdate}`)
                    .send(updatedUser)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/users/${idToUpdate}`)
                            .expect({...expectedUser, acct_created: expectedUser.acct_created.toISOString()})
                    )
            })
            it('responds with 400 when no required fields are supplied', () => {
                const idToUpdate = 2

                return supertest(app)
                    .patch(`/api/users/${idToUpdate}`)
                    .send({ irrelevantField: 'foo' })
                    .expect(400, {
                        error: {
                            message: `You must provide a new username to change your username`
                        }
                    })
            })
            it('responds with 204 when updating only a subset of fields', () => {
                const idToUpdate = 2
                const updatedUser = {
                    username: 'Dani Dummy'
                }
                const expectedUser = {
                    ...testUsers[idToUpdate - 1],
                    ...updatedUser
                }
                return supertest(app)
                    .patch(`/api/users/${idToUpdate}`)
                    .send({
                        ...updatedUser,
                        fieldToIgnore: 'should not be in GET response'
                    })
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/users/${idToUpdate}`)
                            .expect({...expectedUser, acct_created: expectedUser.acct_created.toISOString()})
                    )
            })
        })
    })
})