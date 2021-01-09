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
        const {story_id} = req.query

        if(story_id) {
            CharactersService.getByStoryId(knexInstance, story_id)
                .then(chars => {
                    res.json(chars)
                }).catch(next)
        } else if (!story_id) {
            CharactersService.getAllCharacters(knexInstance)
                .then(chars => {
                    res.json(chars)
                })
                .catch(next)
        }

    })
    .post(jsonParser, (req, res, next) => {
        const {story_id, name, description, gender, appearance, fashion, age, room_decor} = req.body
        const newCharacter = {story_id, name}
        const requiredFields = Object.entries(newCharacter)

        for (const [key, value] of requiredFields) {
            if (value == null) {
                return res.status(400).json({
                    error: { message: `Missing ${key} in request` }
                })
            }
        }

        newCharacter.description = description
        newCharacter.gender = gender
        newCharacter.appearance = appearance
        newCharacter.fashion = fashion
        newCharacter.age = age
        newCharacter.room_decor = room_decor

        CharactersService.insertCharacter(
            req.app.get('db'),
            newCharacter
        )
            .then(char => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${char.id}`))
                    .json({
                        id: char.id,
                        story_id: char.story_id,
                        name: xss(char.name),
                        description: xss(char.description),
                        gender: xss(char.gender),
                        appearance: xss(char.appearance),
                        fashion: xss(char.fashion),
                        age: xss(char.age),
                        room_decor: xss(char.room_decor)
                    })
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
    .delete((req, res, next) => {
        CharactersService.deleteCharacter(
            req.app.get('db'),
            req.params.id
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const {story_id, name, description, gender, appearance, fashion, age, room_decor} = req.body
        const characterToUpdate = {story_id, name, description, gender, appearance, fashion, age, room_decor}

        const numOfValues = Object.values(characterToUpdate).filter(Boolean).length
        if(numOfValues === 0)
            return res.status(400).json({
                error: {
                    message: `Request body must contain one of the following fields:
                    story_id, name, description, gender, appearance, fashion, age, room_decor`
                }
            })

        CharactersService.updateCharacter(
            req.app.get('db'),
            req.params.id,
            characterToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = charactersRouter