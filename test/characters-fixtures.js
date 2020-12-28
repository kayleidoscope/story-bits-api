function makeCharactersArray() {
    return [
        {
            id: 1,
            story_id: 1,
            name: 'Lissa',
            age: '15',
            description: 'An insomniac with a wild imagination.',
            gender: 'female',
            appearance: 'White. Slight with dirty brown hair, sharp features, and large glasses',
            fashion: 'Wears a lot of baggy sweaters',
            room_decor: 'Messy with shelves and shelves of books and knick-knacks'
        },
        {
            id: 2,
            story_id: 2,
            name: 'Zoe',
            age: '32',
            description: `Fierce, bold, and guarded. Doesn't trust easily`,
            gender: 'female',
            appearance: 'Black, with dark skin, an afro and a round face',
            fashion: 'Varies wildly between swearshirts and crop tops',
            room_decor: 'Stylishly decorated and peaceful. Her safe haven.'
        },
        {
            id: 3,
            story_id: 2,
            name: 'Gem',
            age: '35',
            description: `Seemingly open and carefree, but keeps their feelings close to their chest`,
            gender: 'genderqueer',
            appearance: 'Tan skin, short dark hair, and a round face too',
            fashion: 'Prefers jeans, t-shirts, comfortable casual clothes',
            room_decor: 'Collects a lot of rocks. Has shelves and shalves of journals. Their safe haven'
        },
        {
            id: 4,
            story_id: 3,
            name: 'Cynthia',
            age: '24',
            description: `Loves adventure but doesn't lead the kind of life that means she finds it`,
            gender: 'female',
            appearance: 'Pale skin, long straight brown hair parted down the middle. Big eyes',
            fashion: 'Tends to wear dresses, skirts, blouses. Is the kind of person to dress up for no reason.',
            room_decor: ''
        },
    ]
}

module.exports = {
    makeCharactersArray
}