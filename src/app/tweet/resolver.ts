import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Tweet } from "@prisma/client";
import { GraphqlContext } from "../../interfaces";
import TweetService, { CreateTweetPayload } from "../../services/tweet";
import UserService from "../../services/user";

const s3Client = new S3Client({ region: process.env.AWS_DEFAULT_REGION });
const queries = {
  getAllTweets: async () => await TweetService.getAllTweets(),
  getSignedUrlForTweet: async (
    parent: any,
    { imageName, imageType }: { imageName: string; imageType: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user || !ctx.user.id) throw new Error("You are not authenticated");
    const allowedImageTypes = [
      "image/jpg",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    if (!allowedImageTypes.includes(imageType))
      throw new Error("Unsupported Image Type");
    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `uploads/${
        ctx.user.id
      }/tweets/${imageName}-${Date.now().toString()}.${imageType}`,
    });
    const signedUrl = await getSignedUrl(s3Client, putObjectCommand);
    return signedUrl;
  },
};

const mutations = {
  createTweet: async (
    parent: any,
    { payload }: { payload: CreateTweetPayload },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user || !ctx.user.id) throw new Error("You are not authenticated");
    const tweet = await TweetService.createTweetOfUser({
      ...payload,
      userId: ctx.user.id,
    });

    return tweet;
  },
};

const extraResolvers = {
  Tweet: {
    author: async (parent: Tweet) =>
      await UserService.getUserById(parent.authorId),
  },
};

export const resolvers = { mutations, extraResolvers, queries };
