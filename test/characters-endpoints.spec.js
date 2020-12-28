const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const { StripTagBody } = require('xss');
const app = require('../src/app')
const {makeStoriesArray} = require('./stories-fixtures')
const {makeUsersArray} = require('./users-fixtures')
const {makeCharactersArray} = require('./characters-fixtures');
const e = require('express');

describe.only('Characters endpoints', function() {
    let db;

    const testUsers = makeUsersArray()
    const testStories = makeStoriesArray()
    const testCharacters = makeCharactersArray()

    before('make next instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
        app.set('db', db)
    })

    before(() => db.raw('TRUNCATE story_bits_characters, story_bits_stories, story_bits_users RESTART IDENTITY CASCADE'))

    afterEach(() => db.raw('TRUNCATE story_bits_characters, story_bits_stories, story_bits_users RESTART IDENTITY CASCADE'))

    after('disconnect from db', () => db.destroy())

    describe('GET /api/characters', () => {
        
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
                        .into('story_bits_characters')
                        .insert(testCharacters)
                })
            })

            it('GET /api/characters responds with 200 and all of the characters', () => {
                return supertest(app)
                    .get('/api/characters')
                    .expect(200, testCharacters)
            })
        })

        context('Given there are no characters in the database', () => {
            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/api/characters')
                    .expect(200, [])
            })
        })
    })

    describe('GET /api/characters/:id', () => {
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
                        .into('story_bits_characters')
                        .insert(testCharacters)
                })
        })

        context('Given there are characters in the database', () => {
            it('GET /api/characters/:id responds with 200 and that character', () => {
                const charId = 2
                const expectedChar = testCharacters[charId - 1]

                return supertest(app)
                    .get(`/api/characters/${charId}`)
                    .expect(200, expectedChar)
            })
        })

        context('Given an XSS attack user', () => {
            const evilCharacter = {
                id: 911,
                story_id: 1,
                name: '<script>alert("xss");</script>',
                age: 'middle-aged <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">',
                description: 'Mean, very mean like so mean <script>alert("xss");</script>',
                gender: 'fem<img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">ale',
                appearance: 'Dashingly beautiful with big doe eyes <script>alert("xss");</script>',
                fashion: 'High class dresses and pantsuits <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">',
                room_decor: 'Pristine <script>alert("xss");</script>'
            }

            beforeEach('insert evil character', () => {
                return db
                    .into('story_bits_characters')
                    .insert([evilCharacter])
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/characters/${evilCharacter.id}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.name).to.eql('&lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                        expect(res.body.age).to.eql('middle-aged <img src="https://url.to.file.which/does-not.exist">')
                        expect(res.body.description).to.eql('Mean, very mean like so mean &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                        expect(res.body.gender).to.eql('fem<img src="https://url.to.file.which/does-not.exist">ale')
                        expect(res.body.appearance).to.eql('Dashingly beautiful with big doe eyes &lt;script&gt;alert(\"xss");&lt;/script&gt;')
                        expect(res.body.fashion).to.eql('High class dresses and pantsuits <img src="https://url.to.file.which/does-not.exist">')
                        expect(res.body.room_decor).to.eql('Pristine &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                    })
            })
        })
    })
})