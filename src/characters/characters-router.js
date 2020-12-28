const path = require('path')
const express = require('express');
const xss = require('xss')
const { v4: uuid } = require('uuid');
const charactersRouter = express.Router();
const bodyParser = express.json();
const CharactersService = require('./characters-service.js');
const jsonParser = express.json()

charactersRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')

        CharactersService.getAllCharacters(knexInstance)
            .then(chars => {
                res.json(chars)
            })
            .catch(next)
    })

charactersRouter
    .route('/:id')
    .all((req, res, next) => {
        const {id} = req.params
        const knexInstance = req.app.get('db')

        CharactersService.getById(knexInstance, id)
            .then(char => {
                if (!char) {
                    return res.status(404).json({
                        error: {message: `Character doesn't exist`}
                    })
                }
                res.char = char
                next()
            })
    })
    .get((req, res, next) => {
        res.json({
            id: res.char.id,
            story_id: res.char.story_id,
            name: xss(res.char.name),
            description: xss(res.char.description),
            gender: xss(res.char.gender),
            appearance: xss(res.char.appearance),
            fashion: xss(res.char.fashion),
            age: xss(res.char.age),
            room_decor: xss(res.char.room_decor)
        })
    })

module.exports = charactersRouter