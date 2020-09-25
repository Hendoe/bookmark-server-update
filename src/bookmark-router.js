require('dotenv').config();
const express = require('express');
const { v4: uuid } = require('uuid');
const bookmarkRouter = express.Router();
const logger = require('./logger');
const bookmarks = require('./store');
const BookmarksService = require('./bookmarks-service');
const bodyParser = express.json();
const xss = require('xss');

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
  rating: Number(bookmark.rating),
})

bookmarkRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db')
    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmarks => {
        res.json(bookmarks.map(serializeBookmark))
      })
      .catch(next)
  })
  .post(bodyParser, (req, res, next) => {
      const { title, url, description, rating } = req.body
      const newBookmark = { title, url, description, rating }
      BookmarksService.insertBookmark(
        req.app.get('db'),
        newBookmark
      )
        .then(bookmark => {
          res
            .status(201)
            .location(`/bookmarks/${bookmark.id}`)
            .json(bookmark)
        })
        .catch(next)
    })


bookmarkRouter
  .route('/:bookmark_id')
  .all((req, res, next) => {
    BookmarksService.getById(
      req.app.get('db'),
      req.params.bookmark_id
    )
      .then(bookmark => {
        if (!bookmark) {
          return res.status(404).json({
            error: { message: `Bookmark doesn't exist` }
          })
        }
        res.bookmark = bookmark
        next()
      })
      .catch(next)
  })
  .get((req, res) => {
    res.json(serializeBookmark(res.bookmark))
  })
  .delete((req, res, next) => {
    const { bookmark_id } = req.params;
    BookmarksService.deleteBookmark(
      req.app.get('db'),
      bookmark_id
    )
    .then(numRowsAffected => {
      logger.info(`Bookmark with id ${bookmark_id} deleted.`)
      res.status(204).end()
    })
    .catch(next)
  })

module.exports = bookmarkRouter;