import axios from "axios";
import { prismaCLient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";
import JWTService from "../../services/jwt";

interface GoogleTokenResult {
  iss: string;
  nbf: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: string;
  azp: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: string;
  exp: string;
  jti: string;
  alg: string;
  kid: string;
  typ: string;
}
const queries = {
  verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
    const googleToken = token;
    const googleOauthUr = new URL("https://oauth2.googleapis.com/tokeninfo");
    googleOauthUr.searchParams.set("id_token", googleToken);
    const { data } = await axios.get<GoogleTokenResult>(
      googleOauthUr.toString(),
      {
        responseType: "json",
      }
    );
    const user = await prismaCLient.user.findUnique({
      where: { email: data.email },
    });
    if (!user) {
      await prismaCLient.user.create({
        data: {
          email: data.email,
          firstName: data.given_name,
          lastName: data.family_name,
          profileImageURL: data.picture,
        },
      });
    }
    const userInDb = await prismaCLient.user.findUnique({
      where: { email: data.email },
    });
    if (!userInDb) {
      throw new Error("User with email not found");
    }
    const newToken = JWTService.generateTokenForUser(userInDb);

    return newToken;
  },
  getCurrentUser: async (parent: any, args: any, ctx: GraphqlContext) => {
    const id = ctx.user?.id;
    if (!id) return null;

    const user = await prismaCLient.user.findUnique({ where: { id } });
    console.log(`🚀 ~ user:`, user);
    return user;
  },
};
export const resolvers = { queries };
