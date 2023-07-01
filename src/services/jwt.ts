import { User } from "@prisma/client";
import JWT from "jsonwebtoken";
import { JWTUser } from "../interfaces";
const JWT_SECRETE = "asd;ifjasoifjs";
class JWTService {
  public static generateTokenForUser(user: User) {
    const payload: JWTUser = { id: user?.id, email: user?.email };
    const token = JWT.sign(payload, JWT_SECRETE);
    return token;
  }
  public static decodeToken(token: string) {
    try {
      return JWT.verify(token, JWT_SECRETE) as JWTUser;
    } catch (error) {
      return null;
    }
  }
}
export default JWTService;
