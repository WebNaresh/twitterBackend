"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../clients/db");
const redis_1 = require("../clients/redis");
class TweetService {
}
_a = TweetService;
TweetService.createTweetOfUser = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const rateLimitFlag = yield redis_1.redisClient.get(`RATE_LIMIT:TWEET:${data.userId}`);
    if (rateLimitFlag) {
        throw new Error(`Please wait try after 10s`);
    }
    const tweet = yield db_1.prismaClient.tweet.create({
        data: {
            content: data.content,
            imageURL: data.imageURL,
            author: { connect: { id: data.userId } },
        },
    });
    yield redis_1.redisClient.setex(`RATE_LIMIT:TWEET:${data.userId}`, 10, 1);
    yield redis_1.redisClient.del("ALL_TWEETS");
    return tweet;
});
TweetService.getAllTweets = () => __awaiter(void 0, void 0, void 0, function* () {
    const cacheTweet = yield redis_1.redisClient.get("ALL_TWEETS");
    if (cacheTweet) {
        console.log("cached");
        return JSON.parse(cacheTweet);
    }
    const tweets = yield db_1.prismaClient.tweet.findMany({
        orderBy: { createdAt: "desc" },
    });
    console.log("notcached");
    redis_1.redisClient.set("ALL_TWEETS", JSON.stringify(tweets));
    return tweets;
});
exports.default = TweetService;
