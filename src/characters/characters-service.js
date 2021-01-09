const CharactersService = {
    getAllCharacters(knex) {
        return knex.select('*').from('characters')
    },
    insertCharacter(knex, newCharacter) {
        return knex
            .insert(newCharacter)
            .into('characters')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex
            .select('*')
            .from('characters')
            .where({id})
            .first()
    },
    getByStoryId(knex, story_id) {
        return knex
            .select('*')
            .from('characters')
            .where({story_id})
    },
    deleteCharacter(knex, id) {
        return knex('characters')
            .where({id})
            .delete()
    },
    updateCharacter(knex, id, newCharFields) {
        return knex('characters')
            .where({id})
            .update(newCharFields)
    }
}

module.exports = CharactersService