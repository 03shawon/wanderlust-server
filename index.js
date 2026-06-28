const express = require('express');
const dovenv = require('dotenv');
dovenv.config();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');

const uri = process.env.MONGODB_URI;


const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)

const verifyToken = async(req, res, next) =>{
  const authHeader = req?.headers.authorization
  if(!authHeader) {
    return res.status(401).json({message:" Unauthorized"})
  }
  const token = authHeader.split(" ")[1]
   if(!token) {
    return res.status(401).json({message:" Unauthorized"})
  }
  // console.log(token)

  try {

    const {payload} = await jwtVerify(token, JWKS)
    console.log(payload)
    next()
  } catch (error) {
    return res.status(403).json({message: "forbidden"})
  }
}

async function run() {
  try {
      // await client.connect();

    const db = client.db("wanderlust");
    const destinationsCollection = db.collection("destinations");

    const bookingsCollection = db.collection("bookings");

    app.get("/featured", async(req, res) =>{
      const result = await destinationsCollection.find().limit(3).toArray()
      res.send(result)
    })


    app.get('/destination', async (req, res) =>{
      const result = await destinationsCollection.find().toArray();
      res.json(result);
    })

    app.get("/destination/:id", verifyToken,
      
      // (req, res, next)=>{
      // const header = req.headers.authorization
      // console.log(header)
      // next()

      // if(header === "login"){
      //   next()
      // }else{
      //   res.status(401).json({message: "Unauthorized"})
      // }
    // },
     async (req, res) =>{
      const id = req.params
      const result = await destinationsCollection.findOne({_id: new ObjectId(id)});
      res.json(result);
    })

    app.get("/booking/:userId", async(req, res) =>{
      const {userId} = req.params
      const result = await bookingsCollection.find({userId}).toArray()
      res.send(result)
    })

    app.post('/destination', async (req, res) =>{
        const destinaion = req.body;
        console.log(destinaion)
        const result = await destinationsCollection.insertOne(destinaion);
        res.send(result);
    })

    app.post('/booking', async (req, res) =>{
      const bookingData = req.body;
      const result = await bookingsCollection.insertOne(bookingData);
      res.send(result);
    })

    app.patch('/destination/:id', async (req, res) =>{
      const {id} = req.params;
      const updatedDestination = req.body;

      const result = await destinationsCollection.updateOne(
        {_id: new ObjectId(id)},
        {$set: updatedDestination}
      );
      res.json(result);
    })

    app.delete('/destination/:id', async(req, res) =>{
      const {id} = req.params;
    const result = await destinationsCollection.deleteOne({_id: new ObjectId(id)})
    res.json(result);
    })  

    app.delete('/booking/:bookingId', async (req, res) =>{
      const {bookingId} = req.params
      const result = await bookingsCollection.deleteOne({_id: new ObjectId(bookingId)})
      res.json(result)
    })

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World from server')
});

app.listen(PORT, () => {
    console.log(`server running on port : ${PORT}`)
})


