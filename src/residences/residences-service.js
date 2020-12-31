const ResidencesService = {
    getAllResidences(knex) {
        return knex.select('*').from('residences')
    },
    createNewRelationship(knex, newRelationship) {
        return knex
            .insert(newRelationship)
            .into('residences')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getResidentsOf(knex, setting_id) {
        return knex
            .select('*')
            .from('residences')
            .where({setting_id})
    },
    getSetsOf(knex, character_id) {
        return knex
            .select('*')
            .from('residences')
            .where({character_id})
    },
    deleteResFromSet(knex, character_id, setting_id) {
        return knex('residences')
            .where({character_id})
            .where({setting_id})
            .delete()
    },
    updateResidence(knex, character_id, setting_id, new_field) {
        return knex('residences')
            .where({character_id})
            .where({setting_id})
            .update(new_field)
    }
}

module.exports = ResidencesService