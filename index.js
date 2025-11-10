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
        const favoritesCollection = db.collection("favorites");

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
            try {
                const email = req.query.email;
                const search = req.query.search || "";
                const limit = parseInt(req.query.limit) || 0;
                const sortField = req.query.sort || "date";

                const query = {};
                if (email) {
                    query.reviewer_email = email;
                }

                if(search){
                    query.food_name = {$regex: search, $options: "i"}
                }

                const result = await reviewsCollection
                    .find(query)
                    .sort({ [sortField]: -1 })
                    .limit(limit)
                    .toArray();

                res.send(result);
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Failed to fetch reviews" });
            }
        });


        app.get("/reviews/user/:email", async (req, res) => {
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

        app.get("/reviews/:id", async (req, res) => {
            const id = req.params.id;
            try {
                const query = { _id: new ObjectId(id) };
                const result = await reviewsCollection.findOne(query);

                if (!result) {
                    return res.status(404).send({ message: "Review not found" });
                }
                res.send(result);
            }
            catch (error) {
                console.error(error);
                res.status(500).send({ message: "Error fetching review" });
            }

        });

        app.put("/reviews/:id", async (req, res) => {
            const id = req.params.id;
            const updatedReview = req.body;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    food_name: updatedReview.food_name,
                    food_image: updatedReview.food_image,
                    restaurant_name: updatedReview.restaurant_name,
                    location: updatedReview.location,
                    rating: updatedReview.rating,
                    review_text: updatedReview.review_text,
                    favorites: updatedReview.favorites,
                    date: new Date(),
                },
            };

            const result = await reviewsCollection.updateOne(filter, updateDoc);
            res.send(result);
        });


        // favoritesCollection APIs
        app.post("/favorites", async (req, res) => {
            const { user_email, reviewId } = req.body;
            const existing = await favoritesCollection.findOne({ user_email, review_id: reviewId });
            if (existing) return res.send({ message: "Already is  on favorite" });

            const result = await favoritesCollection.insertOne({
                user_email,
                review_id: reviewId,
                addedAt: new Date(),
            });
            res.send(result);
        });

        app.get("/favorites/:email", async (req, res) => {
            const email = req.params.email;
            const favorites = await favoritesCollection.find({ user_email: email }).toArray();
            res.send(favorites);
        });

        app.delete("/favorites/:id", async (req, res) => {
            const id = req.params.id;
            const result = await favoritesCollection.deleteOne({ _id: new ObjectId(id) });
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