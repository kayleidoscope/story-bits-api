const SettingsService = {
    getAllSettings(knex) {
        return knex.select('*').from('settings')
    },
    insertSetting(knex, newSetting) {
        return knex
            .insert(newSetting)
            .into('settings')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex
            .select('*')
            .from('settings')
            .where({id})
            .first()
    },
    deleteSetting(knex, id) {
        return knex('settings')
            .where({id})
            .delete()
    },
    updateSetting(knex, id, newSettingFields) {
        return knex('settings')
            .where({id})
            .update(newSettingFields)
    }
}

module.exports = SettingsService