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

Route | Request | Body | Params | Result
----- | ------- | ---- | ------ | ------
/stories | GET | | | returns all stories
/stories | GET | | user_id | returns all stories by that user
/stories | POST | *title, *description, *user_id | creates a new story

## Tech Stack

* Javascript
* React
* Node.js
* Postgres
* HTML
* CSS