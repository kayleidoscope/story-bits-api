require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const logger = require('./logger')
const { NODE_ENV } = require('./config')
const { restart } = require('nodemon')
const usersRouter = require('./users/users-router')
const storiesRouter = require('./stories/stories-router')
const charactersRouter = require('./characters/characters-router')
const settingsRouter = require('./settings/settings-router')
const residencesRouter = require('./residences/residences-router')

const app = express()

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())
app.use(express.json())

app.use('/api/users', usersRouter)
app.use('/api/stories', storiesRouter)
app.use('/api/characters', charactersRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/residences', residencesRouter)

app.get('/', (req, res) => {
    res.send('Hello, world!')
})

app.use(function errorHandler(error, req, res, next) {
    let response
    logger.error(error)
    // if (NODE_ENV === 'production') {
    //     response = { error: { message: 'server error' } }
    // } else {
        response = { message: error.message, error }
    // }
    res.status(500).json(response)
})

module.exports = app