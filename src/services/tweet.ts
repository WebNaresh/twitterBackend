import { prismaClient } from "../clients/db";
import { redisClient } from "../clients/redis";

export interface CreateTweetPayload {
  content: string;
  imageURL?: string;
  userId: string;
}
class TweetService {
  public static createTweetOfUser = async (data: CreateTweetPayload) => {
    const rateLimitFlag = await redisClient.get(
      `RATE_LIMIT:TWEET:${data.userId}`
    );
    if (rateLimitFlag) {
      throw new Error(`Please wait try after 10s`);
    }
    const tweet = await prismaClient.tweet.create({
      data: {
        content: data.content,
        imageURL: data.imageURL,
        author: { connect: { id: data.userId } },
      },
    });
    await redisClient.setex(`RATE_LIMIT:TWEET:${data.userId}`, 10, 1);
    await redisClient.del("ALL_TWEETS");
    return tweet;
  };
  public static getAllTweets = async () => {
    const cacheTweet = await redisClient.get("ALL_TWEETS");
    if (cacheTweet) {
      console.log("cached");

      return JSON.parse(cacheTweet);
    }

    const tweets = await prismaClient.tweet.findMany({
      orderBy: { createdAt: "desc" },
    });
    console.log("notcached");
    redisClient.set("ALL_TWEETS", JSON.stringify(tweets));
    return tweets;
  };
}
export default TweetService;
