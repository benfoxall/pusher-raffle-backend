require('dotenv').config({silent: true})

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express()

const Pusher = require('pusher')
const pusher = new Pusher({
  appId:   process.env.PUSHER_APP_ID,
  key:     process.env.PUSHER_KEY,
  secret:  process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER
})


// app.get('/', (req, res) => {
//   res.send('raffle backend')
// })

app.use(express.static(__dirname + '/public'));


app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))

app.post('/pusher/auth', (req, res) => {
  const socket_id     = req.body.socket_id
  const channel_name  = req.body.channel_name
  if(socket_id && channel_name) {
    res.send(pusher.authenticate(
      socket_id,
      channel_name,
      {user_id: socket_id, user_info: {}}
    ))
  } else {
    res.sendStatus(401)
  }
})

function pickUser(channel){
  return new Promise((resolve, reject) => {
    pusher.get(
      { path: `/channels/${channel}/users` },
      (error, request, response) => {
      if (response.statusCode === 200) {
        const result = JSON.parse(response.body)
        const users = result.users
        return resolve(users[Math.floor(Math.random()*users.length)])
      }

      reject(error || response.statusCode)
    })
  })
}

app.post('/broadcast', (req, res, next) => {
  if(req.body.PASSWORD !== process.env.PASSWORD)
    return res.sendStatus(401)

  event = req.body.EVENT || 'nope'
  value = req.body.VALUE || 'nope'


  pickUser('presence-demo')
    .then( winner => {
      pusher.trigger(
        'presence-demo', event, { person: winner, value: value }
      )
      res.send('OK'+ JSON.stringify(winner))
    })
    .catch(next)


})


app.listen(process.env.PORT || 3000)
