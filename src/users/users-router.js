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

module.exports = usersRouter