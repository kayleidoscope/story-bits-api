const {expect} = require('chai')
const knex = require('knex')
const StoriesService = require('../src/stories/stories-service')
const UsersService = require('../src/users/users-service')
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

    before(() => db.raw('TRUNCATE stories, users RESTART IDENTITY CASCADE'))

    afterEach(() => db.raw('TRUNCATE stories, users RESTART IDENTITY CASCADE'))

    after(() => db.destroy())

    context('Given stories has data', () => {
        beforeEach(() => {
            return db
                .into('users')
                .insert(testUsers)
                .then(() => {
                    return db
                        .into('stories')
                        .insert(testStories)
                })
        })
        it('getAllStories() resolves list from stories table', () => {
            return StoriesService.getAllStories(db)
                .then(actual => {
                    expect(actual).to.eql(testStories)
                })
        })
        it('getStoriesByUser() resolves a list of stories by that user', () => {
            const userId = 1;
            const storiesByUser = testStories.filter(story => story.user_id === userId)

            return StoriesService.getStoriesByUser(db, userId)
                .then(actual => {
                    expect(actual).to.eql(storiesByUser)
                })
        })
        it('getById() resolves a story by id from stories', () => {
            const thirdId = 3;
            const thirdTestStory = testStories[thirdId - 1]
            return StoriesService.getById(db, thirdId)
                .then(actual => {
                    expect(actual).to.eql({
                        id: thirdId,
                        title: thirdTestStory.title,
                        description: thirdTestStory.description,
                        user_id: thirdTestStory.user_id
                    })
                })
        })
        it('deleteStory() removes a story by id from stories', () => {
            const storyId = 3;
            return StoriesService.deleteStory(db, storyId)
                .then(() => StoriesService.getAllStories(db))
                .then(allStories => {
                    const expected = testStories.filter(story => story.id !== storyId)
                    expect(allStories).to.eql(expected)
                })
        })
        it('updateStory() changes a story by id from stories', () => {
            const idOfStoryToUpdate = 3;
            const oldStoryData = testStories[idOfStoryToUpdate - 1]
            const newStoryData = {
                title: 'Test Launch',
                description: `It's an action story now!`
            }
            return StoriesService.updateStory(db, idOfStoryToUpdate, newStoryData)
                .then(() => StoriesService.getById(db, idOfStoryToUpdate))
                .then(story => {
                    expect(story).to.eql({
                        id: idOfStoryToUpdate,
                        user_id: oldStoryData.user_id,
                        ...newStoryData
                    })
                })
        })
    })

    context('Given stories has no data but does have users', () => {
        beforeEach(() => {
            return db
                .into('users')
                .insert(testUsers)
        })

        it('getAllStories() resolves an empty array', () => {
            return StoriesService.getAllStories(db)
                .then(actual => {
                    expect(actual).to.eql([])
                })
        })
        it('insertStory() inserts a new story and resolves the new story with an id', () => {
            const newUser = {
                username: 'Contesta',
                acct_created: new Date('2020-01-01T00:00:00.000Z')
            }
            const newStory = {
                title: 'A New Story',
                description: 'Not really sure what this is gonna be about yet',
                user_id: 1
            }

            return StoriesService.insertStory(db, newStory)
                .then(actual => {
                    expect(actual).to.eql({
                        id: 1,
                        user_id: newStory.user_id,
                        title: newStory.title,
                        description: newStory.description
                    })
                })
        })
    })
})