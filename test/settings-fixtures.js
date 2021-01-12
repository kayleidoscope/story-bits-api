function makeSettingsArray() {
    return [
        {
            id: 1,
            name: 'The portal',
            story_id: 1,
            is_residence: false,
            decor: 'A hole at the base of a tree in a forest of trees with holes at the base',
            description: 'A normal tree in a normal forest'
        },
        {
            id: 2,
            name: 'The coffeeshop',
            story_id: 2,
            is_residence: true,
            decor: 'Walls are painted red. Local art hangs on the walls',
            description: 'A normal coffeeshop. Has apartments upstairs'
        },
        {
            id: 3,
            name: 'The dance hall',
            story_id: 3,
            is_residence: true,
            decor: 'Regal',
            description: 'People meet here for monthly balls'
        }
    ]
}

module.exports = {
    makeSettingsArray
}