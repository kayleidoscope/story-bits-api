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

        
    })
})