const express = require("express");
const cors = require("cors");
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rlqi2bh.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.get("/", (req, res) => {
    res.send("My Own Server is Running")
})

async function run() {
    try {
        await client.connect();

        const db = client.db("food-lovers");
        const reviewsCollection = db.collection("reviews");
        const usersCollection = db.collection("users");

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");


        // USERS API
        app.post("/users", async (req, res) => {
            const newUser = req.body;

            const email = req.body.email;
            const query = { email: email };
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                res.send({ message: "User already exists" })
            } else {
                const result = await usersCollection.insertOne(newUser);
                res.send(result);
            }
        })


        // REVIEWS APIs
        app.post("/reviews", async (req, res) => {
            const newReview = req.body;
            const result = await reviewsCollection.insertOne(newReview);
            res.send(result);
        })

        app.get("/reviews", async (req, res) => {
            const email = req.query.email;
            const query = {};
            if (email) {
                query.email = email;
            }

            const cursor = reviewsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get("/reviews/:email", async (req, res) => {
            const email = req.params.email;
            const query = { reviewer_email: email };
            const result = await reviewsCollection.find(query).sort({ date: -1 }).toArray();
            res.send(result);
        });

        app.delete("/reviews/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await reviewsCollection.deleteOne(query);
            res.send(result);
        });

    }
    finally {

    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Smart Server is Running on Port: ${port}`);
})