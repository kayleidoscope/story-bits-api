const StoriesService = {
    getAllStories(knex) {
        return knex.select('*').from('stories')
    },
    insertStory(knex, newStory) {
        return knex
            .insert(newStory)
            .into('stories')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex
            .select('*')
            .from('stories')
            .where('id', id)
            .first()
    },
    getStoriesByUser(knex, user_id) {
        return knex
            .select('*')
            .from('stories')
            .where({user_id})
    },
    deleteStory(knex, id) {
        return knex('stories')
            .where({id})
            .delete()
    },
    updateStory(knex, id, newStoryFields) {
        return knex('stories')
            .where({id})
            .update(newStoryFields)
    }
}

module.exports = StoriesService