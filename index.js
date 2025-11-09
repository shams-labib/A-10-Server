require("dotenv").config();
const express = require("express");
const cors = require("cors");
const port = 3000;
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gs1mqwb.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("assignment-10");
    const reviewsProducts = db.collection("review-products");
    const restaurantsData = db.collection("resturent-place");

    app.post("/review-products", async (req, res) => {
      const newUsers = req.body;
      const result = await reviewsProducts.insertOne(newUsers);
      res.send(result);
    });

    app.get("/review-products", async (req, res) => {
      const cursor = await reviewsProducts.find().toArray();
      res.send(cursor);
    });

    // restaurants  data
    app.get("/restaurants-data", async (req, res) => {
      const cursor = await restaurantsData.find().toArray();
      res.send(cursor);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.use(express.json());
app.use(cors());

// assignment-10
// aiPzPSTuB9gEDk1D

app.get("/", (req, res) => {
  res.send("This is server");
});

app.listen(port, () => {
  console.log(`This is port ${port}`);
});
