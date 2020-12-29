const {expect} = require('chai')
const knex = require('knex')
const SettingsService = require('../src/settings/settings-service')
const StoriesService = require('../src/stories/stories-service')
const UsersService = require('../src/users/users-service')
const {makeUsersArray} = require('./users-fixtures')
const {makeStoriesArray} = require('./stories-fixtures')
const {makeSettingsArray} = require('./settings-fixtures')

describe(`Settings service object`, function() {
    let db;

    const testUsers = makeUsersArray()
    const testStories = makeStoriesArray()
    const testSettings = makeSettingsArray()

    before(() => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
    })

    before(() => db.raw('TRUNCATE story_bits_settings, story_bits_stories, story_bits_users RESTART IDENTITY CASCADE'))

    afterEach(() => db.raw('TRUNCATE story_bits_settings, story_bits_stories, story_bits_users RESTART IDENTITY CASCADE'))

    after(() => db.destroy())

    context('Given story_bits_settings has data', () => {
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

        it('getAllSettings() resolves list from story_bits_settings', () => {
            return SettingsService.getAllSettings(db)
                .then(actual => {
                    expect(actual).to.eql(testSettings)
                })
        })

        it('getById() resolves a story by id from story_bits_settings', () => {
            const thirdId = 3
            const thirdTestSetting = testSettings[thirdId - 1]
            return SettingsService.getById(db, thirdId)
                .then(actual => {
                    expect(actual).to.eql({
                        id: thirdId,
                        story_id: thirdTestSetting.story_id,
                        name: thirdTestSetting.name,
                        isresidence: thirdTestSetting.isresidence,
                        decor: thirdTestSetting.decor
                    })
                })
        })
        
        it('deleteSetting() removes a setting by id from story_bits_settings', () => {
            const settingId = 3;
            return SettingsService.deleteSetting(db, settingId)
                .then(() => SettingsService.getAllSettings(db))
                .then(allSettings => {
                    const expected = testSettings.filter(setting => setting.id !== settingId)
                    expect(allSettings).to.eql(expected)
                })
        })

        it('updateSetting() changes a setting by id from story_bits_settings', () => {
            const idOfSettingToUpdate = 2
            const oldSettingData = testSettings[idOfSettingToUpdate - 1]
            const newSettingData = {
                name: 'Cafe Boolean',
                story_id: 1,
                isresidence: false,
                decor: 'A normal coffeeshop.'
            }
            return SettingsService.updateSetting(db, idOfSettingToUpdate, newSettingData)
                .then(() => SettingsService.getById(db, idOfSettingToUpdate))
                .then(setting => {
                    expect(setting).to.eql({
                        id: idOfSettingToUpdate,
                        ...newSettingData
                    })
                })
        })
    })

    context('Given story_bits_settings has no data', () => {
        it('getAllSettings() resolves an empty array', () => {
            return SettingsService.getAllSettings(db)
                .then(setting => {
                    expect(setting).to.eql([])
                })
        })

        it('insertSetting() inserts a new setting and resolves the new setting with an id', () => {
            const newSetting = {
                story_id: 1,
                name: 'Leopold Plaza',
                isresidence: false,
                decor: 'Stonework laid in beautiful pattern surrounding a fountain'
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

            return SettingsService.insertSetting(db, newSetting)
                .then(actual => {
                    expect(actual).to.eql({
                        id: 1,
                        name: newSetting.name,
                        story_id: newSetting.story_id,
                        decor: newSetting.decor,
                        isresidence: newSetting.isresidence
                    })
                })
        })
    })
})