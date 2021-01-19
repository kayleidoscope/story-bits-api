# Story Bits API

Used in conjunction with the Story Bits app, this API provides the functionality for finding, creating, deleting, and editing stories, characters, and settings.

You can also view the (live site)[https://story-bits-app.vercel.app/] or visit the [frontend repo](https://github.com/kayleidoscope/story-bits-app).

This API is CORS compatible.

## Endpoints

### /users

Route | Request | Body | Result
----- | ------- | ------ | ------
/users | GET | | returns all users
/users | POST | username | creates a new user
/users/:id | GET | | returns the user with that ID
/users/:id | DELETE | | deletes the user with that ID
/users/:id | PATCH | | updates a user's username

### /stories

An asterisk (*) indicates a required parameter.

Route | Request | Body | Query params | Result
----- | ------- | ---- | ------ | ------
/stories | GET | | | returns all stories
/stories | GET | | user_id | returns all stories by that user
/stories | POST | *title, *description, *user_id | | creates a new story
/stories/:id | GET | | | returns the story with that ID
/stories/:id | DELETE | | | deletes the story with that ID
/stories/:id | PATCH | *one of the following: title, description, user_id | | updates a story

## /characters

An asterisk (*) indicates a required parameter.

Route | Request | Body | Query params | Result
----- | ------- | ---- | ------------ | ------
/characters | GET | | | returns all characters
/characters | GET | | story_id | returns all characters in that story
/characters | POST | *story_id, *name, *description, gender, appearance, fashion, age, room_decor, motivation, pronouns, history, pets, mannerisms | | creates a new character
/characters/:id | GET | | | returns the character with that ID
/characters/:id | DELETE | | | deletes the character with that ID
/characters/:id | PATCH | *at least one of the following: story_id, name, description, gender, appearance, fashion, age, room_decor, motivation, pronouns, history, pets, mannerisms | | updates a character

Query param | Type
----------- | ----
story_id | number
name | string
description | string
gender | string
appearance | string
fashion | string
age | string
room_decor | string
motivation | string
pronouns | string
history | string
pets | string
mannerisms | string

## /settings

An asterisk (*) indicates a required parameter.

Route | Request | Body | Query params | Result
----- | ------- | ---- | ------------ | ------
/settings | GET | | | returns all settings
/settings | GET | | story_id | returns settings for that story
/settings | POST | *story_id, *name, *description, decor, is_residence | | creates a new setting
/settings/:id | GET | | | returns the setting with that ID
/settings/:id | DELETE | | | deletes the setting with that ID
/settings/:id | PATCH | *at least one of the following: story_id, name, description, decor, is_residence | updates a setting

Query param | type
----------- | ----
story_id | number
name | string
description | string
decor | string
is_residence | boolean

## Tech Stack

* Javascript
* React
* Node.js
* Postgres
* HTML
* CSS