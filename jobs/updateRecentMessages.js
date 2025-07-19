const Message = require("../models/messageModel"); // Adjust the path to your Message model

module.exports = (agenda) => {
  agenda.define("update recent messages", async (job) => {
    console.log("update recent messages");
    try {
      const recentMessagesPipeline = [
        {
          $match: {
            // Optionally match specific criteria here
          },
        },
        {
          $sort: { createdAt: -1 }, // Sort messages by creation date (most recent first)
        },
        {
          $group: {
            _id: {
              userId: { $cond: [{ $ne: ["$from", null] }, "$from", "$to"] }, // Group by userId, considering both `from` and `to`
            },
            recentMessage: { $first: "$$ROOT" }, // Get the most recent message for each user
          },
        },
        {
          $project: {
            _id: "$_id.userId", // Project userId as _id
            recentMessage: 1,
          },
        },
        {
          $merge: {
            into: "userRecentMessages", // Target collection name
            whenMatched: "replace", // Replace existing documents with the same _id
            whenNotMatched: "insert", // Insert new documents
          },
        },
      ];
      // await Message.aggregate(recentMessagesPipeline);
      const results = await Message.aggregate(recentMessagesPipeline);
      console.log("Aggregation results:", results);

      console.log("Recent messages updated successfully.");
    } catch (error) {
      console.error("Error updating recent messages:", error);
    }
  });
};
