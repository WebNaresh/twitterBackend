import axios from "axios";
import { prismaClient } from "../clients/db";
import { redisClient } from "../clients/redis";
import JWTService from "./jwt";

interface GoogleTokenResult {
  iss?: string;
  nbf?: string;
  aud?: string;
  sub?: string;
  email: string;
  email_verified: string;
  azp?: string;
  name?: string;
  picture?: string;
  given_name: string;
  family_name?: string;
  iat?: string;
  exp?: string;
  jti?: string;
  alg?: string;
  kid?: string;
  typ?: string;
}
class UserService {
  public static verifyGoogleAuthToken = async (token: string) => {
    const googleToken = token;
    const googleOauthURL = new URL("https://oauth2.googleapis.com/tokeninfo");
    googleOauthURL.searchParams.set("id_token", googleToken);

    const { data } = await axios.get<GoogleTokenResult>(
      googleOauthURL.toString(),
      {
        responseType: "json",
      }
    );

    const user = await prismaClient.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      await prismaClient.user.create({
        data: {
          email: data.email,
          firstName: data.given_name,
          lastName: data.family_name,
          profileImageURL: data.picture,
        },
      });
    }

    const userInDb = await prismaClient.user.findUnique({
      where: { email: data.email },
    });

    if (!userInDb) throw new Error("User with email not found");

    const userToken = JWTService.generateTokenForUser(userInDb);

    return userToken;
  };
  public static getUserById = async (id: string) => {
    if (!id) {
      throw new Error("Id is not provided");
    }
    const catchedUser = await redisClient.get(`${id}`);
    if (catchedUser) {
      return JSON.parse(catchedUser);
    }
    const user = await prismaClient.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error("User is not in database");
    }
    await redisClient.set(`${user.id}`, JSON.stringify(user));

    return user;
  };
  public static async followUser(from: string, to: string) {
    const updatedUser = await prismaClient.follows.create({
      data: {
        follower: { connect: { id: from } },
        following: { connect: { id: to } },
      },
    });
    redisClient.del(`${from}`);
    redisClient.del(`${to}`);
    return updatedUser;
  }

  public static async unfollowUser(from: string, to: string) {
    const updatedUser = await prismaClient.follows.delete({
      where: {
        followerId_followingId: { followerId: from, followingId: to },
      },
    });
    redisClient.del(`${from}`);
    redisClient.del(`${to}`);
    return updatedUser;
  }
}
export default UserService;
