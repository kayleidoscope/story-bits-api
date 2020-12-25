const UsersService = {
    getAllUsers(knex) {
        return knex.select('*').from('story_bits_users')
    },
    insertUser(knex, newUser) {
        return knex
            .insert(newUser)
            .into('story_bits_users')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex
            .from('story_bits_users')
            .select('*')
            .where('id', id)
            .first()
    },
    deleteUser(knex, id) {
        return knex('story_bits_users')
            .where({id})
            .delete()
    },
    updateUser(knex, id, newUserFields) {
        return knex('story_bits_users')
            .where({id})
            .update(newUserFields)
    }
}

module.exports = UsersService