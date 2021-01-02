const ResidencesService = {
    getAllResidences(knex) {
        return knex.select('*').from('residences')
    },
    getByIds(knex, id) {
        return knex
            .from('residences')
            .select('*')
            .where('id', id)
            .first()
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
    deleteResFromSet(knex, id) {
        return knex('residences')
            .where({id})
            .delete()
    },
    updateResidence(knex, id, new_field) {
        return knex('residences')
            .where({id})
            .update(new_field)
    }
}

module.exports = ResidencesService