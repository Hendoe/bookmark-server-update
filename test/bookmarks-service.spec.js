require('dotenv').config();
const config = require('../src/config');
const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray } = require('./bookmarks-fixtures')


describe.only('Bookmarks Endpoints', function () {
    let db
    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })
    after('disconnect from db', () => db.destroy())
    before('clean the table', () => db('bookmark_table').truncate())
    afterEach('cleanup', () => db('bookmark_table').truncate())
    describe(`GET /bookmarks`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', config.API_TOKEN)
                    .expect(200, [])
            })
        })
        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray()
            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmark_table')
                    .insert(testBookmarks)
            })
            it('responds with 200 and all of the bookmarks', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', config.API_TOKEN)
                    .expect(200, testBookmarks)
            });
        });
    });
    // describe(`GET /bookmarks/:bookmark_id`, () => {
    //     context('Given there are bookmarks in the database', () => {
    //         const testBookmarks = makeBookmarksArray()
    //         beforeEach('insert bookmarks', () => {
    //             return db
    //                 .into('bookmark_table')
    //                 .insert(testBookmarks)
    //         })
    //         it('responds with 200 and the specified bookmark', () => {
    //             const bookmarkId = 2
    //             const expectedBookmark = testBookmarks[bookmarkId - 1]
    //             return supertest(app)
    //                 .get(`/bookmarks/${bookmarkId}`)
    //                 .expect(200, expectedBookmark)
    //         });
    //     });
    // });
});