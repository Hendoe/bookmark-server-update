require('dotenv').config();
const config = require('../src/config');
const knex = require('knex');
const app = require('../src/app');
const { makeBookmarksArray } = require('./bookmarks-fixtures');
const supertest = require('supertest');
const { expect } = require('chai');


describe.only('Bookmarks Endpoints', function () {
  let db;
  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });
  after('disconnect from db', () => db.destroy());
  before('clean the table', () => db('bookmark_table').truncate());
  afterEach('cleanup', () => db('bookmark_table').truncate());
  describe(`GET /api/bookmarks`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set('Authorization', config.API_TOKEN)
          .expect(200, []);
      });
    });
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();
      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmark_table')
          .insert(testBookmarks);
      });
      it('responds with 200 and all of the bookmarks', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set('Authorization', config.API_TOKEN)
          .expect(200, testBookmarks);
      });
    });
  });
  describe(`GET /api/bookmarks/:bookmark_id`, () => {
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();
      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmark_table')
          .insert(testBookmarks);
      });
      it('responds with 200 and the specified bookmark', () => {
        const bookmarkId = 2;
        const expectedBookmark = testBookmarks[bookmarkId - 1];
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', config.API_TOKEN)
          .expect(200, expectedBookmark);
      });
    });
  });
  describe(`POST /api/bookmarks`, () => {
    it(`creates an bookmark, responding with 201 and the new bookmark`, function () {
      const newBookmark = {
        title: 'Test title',
        url: 'http://www.test.com',
        description: 'test content',
        rating: 5
      };
      return supertest(app)
        .post('/api/bookmarks')
        .set('Authorization', config.API_TOKEN)
        .send(newBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.description).to.eql(newBookmark.description);
          expect(res.body.rating).to.eql(newBookmark.rating);
          expect(res.body).to.have.property('id');
          expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`);
        })
        .then(postRes =>
          supertest(app)
            .get(`/api/bookmarks/${postRes.body.id}`)
            .set('Authorization', config.API_TOKEN)
            .expect(postRes.body)
        );
    });
  });

  describe(`DELETE /api/bookmarks/:bookmark_id`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 123456;
        return supertest(app)
          .delete(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', config.API_TOKEN)
          .expect(404, { error: { message: `Bookmark doesn't exist` } });
      });
    });
  });

  describe(`PATCH /api/bookmarks/:bookmark_id`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 123456;
        return supertest(app)
          .patch(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', config.API_TOKEN)
          .expect(404, { error: { message: `Bookmark doesn't exist` } });
      });
    });
  });

  context(`Given there are bookmarks in the database`, () => {
    const testBookmarks = makeBookmarksArray();

    beforeEach('insert bookmarks', () => {
      return db
        .into('bookmark_table')
        .insert(testBookmarks);
    });

    it('respond with 204 and updates the bookmark', () => {
      const idToUpdate = 2;
      const updateBookmark = {
        title: 'Test title',
        url: 'http://www.test.com',
        description: 'test content',
        rating: 5
      };
      const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updateBookmark
      }
      return supertest(app)
        .patch(`/api/bookmarks/${idToUpdate}`)
        .set('Authorization', config.API_TOKEN)
        .send(updateBookmark)
        .expect(204)
        .then(res =>
            supertest(app)
            .get(`/api/bookmarks/${idToUpdate}`)
            .set('Authorization', config.API_TOKEN)
            .expect(expectedBookmark)
            )
    })

    it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2;
        return supertest(app)
            .patch(`/api/bookmarks/${idToUpdate}`)
            .set('Authorization', config.API_TOKEN)
            .send({ irrelevantField: 'foo' })
            .expect(400, {
                error: {
                    message: `Request body must contain either 'title', 'url', 'description' or 'rating'`
                }
            })
    })

    it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2;
        const updateBookmark = {
            title: 'updated bookmark title',
        }
        const expectedBookmark = {
            ...testBookmarks[idToUpdate - 1],
            ...updateBookmark
        }

        return supertest(app)
            .patch(`/api/bookmarks/${idToUpdate}`)
            .set('Authorization', config.API_TOKEN)
            .send({
                ...updateBookmark,
                fieldToIgnore: 'should not be in GET response'
            })
            .expect(204)
            .then(res => 
                supertest(app)
                    .get(`/api/bookmarks/${idToUpdate}`)
                    .set('Authorization', config.API_TOKEN)
                    .expect(expectedBookmark))
    })
  });

});