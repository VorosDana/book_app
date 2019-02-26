'use strict';

// Application Dependencies
const express = require('express');
const superagent = require('superagent');

// Application Setup
const app = express();
const PORT = process.env.PORT || 4000;

// Application Middleware
app.use(express.urlencoded({ extended: true }));

// Set the file locations for ejs templates and static files like CSS
app.set('view engine', 'ejs');
app.use(express.static('./public'));

// API Routes
// Renders the search form
app.get('/', newSearch);

// Creates a new search to the Google Books API
app.post('/searches', createSearch);

// Catch-all
app.get('*', (request, response) => response.render('pages/error', { err: 404, errType: 'Bad Route', msg: 'This Route does not exist' }));

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

// HELPER FUNCTIONS
function Book(info) {
  const placeHolder = 'https://i.imgur.com/J5LVHEL.jpg';
  this.picture = info.imageLinks.smallThumbnail || placeHolder;
  this.mouseover = info.imageLinks.thumbnail || placeHolder;
  this.title = info.title || 'No Title Avaialble';
  this.authors = info.authors;
  this.description = info.description;
  this.link = info.infoLink;
}

// Note that .ejs file extension is not required
function newSearch(request, response) {
  response.render('pages/index'); //location for ejs files
  app.use(express.static('./public'));//location for other files like css
}

// No API key required
function createSearch(request, response) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  console.log(request.body)
  console.log(request.body.search)

  if (request.body.search[1] === 'title') { url += `+intitle:${request.body.search[0]}`; }
  if (request.body.search[1] === 'author') { url += `+inauthor:${request.body.search[0]}`; }

  console.log(url);

  superagent.get(url)
    .then(apiResponse => {
      if (apiResponse.body.totalItems > 0) {
      apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo))
      } else {
        response.render('pages/error', { err: 400, errType: 'Bad Request, Buddy', msg: `No results found for ${request.body.search[1]}: ${request.body.search[0]}` })
      }
    })
    .then(results => response.render('pages/searches/show', { searchResults: results }));

  // how will we handle errors?
}

function handleErrors(request, response) {
  response.render('pages/error', { err: 500, errType: 'Internal Server Error', msg: 'Something has gone wrong' } );
}
