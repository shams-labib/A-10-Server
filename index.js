require("dotenv").config();
const express = require("express");
const cors = require("cors");
const port = 3000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

const admin = require("firebase-admin");

const serviceAccount = require("./firebase-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gs1mqwb.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyFirebaseToken = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  const token = authorization.split(" ")[1];

  try {
    const decodedUser = await admin.auth().verifyIdToken(token);
    req.decodedUser = decodedUser;
    next();
  } catch (error) {
    return res.status(403).send({ message: "Forbidden access" });
  }
};

async function run() {
  try {
    await client.connect();
    const db = client.db("assignment-10");
    const reviewsProducts = db.collection("review-products");
    const restaurantsData = db.collection("resturent-place");
    const sliderData = db.collection("slider");

    // review data
    app.post("/review-products", verifyFirebaseToken, async (req, res) => {
      const reviewData = req.body;
      const decodedEmail = req.decodedUser.email;

      // Email validation — শুধু নিজের নামেই post করতে পারবে
      if (decodedEmail !== reviewData.userEmail) {
        return res.status(403).send({ message: "Unauthorized email" });
      }

      // Add current date automatically (if not sent from frontend)
      reviewData.createdAt = new Date().toISOString();

      const result = await reviewsProducts.insertOne(reviewData);
      res.send(result);
    });
    app.get("/review-products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reviewsProducts.findOne(query);

      if (!result) {
        return res.status(404).send({ message: "Review not found" });
      }

      res.send(result);
    });
    app.put("/review-products/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          foodName: updatedData.foodName,
          foodImage: updatedData.foodImage,
          restaurantName: updatedData.restaurantName,
          location: updatedData.location,
          rating: updatedData.rating,
          reviewText: updatedData.reviewText,
          updatedAt: new Date().toISOString(),
        },
      };

      const result = await reviewsProducts.updateOne(filter, updateDoc);
      res.send(result);
    });

    // My reviews data
    app.get("/my-reviews", verifyFirebaseToken, async (req, res) => {
      const userEmail = req.query.email;

      if (req.decodedUser.email !== userEmail) {
        return res.status(401).send({ message: "Unauthorize access" });
      }

      const query = { userEmail: userEmail };
      const result = await reviewsProducts
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();
      res.send(result);
    });

    app.delete("/my-reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reviewsProducts.deleteOne(query);
      res.send(result);
    });

    app.get("/review-products", async (req, res) => {
      const cursor = await reviewsProducts
        .find()
        .sort({ createdAt: -1 })
        .toArray();
      res.send(cursor);
    });

    // restaurants  data
    app.get("/restaurants-data", async (req, res) => {
      const cursor = await restaurantsData.find().toArray();
      res.send(cursor);
    });

    // Slider data
    app.get("/slider", async (req, res) => {
      const cursor = await sliderData.find().toArray();
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
