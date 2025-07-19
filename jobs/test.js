const { MongoClient } = require('mongodb');
const uri = process.env.DB_URI.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db('muscat_apps_DB');
    const Message = db.collection('messages');
    const UserRecentMessages = db.collection('userRecentMessages_test');

    // Ensure the collection exists
    await db.createCollection('userRecentMessages', {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["_id", "recentMessage"],
          properties: {
            _id: {
              bsonType: "objectId",
              description: "must be an object ID and is required"
            },
            recentMessage: {
              bsonType: "object",
              description: "must be an object and is required"
            }
          }
        }
      }
    }).catch(err => {
      if (err.codeName !== 'NamespaceExists') {
        throw err;
      }
    });

    // Step 1: Aggregate Recent Messages
    const recentMessages = await aggregateRecentMessages(Message);
    console.log({recentMessages});

    // Step 2: Insert or Update `userRecentMessages`
    const result = await updateUserRecentMessages(UserRecentMessages, recentMessages);

    console.log('Bulk write result:', result);
  } catch (error) {
    console.error('Error updating recent messages:', error);
  } finally {
    await client.close();
  }
}

const aggregateRecentMessages = async (Message) => {
  const pipeline = [
    {
      $sort: { createdAt: -1 } // Sort by creation date descending
    },
    {
      $group: {
        _id: { userId: { $cond: [{ $ne: ["$from", null] }, "$from", "$to"] } },
        recentMessage: { $first: "$$ROOT" }
      }
    },
    {
      $addFields: {
        userId: "$_id.userId"
      }
    },
    {
      $project: {
        _id: 0,
        userId: 1,
        recentMessage: 1
      }
    }
  ];

  const results = await Message.aggregate(pipeline).toArray();
  return results;
};

const updateUserRecentMessages = async (UserRecentMessages, recentMessages) => {
  const bulkOps = recentMessages.map(({ userId, recentMessage }) => ({
    updateOne: {
      filter: { _id: userId },
      update: { $set: { recentMessage } },
      upsert: true
    }
  }));

  const bulkWriteResult = await UserRecentMessages.bulkWrite(bulkOps);
  return bulkWriteResult;
};


module.exports = (agenda) => {
  agenda.define("update recent messages", async (job) => {
    console.log("update recent messages");
    try {

      await run();

      console.log("Recent messages updated successfully.");
    } catch (error) {
      console.error("Error updating recent messages:", error);
    }
  });
};