const StoriesService = {
    getAllStories(knex) {
        return knex.select('*').from('story_bits_stories')
    },
    insertStory(knex, newStory) {
        return knex
            .insert(newStory)
            .into('story_bits_stories')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex
            .select('*')
            .from('story_bits_stories')
            .where('id', id)
            .first()
    },
    getStoriesByUser(knex, user_id) {
        return knex
            .select('*')
            .from('story_bits_stories')
            .where({user_id})
    },
    deleteStory(knex, id) {
        return knex('story_bits_stories')
            .where({id})
            .delete()
    },
    updateStory(knex, id, newStoryFields) {
        return knex('story_bits_stories')
            .where({id})
            .update(newStoryFields)
    }
}

module.exports = StoriesService