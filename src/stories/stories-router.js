const path = require('path')
const express = require('express');
const xss = require('xss')
const { v4: uuid } = require('uuid');
const storiesRouter = express.Router();
const bodyParser = express.json();
const StoriesService = require('./stories-service.js');
const jsonParser = express.json()

storiesRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')

        // const {user_id} = req.params;

        // // if (user_id) {
        // //     StoriesService.getStoriesByUser(knexInstance, user_id)
        // //     .then(stories => {
        // //         res.json(stories)
        // //     })
        // //     .catch(next)
        // // } else {
            
        // // }

        StoriesService.getAllStories(knexInstance)
            .then(stories => {
                res.json(stories)
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const {title, description, user_id} = req.body
        const newStory = {title, description, user_id}

        for (const [key, value] of Object.entries(newStory)) {
            if (value == null) {
                return res.status(400).json({
                    error: { message: `Missing ${key} in request` }
                })
            }
        }

        StoriesService.insertStory(
            req.app.get('db'),
            newStory
        )
            .then(story => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${story.id}`))
                    .json({
                        id: story.id,
                        user_id: story.user_id,
                        title: xss(story.title),
                        description: xss(story.description)
                    })
            })
            .catch(next)
    })

storiesRouter
    .route('/:id')
    .all((req, res, next) => {
        const {id} = req.params;
        const knexInstance = req.app.get('db')
        StoriesService.getById(knexInstance, id)
            .then(story => {
                if(!story) {
                    return res.status(404).json({
                        error: { message: `Story doesn't exist` }
                    })
                }
                res.story = story // store the story for the next middleware
                next()
            })
    })
    .get((req, res, next) => {
        res.json({
            id: res.story.id,
            title: xss(res.story.title),
            description: xss(res.story.description),
            user_id: res.story.user_id
        })
    })
    .delete((req, res, next) => {
        StoriesService.deleteStory(
            req.app.get('db'),
            req.params.id
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const {title, description} = req.body
        const storyToUpdate = {title, description}

        const numOfValues = Object.values(storyToUpdate).filter(Boolean).length
        if(numOfValues === 0)
            return res.status(400).json({
                error: {
                    message: `Request body must contain either title or description`
                }
            })

        StoriesService.updateStory(
            req.app.get('db'),
            req.params.id,
            storyToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = storiesRouter