const path = require('path')
const express = require('express')
const xss = require('xss')
const residencesRouter = express.Router()
const bodyParser = express.json();
const jsonParser = express.json()
const ResidencesService = require('./residences-service')

residencesRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        const {setting_id, character_id} = req.query;

        if(setting_id) {
            ResidencesService.getResidentsOf(knexInstance, setting_id)
                .then(residents => {
                    res.json(residents)
                })
                .catch(next)
        } else if (character_id) {
            ResidencesService.getSetsOf(knexInstance, character_id)
                .then(settings => {
                    res.json(settings)
                })
                .catch(next)
        } else {
            ResidencesService.getAllResidences(knexInstance)
                .then(residences => {
                    res.json(residences)
                })
                .catch(next)
        }
        
        
    })
    .post(jsonParser, (req, res, next) => {
        const {character_id, setting_id} = req.body
        const newRelationship = {character_id, setting_id}

        for (const [key, value] of Object.entries(newRelationship)) {
            if( value == null) {
                return res.status(400).json({
                    error: {message: `Missing ${key} in request`}
                })
            }
        }

        ResidencesService.createNewRelationship(
            req.app.get('db'),
            newRelationship
        )
            .then(residence => {
                res.status(201)
                    .location(path.posix.join(req.originalUrl, `/${newRelationship.id}`))
                    .json({
                        character_id: residence.character_id,
                        setting_id: residence.setting_id
                    })
            })
            .catch(next)
    })

residencesRouter
    .route('/:id')
    .all((req, res, next) => {
        const {id} = req.params
        const knexInstance = req.app.get('db')

        ResidencesService.getByIds(knexInstance, id)
            .then(residence => {
                if(!residence) {
                    return res.status(404).json({
                        error: {message: `Character-setting relationship doesn't exist`}
                    })
                }
                res.residence = residence
                next()
            })
    })
    .get((req, res, next) => {
        res.json({
            id: res.residence.id,
            character_id: res.residence.character_id,
            setting_id: res.residence.setting_id
        })
    })
    .delete((req, res, next) => {
        ResidencesService.deleteResFromSet(
            req.app.get('db'),
            req.params.id
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const {character_id, setting_id} = req.body
        const update = {character_id, setting_id}

        const numOfValues = Object.values(update).filter(Boolean).length
        if(numOfValues === 0)
            return res.status(400).json({
                error: {
                    message: `Request body must contain character_id and/or setting_d`
                }
            })

        ResidencesService.updateResidence(
            req.app.get('db'),
            req.params.id,
            update
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })


module.exports = residencesRouter