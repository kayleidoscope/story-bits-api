const SettingsService = {
    getAllSettings(knex) {
        return knex.select('*').from('story_bits_settings')
    },
    insertSetting(knex, newSetting) {
        return knex
            .insert(newSetting)
            .into('story_bits_settings')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex
            .select('*')
            .from('story_bits_settings')
            .where({id})
            .first()
    },
    deleteSetting(knex, id) {
        return knex('story_bits_settings')
            .where({id})
            .delete()
    },
    updateSetting(knex, id, newSettingFields) {
        return knex('story_bits_settings')
            .where({id})
            .update(newSettingFields)
    }
}

module.exports = SettingsService