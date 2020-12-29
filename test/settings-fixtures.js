function makeSettingsArray() {
    return [
        {
            id: 1,
            name: 'The portal',
            story_id: 1,
            isresidence: false,
            decor: 'A hole at the base of a tree in a forest of trees with holes at the base'
        },
        {
            id: 2,
            name: 'The coffeeshop',
            story_id: 2,
            isresidence: true,
            decor: 'A normal coffeeshop. Has apartments upstairs.'
        },
        {
            id: 3,
            name: 'The dance hall',
            story_id: 3,
            isresidence: false,
            decor: 'Regal'
        }
    ]
}

module.exports = {
    makeSettingsArray
}