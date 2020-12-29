const path = require('path')
const express = require('express');
const xss = require('xss')
const { v4: uuid } = require('uuid');
const settingsRouter = express.Router();
const bodyParser = express.json();
const SettingsService = require('./settings-service.js');
const jsonParser = express.json()

settingsRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')

        SettingsService.getAllSettings(knexInstance)
            .then(settings => {
                res.json(settings)
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const {story_id, name, isresidence, decor} = req.body
        const newSetting = {story_id, name}
        const requiredFields = Object.entries(newSetting)

        for (const [key, value] of requiredFields) {
            if (value == null) {
                return res.status(400).json({
                    error: { message: `Missing ${key} in request` }
                })
            }
        }

        newSetting.isresidence = isresidence
        newSetting.decor = decor

        SettingsService.insertSetting(
            req.app.get('db'),
            newSetting
        )
            .then(setting => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${setting.id}`))
                    .json({
                        id: setting.id,
                        story_id: setting.story_id,
                        name: xss(setting.name),
                        isresidence: setting.isresidence,
                        decor: xss(setting.decor)
                    })
            })
            .catch(next)
    })

settingsRouter
    .route('/:id')
    .all((req, res, next) => {
        const {id} = req.params
        const knexInstance = req.app.get('db')

        SettingsService.getById(knexInstance, id)
            .then(setting => {
                if (!setting) {
                    return res.status(404).json({
                        error: {message: `Setting doesn't exist`}
                    })
                }
                res.setting = setting
                next()
            })
    })
    .get((req, res, next) => {
        res.json({
            id: res.setting.id,
            story_id: res.setting.story_id,
            name: xss(res.setting.name),
            isresidence: res.setting.isresidence,
            decor: xss(res.setting.decor)
        })
    })
    .delete((req, res, next) => {
        SettingsService.deleteSetting(
            req.app.get('db'),
            req.params.id
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const {story_id, name, isresidence, decor} = req.body
        const settingToUpdate = {story_id, name, isresidence, decor}

        const numOfValues = Object.values(settingToUpdate).filter(Boolean).length
        if(numOfValues === 0)
            return res.status(400).json({
                error: {
                    message: `Request body must contain one of the following fields:
                    story_id, name, description, gender, appearance, fashion, age, room_decor`
                }
            })

        SettingsService.updateSetting(
            req.app.get('db'),
            req.params.id,
            settingToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = settingsRouter