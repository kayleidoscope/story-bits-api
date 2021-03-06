const {expect} = require('chai')
const knex = require('knex')
const ResidencesService = require('../src/residences/residences-service')
const {makeUsersArray} = require('./users-fixtures')
const {makeStoriesArray} = require('./stories-fixtures')
const {makeCharactersArray} = require('./characters-fixtures')
const {makeSettingsArray} = require('./settings-fixtures')
const {makeResidencesArray} = require('./residences-fixtures')

describe('Residences service object', function() {
    let db;

    const testUsers = makeUsersArray()
    const testStories = makeStoriesArray()
    const testCharacters = makeCharactersArray()
    const testSettings = makeSettingsArray()
    const testResidences = makeResidencesArray()

    before(() => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL
        })
    })

    before(() => db.raw('TRUNCATE residences, characters, stories, users RESTART IDENTITY CASCADE'))

    afterEach(() => db.raw('TRUNCATE residences, characters, stories, users RESTART IDENTITY CASCADE'))

    after(() => db.destroy())

    context('Given residences has data', () => {
        beforeEach(() => {
            return db
                .into('users')
                .insert(testUsers)
                .then(() => {
                    return db
                        .into('stories')
                        .insert(testStories)
                })
                .then(() => {
                    return db
                        .into('characters')
                        .insert(testCharacters)
                })
                .then(() => {
                    return db
                        .into('settings')
                        .insert(testSettings)
                })
                .then(() => {
                    return db
                        .into('residences')
                        .insert(testResidences)
                })
        })

        it('getAllResidences() resolves list from residences', () => {
            return ResidencesService.getAllResidences(db)
                .then(actual => {
                    expect(actual).to.eql(testResidences)
                })
        })

        it('getByIds() resolves a single character-setting relationship', () => {
            const id = 2

            const [expected] = testResidences.filter(residence => residence.id == id)
            
            return ResidencesService.getByIds(db, id)
                .then(actual => {
                    expect(actual.setting_id).to.eql(expected.setting_id)
                    expect(actual.character_id).to.eql(expected.character_id)
                })
        })

        it('getResidentsOf() resolves a list of characters by way of a setting id', () => {
            const secondId = 2

            const expected = testResidences.filter(residence => residence.setting_id === secondId)

            return ResidencesService.getResidentsOf(db, secondId)
                .then(actual => {
                    expect(actual).to.eql(expected)
                })
        })

        it('getSetsOf() resolves a single setting when given character id', () => {
            const charId = 3
            const expected = testResidences.filter(residence => residence.character_id === charId)

            return ResidencesService.getSetsOf(db, charId)
                .then(actual => {
                    expect(actual).to.eql(expected)
                })
        })

        it('deleteResFromSet() removes a character from resident list by id', () => {
            const id = 3
            const expected = testResidences.filter(residence => residence.id === id)

            return ResidencesService.deleteResFromSet(db, id)
                .then(() => ResidencesService.getSetsOf(db, expected[0].character_id))
                .then(homes => {
                    expect(homes.setting_id).to.not.eql(expected[0].setting_id)
                })
        })

        it('updateResidence() changes the setting_id value of a residence entry', () => {
            const id = 3

            const expected = testResidences.filter(residence => residence.id === id)

            const newSettingField = {
                setting_id: 3
            }

            return ResidencesService.updateResidence(db, id, newSettingField)
                .then(() => ResidencesService.getSetsOf(db, expected[0].character_id))
                .then(homes => {
                    const result = homes.filter(home => home.setting_id === newSettingField.setting_id)
                    expect(result[0].setting_id).to.eql(newSettingField.setting_id)
                })
        })

        it('updateResidence() also changes the character_id value of a residence entry', () => {
            const id = 3

            const expected = testResidences.filter(residence => residence.id === id)
            
            const newCharacterField = {
                character_id: 5
            }

            return ResidencesService.updateResidence(db, id, newCharacterField)
                .then(() => ResidencesService.getResidentsOf(db, expected[0].setting_id))
                .then(homes => {
                    const result = homes.filter(home => home.character_id === newCharacterField.character_id)
                    expect(result[0].character_id).to.eql(newCharacterField.character_id)
                })
        })
    })

    context('Given residences has no data but the other tables do', () => {
        beforeEach(() => {
            return db
                .into('users')
                .insert(testUsers)
                .then(() => {
                    return db
                        .into('stories')
                        .insert(testStories)
                })
                .then(() => {
                    return db
                        .into('characters')
                        .insert(testCharacters)
                })
                .then(() => {
                    return db
                        .into('settings')
                        .insert(testSettings)
                })
        })

        it('getAllResidences() resolves an empty array', () => {
            return ResidencesService.getAllResidences(db)
            .then(actual => {
                expect(actual).to.eql([])
            })
        })

        it('createNewRelationship() inserts a new character-residence relationship', () => {
            const newRelationship = {
                character_id: 5,
                setting_id: 2
            }

            return ResidencesService.createNewRelationship(db, newRelationship)
                .then(actual => {
                    expect(actual).to.eql({
                        character_id: newRelationship.character_id,
                        setting_id: newRelationship.setting_id,
                        id: 1
                    })
                })
        })
    })
})