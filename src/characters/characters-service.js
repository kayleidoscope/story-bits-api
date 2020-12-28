const CharactersService = {
    getAllCharacters(knex) {
        return knex.select('*').from('story_bits_characters')
    },
    insertCharacter(knex, newCharacter) {
        return knex
            .insert(newCharacter)
            .into('story_bits_characters')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex
            .select('*')
            .from('story_bits_characters')
            .where({id})
            .first()
    },
    deleteCharacter(knex, id) {
        return knex('story_bits_characters')
            .where({id})
            .delete()
    },
    updateCharacter(knex, id, newCharFields) {
        return knex('story_bits_characters')
            .where({id})
            .update(newCharFields)
    }
}

module.exports = CharactersService