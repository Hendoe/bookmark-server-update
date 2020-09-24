const express = require('express');
const { v4: uuid } = require('uuid');
const bookmarkRouter = express.Router();
const logger = require('./logger');
const bookmarks = require('./store');
const ArticlesService = require('./articles-service');

const bodyParser = express.json();

bookmarkRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.get('db')
    ArticlesService.getAllArticles(knexInstance)
      .then(bookmarks => {
        res.json(bookmarks)
      })
      .catch(next)
  })
  .post(bodyParser, (req, res) => {
    const { title, url, content = " ", rating = "" } = req.body;

    if (!title) {
      logger.error(`Title is required`);
      return res
        .status(400)
        .send('Invalid data');
    }

    if (!url) {
      logger.error('url is required');
      return res
        .status(400)
        .send('Invalid data');
    }

    // get an id
    const id = uuid();

    const bookmark = {
      id,
      title,
      url,
      content,
      rating
    };

    bookmarks.push(bookmark);
    logger.info(`Bookmark with id ${id} created`);

    res
      .status(201)
      .location(`http://localhost:8000/anything/${id}`)
      .json(bookmark);
  });

bookmarkRouter
  .route('/:id')
  .get((req, res) => {
    const { id } = req.params;

    const bookmarkIndex = bookmarks.findIndex(c => c.id == id);

    console.log("This is the index of the bookmark", bookmarkIndex); 

    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res
        .status(404)
        .send('Not found');
    }

    //res.send('we found it');
    res.json(bookmarks[bookmarkIndex]);

  })
  .delete((req, res) => {
    const { id } = req.params;

    const bookmarkIndex = bookmarks.findIndex(c => c.id == id);

    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res
        .status(404)
        .send('Not found');
    }

    bookmarks.splice(bookmarkIndex, 1);

    logger.info(`Bookmark with id ${id} deleted.`);

    res
      .status(204)
      .end();
  });

module.exports = bookmarkRouter;