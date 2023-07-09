import { User } from "@prisma/client";
import { prismaClient } from "../../clients/db";
import { redisClient } from "../../clients/redis";
import { GraphqlContext } from "../../interfaces";
import UserService from "../../services/user";

const queries = {
  verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
    const returnedToken = UserService.verifyGoogleAuthToken(token);
    return returnedToken;
  },
  getCurrentUser: async (parent: any, args: any, ctx: GraphqlContext) => {
    const id = ctx.user?.id;
    if (!id) return null;

    const user = await UserService.getUserById(id);
    return user;
  },
  getUserById: async (
    parent: any,
    { id }: { id: string },
    ctx: GraphqlContext
  ) => {
    const user = await UserService.getUserById(id);

    return user as User;
  },
};

const extraResolvers = {
  User: {
    tweets: async (parent: User) =>
      await prismaClient.tweet.findMany({
        where: { author: { id: parent.id } },
      }),
    followers: async (parent: User) => {
      const result = await prismaClient.follows.findMany({
        where: { following: { id: parent.id } },
        include: {
          follower: true,
        },
      });
      return result.map((el) => el.follower);
    },
    following: async (parent: User) => {
      const result = await prismaClient.follows.findMany({
        where: { follower: { id: parent.id } },
        include: {
          following: true,
        },
      });
      return result.map((el) => el.following);
    },
    recommendedUsers: async (parent: User, _: any, ctx: GraphqlContext) => {
      if (!ctx.user) return [];
      const cachedValue = await redisClient.get(
        `RECOMMENDED_USERS:${ctx.user.id}`
      );
      if (cachedValue) {
        return JSON.parse(cachedValue);
      }

      const myFollowings = await prismaClient.follows.findMany({
        where: {
          follower: { id: ctx.user.id },
        },
        include: {
          following: {
            include: {
              followers: {
                include: {
                  following: true,
                },
              },
            },
          },
        },
      });
      const userToRecommend = [];
      for (const followings of myFollowings) {
        for (const followingOfFollowedUser of followings.following.followers)
          if (
            followingOfFollowedUser.following.id !== ctx.user.id &&
            myFollowings.findIndex(
              (e) => e?.followingId === followingOfFollowedUser.following.id
            ) < 0
          ) {
            userToRecommend.push(followingOfFollowedUser.following);
          }
      }
      await redisClient.setex(
        `RECOMMENDED_USERS:${ctx.user.id}`,
        10,
        JSON.stringify(userToRecommend)
      );
      return userToRecommend;
    },
  },
};
const mutations = {
  followUser: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user || !ctx.user.id) throw new Error("unauthenticated");
    await UserService.followUser(ctx.user.id, to);
    await redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
    return true;
  },
  unfollowUser: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user || !ctx.user.id) throw new Error("unauthenticated");
    await UserService.unfollowUser(ctx.user.id, to);
    await redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
    return true;
  },
};

export const resolvers = { queries, extraResolvers, mutations };
