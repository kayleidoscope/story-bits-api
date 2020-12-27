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
    
    before('clean the table', () => db('story_bits_users').truncate())
    
    afterEach('cleanup', () => db('story_bits_users').truncate())
    
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
})