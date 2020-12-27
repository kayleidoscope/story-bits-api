const {expect} = require('chai')
const knex = require('knex')
const StoriesService = require('../src/stories/stories-service')
const {makeUsersArray} = require('./users-fixtures')
const {makeStoriesArray} = require('./stories-fixtures')

describe(`Stories service object`, function() {
    let db;

    const testUsers = makeUsersArray()
    const testStories = makeStoriesArray()

    before(() => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
    })

    before(() => db.raw('TRUNCATE story_bits_stories CASCADE'))

    afterEach(() => db.raw('TRUNCATE story_bits_stories CASCADE'))

    after(() => db.destroy())

    context('Given story_bits_stories has data', () => {
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
        it('getAllStories() resolves list from story_bits_stories table', () => {
            return StoriesService.getAllStories(db)
                .then(actual => {
                    expect(actual).to.eql(testStories)
                })
        })
    })
})