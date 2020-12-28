const {expect} = require('chai')
const knex = require('knex')
const CharactersService = require('../src/characters/characters-service')
const StoriesService = require('../src/stories/stories-service')
const UsersService = require('../src/users/users-service')
const {makeUsersArray} = require('./users-fixtures')
const {makeStoriesArray} = require('./stories-fixtures')
const {makeCharactersArray} = require('./characters-fixtures')

describe(`Characters service object`, function() {
    let db;

    const testUsers = makeUsersArray()
    const testStories = makeStoriesArray()
    const testCharacters = makeCharactersArray()

    before(() => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
    })

    before(() => db.raw('TRUNCATE story_bits_characters, story_bits_stories, story_bits_users RESTART IDENTITY CASCADE'))

    afterEach(() => db.raw('TRUNCATE story_bits_characters, story_bits_stories, story_bits_users RESTART IDENTITY CASCADE'))

    after(() => db.destroy())

    context('Given story_bits_characters has data', () => {
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

        it('getAllCharacters() resolves list from story_bits_characters', () => {
            return CharactersService.getAllCharacters(db)
                .then(actual => {
                    expect(actual).to.eql(testCharacters)
                })
        })

        it('getById() resolves a story by id from story_bits_characters', () => {
            const thirdId = 3
            const thirdTestChar = testCharacters[thirdId - 1]
            return CharactersService.getById(db, thirdId)
                .then(actual => {
                    expect(actual).to.eql({
                        id: thirdId,
                        story_id: thirdTestChar.story_id,
                        name: thirdTestChar.name,
                        age: thirdTestChar.age,
                        description: thirdTestChar.description,
                        gender: thirdTestChar.gender,
                        appearance: thirdTestChar.appearance,
                        fashion: thirdTestChar.fashion,
                        room_decor: thirdTestChar.room_decor
                    })
                })
        })
        
        it('deleteChar() removes a char by id from story_bits_characters', () => {
            const charId = 3;
            return CharactersService.deleteCharacter(db, charId)
                .then(() => CharactersService.getAllCharacters(db))
                .then(allChars => {
                    const expected = testCharacters.filter(char => char.id !== charId)
                    expect(allChars).to.eql(expected)
                })
        })

        it('updateCharacter() changes a char by id from story_bits_characters', () => {
            const idOfCharToUpdate = 2
            const oldCharData = testCharacters[idOfCharToUpdate - 1]
            const newCharData = {
                story_id: 1,
                name: 'Zoey',
                age: '33',
                description: `Bold and guarded. Doesn't trust easily`,
                gender: '',
                appearance: 'Black with dark skin, an afro, and a round face',
                fashion: 'Varies widly. E.g., wears tattered hoodies and crop tops',
                room_decor: 'Stylishly decorated and peaceful'
            }
            return CharactersService.updateCharacter(db, idOfCharToUpdate, newCharData)
                .then(() => CharactersService.getById(db, idOfCharToUpdate))
                .then(char => {
                    expect(char).to.eql({
                        id: idOfCharToUpdate,
                        ...newCharData
                    })
                })
        })
    })

    context('Given story_bits_characters has no data', () => {
        it('getAllCharacters() resolves an empty array', () => {
            return CharactersService.getAllCharacters(db)
                .then(chars => {
                    expect(chars).to.eql([])
                })
        })

        it('insertCharacter() inserts a new character and resolves the new character with an id', () => {
            const newCharacter = {
                story_id: 1,
                name: 'Leopold',
                age: 'old',
                description: 'Loves his crosswords',
                gender: 'male',
                appearance: 'Wrinkled skin, a sharp stare',
                fashion: 'Wears a lot of baggy sweaters',
                room_decor: 'Smells like old books'
            }

            const newUser = {
                username: 'Contesta',
                acct_created: new Date('2020-01-01T00:00:00.000Z')
            }

            const newStory = {
                title: 'A New Story',
                description: 'Not really sure what this is gonna be about yet',
                user_id: 1
            }

            UsersService.insertUser(db, newUser)
            StoriesService.insertStory(db, newStory)

            return CharactersService.insertCharacter(db, newCharacter)
                .then(actual => {
                    expect(actual).to.eql({
                        id: 1,
                        name: newCharacter.name,
                        story_id: newCharacter.story_id,
                        age: newCharacter.age,
                        description: newCharacter.description,
                        gender: newCharacter.gender,
                        appearance: newCharacter.appearance,
                        fashion: newCharacter.fashion,
                        room_decor: newCharacter.room_decor
                    })
                })
        })
    })
})