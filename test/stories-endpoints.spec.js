const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const { StripTagBody } = require('xss');
const app = require('../src/app')
const {makeStoriesArray} = require('./stories-fixtures')
const {makeUsersArray} = require('./users-fixtures')

describe('Stories endpoints', function() {
    let db;

    const testUsers = makeUsersArray()
    const testStories = makeStoriesArray()

    before('make next instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
        app.set('db', db)
    })

    before(() => db.raw('TRUNCATE story_bits_stories, story_bits_users RESTART IDENTITY CASCADE'))

    afterEach(() => db.raw('TRUNCATE story_bits_stories, story_bits_users RESTART IDENTITY CASCADE'))

    after('disconnect from db', () => db.destroy())

    describe('GET /api/stories', () => {
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
            })

            it('GET /api/stories responds with 200 and all of the stories', () => {
                return supertest(app)
                    .get('/api/stories')
                    .expect(200, testStories)
            })
        })

        context('Given there are no stories in the database', () => {
            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/api/stories')
                    .expect(200, [])
            })
        })
    })

    describe('GET /api/stories/:id', () => {

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

        context('Given there are stories in the database', () => {

            it('GET /api/stories/:id responds with 200 and that story', () => {
                const storyId = 2;
                const expectedStory = testStories[storyId - 1]

                return supertest(app)
                    .get(`/api/stories/${storyId}`)
                    .expect(200, expectedStory)
            })
        })

        context('Given a XSS attack user', () => {
            const evilStory = {
                id: 911,
                user_id: 1,
                title: 'Harry Potter and the Prisoner of <script>alert("xsskaban");</script>',
                description: `An orphan boy worries a lot <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. I forget <strong>all</strong> the plot.`
            }

            beforeEach('insert evil story', () => {
                return db
                    .into('story_bits_stories')
                    .insert([evilStory])
            })
            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/stories/${evilStory.id}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql('Harry Potter and the Prisoner of &lt;script&gt;alert(\"xsskaban\");&lt;/script&gt;')
                        expect(res.body.description).to.eql(`An orphan boy worries a lot <img src="https://url.to.file.which/does-not.exist">. I forget <strong>all</strong> the plot.`)
                    })
            })
        })
    })

    describe('POST /api/stories', () => {
        beforeEach(() => {
            return db
                .into('story_bits_users')
                .insert(testUsers)
        })

        context('Given an XSS attack story', () => {
            const evilStory = {
                id: 911,
                user_id: 1,
                title: 'Harry Potter and the Prisoner of <script>alert("xsskaban");</script>',
                description: `An orphan boy worries a lot <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. I forget <strong>all</strong> the plot.`
            }
            it('removes XSS attack content', () => {
                return supertest(app)
                    .post(`/api/stories`)
                    .send(evilStory)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.title).to.eql('Harry Potter and the Prisoner of &lt;script&gt;alert(\"xsskaban\");&lt;/script&gt;')
                        expect(res.body.description).to.eql(`An orphan boy worries a lot <img src="https://url.to.file.which/does-not.exist">. I forget <strong>all</strong> the plot.`)
                    })
            })
        })

        it('creates a new story, responding with 201 and the new story', function() {
            const newStory = {
                user_id: 2,
                title: 'Reckless',
                description: 'He drove his car faster, pressing the pedal down harder. Then the world around him changed'
            }

            return supertest(app)
                .post('/api/stories')
                .send(newStory)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(newStory.title)
                    expect(res.body.description).to.eql(newStory.description)
                    expect(res.body.user_id).to.eql(newStory.user_id)
                    expect(res.body).to.have.property('id')
                })
                .then(res =>
                    supertest(app)
                        .get(`/api/stories/${res.body.id}`)
                        .expect(res.body)
                )
        })

        it('responds with 400 and an error message when user_id is missing', () => {
            const newStory = {
                title: 'Reckless',
                description: 'He drove his car faster, pressing the pedal down harder. Then the world around him changed'
            }

            return supertest(app)
                .post('/api/stories')
                .send(newStory)
                .expect(400, {
                    error: { message: 'Missing user_id in request' }
                })
        })

        it('responds with 400 and an error message when title is missing', () => {
            const newStory = {
                user_id: 2,
                description: 'He drove his car faster, pressing the pedal down harder. Then the world around him changed'
            }

            return supertest(app)
                .post('/api/stories')
                .send(newStory)
                .expect(400, {
                    error: { message: 'Missing title in request' }
                })
        })

        it('responds with 400 and an error message when user_id is missing', () => {
            const newStory = {
                user_id: 2,
                title: 'Reckless'
            }

            return supertest(app)
                .post('/api/stories')
                .send(newStory)
                .expect(400, {
                    error: { message: 'Missing description in request' }
                })
        })
    })

    describe('DELETE /api/stories/:id', () => {
        context('Given no stories', () => {
            it('responds with 404', () => {
                const storyId = 2134
                return supertest(app)
                    .delete(`/api/stories/${storyId}`)
                    .expect(404, {error: {message: `Story doesn't exist`}})
            })
        })

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
            })

            it('responds with 204 and removes the story', () => {
                const idToRemove = 2
                const expectedStories = testStories.filter(story => story.id !== idToRemove)

                return supertest(app)
                    .delete(`/api/stories/${idToRemove}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get('/api/stories')
                            .expect(expectedStories)
                    )
            })
        })
    })
})