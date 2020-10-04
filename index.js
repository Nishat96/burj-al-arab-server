const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
var admin = require("firebase-admin");
require('dotenv').config()
console.log(process.env.DB_PASS)


const app = express()


app.use(cors());
app.use(bodyParser.json());

const port = 5000

app.get('/', (req, res) => {
  res.send('hello from db')
})


var serviceAccount = require("./configs/burj-al-arab-d3b5a-firebase-adminsdk-vdbrs-dc34a7085f.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
});


var MongoClient = require('mongodb').MongoClient;

var uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0-shard-00-00.9xmg6.mongodb.net:27017,cluster0-shard-00-01.9xmg6.mongodb.net:27017,cluster0-shard-00-02.9xmg6.mongodb.net:27017/burjAlArab?ssl=true&replicaSet=atlas-pg0dei-shard-0&authSource=admin&retryWrites=true&w=majority`;
MongoClient.connect(uri, function(err, client) {
  const bookings = client.db("burjAlArab").collection("bookings");
  // console.log('db connected');
  app.post('/addBooking', (req, res)=> {
    const newBooking = req.body;
    bookings.insertOne(newBooking)
    .then(result => {
      res.send(result.insertedCount > 0);
    })
    console.log(newBooking);
  })

  app.get('/bookings', (req, res) => {
    const bearer = req.headers.authorization;
    if( bearer && bearer.startsWith('Bearer ')){
      const idToken = bearer.split(' ')[1];
      // console.log({ idToken });
      // idToken comes from the client app
      admin.auth().verifyIdToken(idToken)
      .then(function(decodedToken) {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          // console.log(tokenEmail);
        if( tokenEmail ==  queryEmail  ){
          bookings.find({email: req.query.email})
          .toArray((err, documents) => {
            res.status(200).send(documents);
          })
        }
        else {
          res.status(401).send('un-authorized access');
        }   
      }).catch(function(error) {
        res.status(401).send('un-authorized access');
      });
    }
    else {
      res.status(401).send('un-authorized access');
    }
    
  })



//  console.log('database connected')
//   client.close();
});


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(process.env.PORT || port)