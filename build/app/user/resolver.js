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
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const axios_1 = __importDefault(require("axios"));
const db_1 = require("../../clients/db");
const jwt_1 = __importDefault(require("../../services/jwt"));
const queries = {
    verifyGoogleToken: (parent, { token }) => __awaiter(void 0, void 0, void 0, function* () {
        const googleToken = token;
        console.log(`🚀 ~ token:`, token);
        const googleOauthUr = new URL("https://oauth2.googleapis.com/tokeninfo");
        googleOauthUr.searchParams.set("id_token", googleToken);
        const { data } = yield axios_1.default.get(googleOauthUr.toString(), {
            responseType: "json",
        });
        console.log(`🚀 ~ data:`, data);
        const user = yield db_1.prismaCLient.user.findUnique({
            where: { email: data.email },
        });
        if (!user) {
            yield db_1.prismaCLient.user.create({
                data: {
                    email: data.email,
                    firstName: data.given_name,
                    lastName: data.family_name,
                    profileImageURL: data.picture,
                },
            });
        }
        const userInDb = yield db_1.prismaCLient.user.findUnique({
            where: { email: data.email },
        });
        if (!userInDb) {
            throw new Error("User with email not found");
        }
        const newToken = jwt_1.default.generateTokenForUser(userInDb);
        return newToken;
    }),
};
exports.resolvers = { queries };
