const CharactersService = {
    getAllCharacters(knex) {
        return knex.select('*').from('story_bits_characters')
    }
}

module.exports = CharactersService