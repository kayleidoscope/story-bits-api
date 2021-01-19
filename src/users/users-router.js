const path = require('path')
const express = require('express');
const xss = require('xss')
const { v4: uuid } = require('uuid');
const usersRouter = express.Router();
const bodyParser = express.json();
const UsersService = require('./users-service.js');
const jsonParser = express.json()

usersRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        UsersService.getAllUsers(knexInstance)
            .then(users => {
                res.json(users)
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const {username} = req.body
        const newUser = {username}

        if (!username) {
            return res.status(400).json({
                error: {message: 'You must provide a username'}
            })
        }

        UsersService.insertUser(
            req.app.get('db'),
            newUser
        )
            .then(user => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${user.id}`))
                    .json({
                        id: user.id,
                        username: xss(user.username),
                        acct_created: user.acct_created
                    })
            })
            .catch(next)
    })

usersRouter
    .route('/:id')
    .all((req, res, next) => {
        const {id} = req.params;
        const knexInstance = req.app.get('db')
        UsersService.getById(knexInstance, id)
            .then(user => {
                if(!user) {
                    return res.status(404).json({
                        error: {message: `User doesn't exist`}
                    })
                }
                res.user = user //save the user for the next middleware
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json({
            id: res.user.id,
            username: xss(res.user.username),
            acct_created: res.user.acct_created
        })
    })
    .delete((req, res, next) => {
        UsersService.deleteUser(
            req.app.get('db'),
            req.params.id
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const {username} = req.body
        const userToUpdate = {username}

        if(!username) {
            return res.status(400).json({
                error: {
                    message: `You must provide a new username to change your username`
                }
            })
        }

        UsersService.updateUser(
            req.app.get('db'),
            req.params.id,
            userToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = usersRouter