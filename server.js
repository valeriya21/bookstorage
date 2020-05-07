if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
} 

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
var allBooks = require('./books.json')

var PORT = process.env.PORT || 3000

const initializePassport = require('./passport-config')
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)

const users = []

app.set('view-engine', 'pug')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize()) 
app.use(passport.session())
app.use(methodOverride('_method'))


app.get('/', checkAuthenticated, (req, res) => {
  res.render('index.pug', { name: req.user.name, allBooks: allBooks})
  console.log(users)
})

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.pug')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))  

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.pug')
})

app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    })
    res.redirect('/login')
  } catch {
    res.redirect('/register')
  }
})

app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/login')
})

app.get('/add_book', checkAuthenticated, (req, res) => {
  res.render('addBook.pug',  {users: users})
})

app.delete('/delete_book', checkAuthenticated, (req, res) => {
  for (let i in allBooks){
    if (allBooks[i].bookName == req.body.deleteBook){
      allBooks.splice(i, 1)
    }
  }
  res.redirect('/')
})

app.post('/add_book', checkAuthenticated, (req, res) => {
  allBooks.push({
    bookName: req.body.name,
    bookAuthor: req.body.author,
    bookGenre: req.body.genre,
    isInLibrary: req.body.inLibrary,
    givenTo: req.body.users,
    dateToReturn : req.body.returnDate
  })
  res.redirect('/')  
}) 

app.get('/book/:bookName', checkAuthenticated, (req, res) => {
  allBooks.forEach(book => {
    if (book.bookName === req.params.bookName){
      res.render('books.pug', {book : book, users : users})
    }
  })  
}) 
app.put('/book/:bookName', checkAuthenticated, (req, res) => {
  let old_bookName = req.params.bookName
  for (let i in allBooks){
    if (allBooks[i].bookName === old_bookName){
      allBooks[i].bookAuthor = req.body.author
      allBooks[i].bookGenre = req.body.genre
      allBooks[i].isInLibrary = req.body.inLibrary
      allBooks[i].givenTo = req.body.users
      allBooks[i].dateToReturn = req.body.returnDate
    }
  }
  console.log(allBooks)
  res.redirect('/')
})


function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

app.listen(PORT)
