const {expect} = require("chai")
const knex = require('knex')
const UsersService = require('../src/users/users-service')
const {makeUsersArray} = require('./users-fixtures')

describe(`Users service object`, function() {
    let db;

    let testUsers = makeUsersArray();

    before(() => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
    })

    before(() => db('story_bits_users').truncate())

    afterEach(() => db('story_bits_users').truncate())

    after(() => db.destroy())

    context(`Given 'story_bits_users' has data`, () => {
        beforeEach(() => {
            return db
                .into('story_bits_users')
                .insert(testUsers)
        })
        it(`getAllUsers() resolves from 'story_bits_users table`, () => {
            return UsersService.getAllUsers(db)
                .then(actual => {
                    expect(actual).to.eql(testUsers)
                })
        })
        it(`getById() resolves a user by id from 'story_bits_users`, () => {
            const thirdId = 3;
            const thirdTestUser = testUsers[thirdId - 1];
            return UsersService.getById(db, thirdId)
                .then(actual => {
                    expect(actual).to.eql({
                        id: thirdId,
                        username: thirdTestUser.username,
                        acct_created: thirdTestUser.acct_created
                    })
                })
        })
        it(`deleteUser() removes a user by id from 'story_bits_users`, () => {
            const userId = 3;
            return UsersService.deleteUser(db, userId)
                .then(() => UsersService.getAllUsers(db))
                .then(allUsers => {
                    const expected = testUsers.filter(user => user.id !== userId)
                    expect(allUsers).to.eql(expected)
                })
        })
        it(`updateUser() updates a user from the 'story_bits_users' table`, () => {
            const idOfUserToUpdate = 3;
            const newUserData = {
                username: 'Polly Pretend-Smith',
                acct_created: new Date('1910-12-22T16:28:32.615Z')
            }
            return UsersService.updateUser(db, idOfUserToUpdate, newUserData)
                .then(() => UsersService.getById(db, idOfUserToUpdate))
                .then(user => {
                    expect(user).to.eql({
                        id: idOfUserToUpdate,
                        ...newUserData
                    })
                })
        })
    })

    context(`Given 'story_bits_users' has no data`, () => {
        it(`getAllUsers() resolves an empty array`, () => {
            return UsersService.getAllUsers(db)
                .then(actual => {
                    expect(actual).to.eql([])
                })
        })
        it(`insertUser() inserts a new user and resolves the new user with an id`, () => {
            const newUser = {
                username: 'Contesta',
                acct_created: new Date('2020-01-01T00:00:00.000Z')
            }
            return UsersService.insertUser(db, newUser)
                .then(actual => {
                    expect(actual).to.eql({
                        id: 1,
                        username: newUser.username,
                        acct_created: newUser.acct_created
                    })
                })
        })
    })
})