const express = require('express')
const axios = require('axios')
const cors = require('cors')
const bodyParser = require('body-parser')
const { google } = require('googleapis')
const {
  dbConnect,
  dbInsert,
  dbFind,
  dbFindByObjectId,
  dbFindOneAndUpdate,
  dbFindOneByObjectIdAndUpdate,
  dbFindOneByObjectIdAndDelete,
  dbFindManyAndRemoveField
} = require('./db.js')

require('dotenv').config()

const bcryptjs = require('bcryptjs')
const generateReccurentTrainingScheduleByDaysOfTheWeek = require('./utils/generateReccurentTrainingScheduleByDaysOfTheWeek')

const app = express()

app.use(cors())

app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT)

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true)

  // Pass to next layer of middleware
  next()
})

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_AUTH_CLIENT_ID,
  process.env.GOOGLE_AUTH_CLIENT_SECRET,
  process.env.GOOGLE_AUTH_REDIRECT_URI
)

dbConnect()

app.get('/init', (_, res) => {
  try {
    res.send('Connected to API!')
  } catch (err) {
    res.send(err)
  }
})

app.post('/oauth/google', async (req, res) => {
  try {
    const { tokens: { access_token, id_token } } = await oauth2Client.getToken(req.body.code)

    const { data } = await axios.get(
      process.env.GOOGLE_AUTH_TOKEN_REQUEST_URL,
      {
        params: {
          alt: 'json',
          access_token
        }
      },
      { headers: { Authorization: `Bearer ${id_token}` } }
    )

    res.send(data)

  } catch (err) {
    res.send(err)
  }
})

app.post('/auth/register', async ({ body }, res) => {
  const data = await dbFind('users', { login: body.login })

  if (data.length) res.sendStatus(409) // login already exists
  else {
    const salt = await bcryptjs.genSalt(10)
    body.hashed = await bcryptjs.hash(body.password, salt)
  
    delete body.password
  
    const { insertedId } = await dbInsert('users', body)
    res.send(insertedId)
  }
})

app.post('/auth/login', async ({ body: { login, password } }, res) => {
  const data = await dbFind('users', { login })
  if (data.length) {
    const [{ _id: id, name, hashed }] = data
    const isSuccess = await bcryptjs.compare(password, hashed)
    if (isSuccess) {
      res.send({
        id,
        name
      })
    } else res.sendStatus(401)
  } else {
    res.sendStatus(401)
  }
})

app.post('/user/create', async ({ body }, res) => {
  const { insertedId } = await dbInsert('users', body)
  res.send(insertedId)
})

app.get('/user/get', async ({ query: { id, googleId } }, res) => {
  try {
    let result = null

    if (id) result = await dbFindByObjectId('users', id)

    if (googleId) result = await dbFind('users', { googleId })

    res.send(result && result[0])
  } catch (err) {
    throw err
  }
})

app.post('/user/update-user-trainer-id', async ({ body: { id, trainerId } }, res) => {
  const result = await dbFindOneAndUpdate('users', { id }, { trainerId })

  res.send(result)
})

app.put('/user', async ({ body: { id, ...rest } }, res) => {
  const result = await dbFindOneByObjectIdAndUpdate('users', id, rest)

  res.send(result)
})

app.get('/trainees', async ({ query }, res) => {
  const result = await dbFind('users', query)

  res.send(result)
})

app.delete('/trainee', async ({ query: { id } }, res) => {
  const result = await dbFindOneByObjectIdAndDelete('users', id)

  res.send(result)
})

app.post('/training-schedule', async ({ body }, res) => {
  const { startFromDate, schedule, duration } = body

  body.schedule = generateReccurentTrainingScheduleByDaysOfTheWeek(startFromDate, schedule, duration)

  body.scheduleDOW = schedule

  const { insertedId } = await dbInsert('training-schedules', body)

  res.send(insertedId)
})

app.put('/training-schedule', async ({ body: { id, ...rest } }, res) => {
  const { startFromDate, schedule, duration } = rest

  rest.schedule = generateReccurentTrainingScheduleByDaysOfTheWeek(startFromDate, schedule, duration)
  rest.scheduleDOW = schedule

  const result = await dbFindOneByObjectIdAndUpdate('training-schedules', id, rest)

  res.send(result)
})

app.get('/training-schedules', async ({ query: { traineeId } }, res) => {
  const result = await dbFind('training-schedules', { traineeId })

  res.send(result)
})

app.delete('/training-schedule', async ({ query: { id } }, res) => {
  const result = await dbFindOneByObjectIdAndDelete('training-schedules', id)

  res.send(result)
})

app.get('/exercises', async ({ query: { trainerId } }, res) => {
  const result = await dbFind('exercises', { trainerId })

  res.send(result)
})

app.post('/exercise', async ({ body }, res) => {
  const { insertedId } = await dbInsert('exercises', body)

  res.send(insertedId)
})

app.put('/exercise', async ({ body: { id, ...rest } }, res) => {
  const result = await dbFindOneByObjectIdAndUpdate('exercises', id, rest)

  res.send(result)
})

app.delete('/exercise', async ({ query: { id } }, res) => {
  const result = await dbFindOneByObjectIdAndDelete('exercises', id)

  res.send(result)
})

app.get('/clubs', async ({ query: { trainerId } }, res) => {
  const result = await dbFind('clubs', { trainerId })

  res.send(result)
})

app.post('/club', async ({ body }, res) => {
  const { insertedId } = await dbInsert('clubs', body)

  res.send(insertedId)
})

app.put('/club', async ({ body: { id, ...rest } }, res) => {
  const result = await dbFindOneByObjectIdAndUpdate('clubs', id, rest)

  res.send(result)
})

app.delete('/club', async ({ query: { club, trainerId } }, res) => {
  await dbFindOneByObjectIdAndDelete('clubs', club)
  await dbFindManyAndRemoveField('users', { club, trainerId }, 'club')

  res.sendStatus(204)
})

app.get('/weights', async ({ query: { traineeId } }, res) => {
  const result = await dbFind('weights', { traineeId }, { sort: { date: 1 } })

  res.send(result)
})

app.post('/weight', async ({ body }, res) => {
  const { insertedId } = await dbInsert('weights', body)

  res.send(insertedId)
})

app.put('/weight', async ({ body: { id, ...rest } }, res) => {
  const result = await dbFindOneByObjectIdAndUpdate('weights', id, rest)

  res.send(result)
})

app.delete('/weight', async ({ query: { id } }, res) => {
  const result = await dbFindOneByObjectIdAndDelete('weights', id)

  res.send(result)
})

const port = 3000 || process.env.PORT

app.listen(port, () => {
  console.log(`Server listens on port ${port}`)
})