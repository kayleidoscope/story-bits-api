const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const { StripTagBody } = require('xss');
const app = require('../src/app')
const {makeStoriesArray} = require('./stories-fixtures')
const {makeUsersArray} = require('./users-fixtures')
const {makeCharactersArray} = require('./characters-fixtures');
const e = require('express');

describe('Characters endpoints', function() {
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

        context('Given an XSS attack character', () => {
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

    describe('POST /api/characters', () => {
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

        context('Given an XSS attack character', () => {
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

            it('removes XSS attack content', () => {
                return supertest(app)
                    .post(`/api/characters`)
                    .send(evilCharacter)
                    .expect(201)
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

        it('creates a new character, responding with 201 and the new character', function() {
            const newCharacter = {
                story_id: 3,
                name: 'Placeholder Name',
                age: 'senior, retired',
                description: 'A very interesting person. She loves telling jokes',
                gender: 'female',
                appearance: 'Short and skinny, with medium, coiled silver hair, green eyes, a dark skin tone, and a scar.',
                fashion: '',
                room_decor: 'Hates an untidy home.'
            }

            return supertest(app)
                .post('/api/characters')
                .send(newCharacter)
                .expect(201)
                .expect(res => {
                    expect(res.body.story_id).to.eql(newCharacter.story_id)
                    expect(res.body.name).to.eql(newCharacter.name)
                    expect(res.body.age).to.eql(newCharacter.age)
                    expect(res.body.description).to.eql(newCharacter.description)
                    expect(res.body.gender).to.eql(newCharacter.gender)
                    expect(res.body.appearance).to.eql(newCharacter.appearance)
                    expect(res.body.fashion).to.eql(newCharacter.fashion)
                    expect(res.body.room_decor).to.eql(newCharacter.room_decor)
                    expect(res.body).to.have.property('id')
                })
                .then(res =>
                    supertest(app)
                        .get(`/api/characters/${res.body.id}`)
                        .expect(res.body)
                )
        })

        it('responds with 400 and an error message when story_id is missing', () => {
            const newCharacter = {
                name: 'Placeholder Name',
                age: 'senior, retired',
                description: 'A very interesting person. She loves telling jokes',
                gender: 'female',
                appearance: 'Short and skinny, with medium, coiled silver hair, green eyes, a dark skin tone, and a scar.',
                fashion: '',
                room_decor: 'Hates an untidy home.'
            }

            return supertest(app)
                .post('/api/characters')
                .send(newCharacter)
                .expect(400, {
                    error: {message: `Missing story_id in request`}
                })
        })

        it('responds with 400 and an error message when name is missing', () => {
            const newCharacter = {
                story_id: 3,
                age: 'senior, retired',
                description: 'A very interesting person. She loves telling jokes',
                gender: 'female',
                appearance: 'Short and skinny, with medium, coiled silver hair, green eyes, a dark skin tone, and a scar.',
                fashion: '',
                room_decor: 'Hates an untidy home.'
            }

            return supertest(app)
                .post('/api/characters')
                .send(newCharacter)
                .expect(400, {
                    error: {message: `Missing name in request`}
                })
        })

        it('responds with 201 and the new character when only story_id and name are provided', () => {
            const newCharacter = {
                story_id: 3,
                name: 'Placeholder Name'
            }

            return supertest(app)
                .post('/api/characters')
                .send(newCharacter)
                .expect(201)
                .then(res =>
                    supertest(app)
                        .get(`/api/characters/${res.body.id}`)
                        .expect(res.body)
                )
        })
    })

    describe('DELETE /api/characters/:id', () => {
        context('Given no characters in the database', () => {
            it('responds with 404', () => {
                const charId = 123
                return supertest(app)
                    .delete(`/api/characters/${charId}`)
                    .expect(404, {error: {message: `Character doesn't exist`}})
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
                            .into('story_bits_characters')
                            .insert(testCharacters)
                    })
            })

            it('responds with 204 and removes the story', () => {
                const idToRemove = 2
                const expectedCharacters = testCharacters.filter(char => char.id !== idToRemove)

                return supertest(app)
                    .delete(`/api/characters/${idToRemove}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get('/api/characters')
                            .expect(expectedCharacters)
                    )
            })
        })
    })

    describe('PATCH /api/characters/:id', () => {
        context('Given no characters', () => {
            it('responds with 404', () => {
                const charId = 12432
                return supertest(app)
                    .patch(`/api/characters/${charId}`)
                    .expect(404, {error: {message: `Character doesn't exist`}})
            })
        })

        context('Given there are characters in the database', () => {
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

            it('responds with 204 and updates the story', () => {
                const idToUpdate = 2
                const updatedCharacter = {
                    story_id: 3,
                    name: 'Zoey',
                    age: '36',
                    description: `Bold, and guarded. Doesn't trust easily`,
                    gender: 'genderfluid',
                    appearance: 'Black, with dark skin, an afro',
                    fashion: 'Varies between sweatshirts and crop tops',
                    room_decor: 'Stylishly decorated and peaceful'
                }

                const expectedCharacter = {
                    ...testCharacters[idToUpdate - 1],
                    ...updatedCharacter
                }

                return supertest(app)
                    .patch(`/api/characters/${idToUpdate}`)
                    .send(updatedCharacter)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/characters/${idToUpdate}`)
                            .expect(expectedCharacter)
                    )
            })

            it('responds with 204 when updating only a subset of fields', () => {
                const idToUpdate = 2
                const updatedCharacter = {
                    name: 'Zoey',
                    age: '36',
                    appearance: 'Black, with dark skin, an afro',
                    fashion: 'Varies between sweatshirts and crop tops',
                }

                const expectedCharacter = {
                    ...testCharacters[idToUpdate - 1],
                    ...updatedCharacter
                }

                return supertest(app)
                    .patch(`/api/characters/${idToUpdate}`)
                    .send(updatedCharacter)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/characters/${idToUpdate}`)
                            .expect(expectedCharacter)
                    )
            })
        })
    })
})