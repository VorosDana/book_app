'use strict';

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');

require('dotenv').config();

// Application Setup
const app = express();
const PORT = process.env.PORT || 4000;

// Application Middleware
app.use(express.urlencoded({ extended: true }));

// Database Setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

// Set the file locations for ejs templates and static files like CSS
app.set('view engine', 'ejs');
app.use(express.static('./public'));

// API Routes
// Renders user's personal bookshelf
app.get('/', getBookshelf);

// Renders the search form
app.get('/form', newSearch);

// Creates a new search to the Google Books API
app.post('/searches', createSearch);

app.post('/addToCollection', addToCollection);

// Catch-all
app.get('*', (request, response) => response.render('pages/error', { err: 404, errType: 'Bad Route', msg: 'This Route does not exist' }));

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

// HELPER FUNCTIONS
function Book(info) {
  const placeHolder = 'https://i.imgur.com/J5LVHEL.jpg';
  if (info.imageLinks) {
    this.picture = info.imageLinks.smallThumbnail || placeHolder;
    // this.mouseover = info.imageLinks.thumbnail || placeHolder;
  } else {
    this.picture = placeHolder;
    // this.mouseover = placeHolder;
  }
  this.title = info.title || 'No title available';
  this.authors = info.authors;
  this.isbn = info.industryIdentifiers ? `${info.industryIdentifiers[0].type} ${info.industryIdentifiers[0].identifier}` : 'No ISBN available';
  this.description = info.description || 'No description available';
  this.link = info.infoLink;
  // this.bookshelf = user input;
}

// Note that .ejs file extension is not required
function getBookshelf(request, response) {
  client.query(`SELECT * FROM books`)
    .then(books => (response.render('pages/index', { searchResults: books.rows })));
  app.use(express.static('./public'));

}

function newSearch(request, response) {
  response.render('pages/form'); //location for ejs files
  app.use(express.static('./public'));//location for other files like css
}

// No API key required
function createSearch(request, response) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  console.log(request.body);
  console.log(request.body.search);

  if (request.body.search[1] === 'title') { url += `+intitle:${request.body.search[0]}`; }
  if (request.body.search[1] === 'author') { url += `+inauthor:${request.body.search[0]}`; }

  console.log(url);

  superagent.get(url)
    .then(apiResponse => {
      if (apiResponse.body.totalItems > 0) {
        return apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo));
      } else {
        response.render('pages/error', { err: 400, errType: 'Bad Request, Buddy', msg: `No results found for ${request.body.search[1]}: ${request.body.search[0]}` })
      }
    })
    .then(results => response.render('pages/searches/show', { searchResults: results }))
    .catch('err', handleErrors);

  // how will we handle errors?
}

function addToCollection(request, response) {
  const SQL = 'INSERT INTO books (author, title, isbn, image_url, description, bookshelf) VALUES ($1, $2, $3, $4, $5, $6)'
  const values = [request.body.author, request.body.title, request.body.isbn, request.body.image_url, request.body.description, request.body.bookshelf]

  client.query(SQL, values)
    .then(client.query(`SELECT * FROM books`))
    .then((books) => { response.render('pages/index', { searchResults: books.rows }) });
  app.use(express.static('./public'));//location for other files like css
}

function bookDetails(request, response) {
  const SQL = 'SELECT * FROM books WHERE ID=$1';
  const value = [request.params.id];

  client.query(SQL, value)
    .then(book => {
      if (book.rows.length > 0) {
        response.render('pages/details', { book: book.rows[0] });
      } else {
        response.render('pages/error', { err: 400, errType: 'Bad Request', msg: 'Book not found'})
      }
    }
    )
}

function handleErrors(err, request, response) {
  response.render('pages/error', { err: 500, errType: 'Internal Server Error', msg: 'Something has gone wrong' });
}
