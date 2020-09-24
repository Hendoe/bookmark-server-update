module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_URL: process.env.DB_URL || 'postgresql://dunder_mifflin@localhost/bookmarks',
  TEST_DB_URL: process.env.TEST_DB_URL || 'postgresql://dunder_mifflin@localhost/bookmarks-test',
  API_TOKEN: 'bearer c8f2fd86-47e9-4f8f-802c-5662346fd682'
};