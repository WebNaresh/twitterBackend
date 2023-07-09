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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const db_1 = require("../clients/db");
const redis_1 = require("../clients/redis");
const jwt_1 = __importDefault(require("./jwt"));
class UserService {
    static followUser(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            const updatedUser = yield db_1.prismaClient.follows.create({
                data: {
                    follower: { connect: { id: from } },
                    following: { connect: { id: to } },
                },
            });
            redis_1.redisClient.del(`${from}`);
            redis_1.redisClient.del(`${to}`);
            return updatedUser;
        });
    }
    static unfollowUser(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            const updatedUser = yield db_1.prismaClient.follows.delete({
                where: {
                    followerId_followingId: { followerId: from, followingId: to },
                },
            });
            redis_1.redisClient.del(`${from}`);
            redis_1.redisClient.del(`${to}`);
            return updatedUser;
        });
    }
}
_a = UserService;
UserService.verifyGoogleAuthToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    const googleToken = token;
    const googleOauthURL = new URL("https://oauth2.googleapis.com/tokeninfo");
    googleOauthURL.searchParams.set("id_token", googleToken);
    const { data } = yield axios_1.default.get(googleOauthURL.toString(), {
        responseType: "json",
    });
    const user = yield db_1.prismaClient.user.findUnique({
        where: { email: data.email },
    });
    if (!user) {
        yield db_1.prismaClient.user.create({
            data: {
                email: data.email,
                firstName: data.given_name,
                lastName: data.family_name,
                profileImageURL: data.picture,
            },
        });
    }
    const userInDb = yield db_1.prismaClient.user.findUnique({
        where: { email: data.email },
    });
    if (!userInDb)
        throw new Error("User with email not found");
    const userToken = jwt_1.default.generateTokenForUser(userInDb);
    return userToken;
});
UserService.getUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    if (!id) {
        throw new Error("Id is not provided");
    }
    const catchedUser = yield redis_1.redisClient.get(`${id}`);
    if (catchedUser) {
        return JSON.parse(catchedUser);
    }
    const user = yield db_1.prismaClient.user.findUnique({ where: { id } });
    if (!user) {
        throw new Error("User is not in database");
    }
    yield redis_1.redisClient.set(`${user.id}`, JSON.stringify(user));
    return user;
});
exports.default = UserService;
