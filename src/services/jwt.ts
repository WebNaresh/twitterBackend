import { User } from "@prisma/client";
import JWT from "jsonwebtoken";
const JWT_SECRETE = "asd;ifjasoifjs";
class JWTService {
  public static generateTokenForUser(user: User) {
    const payload = { id: user?.id, email: user?.email };
    const token = JWT.sign(payload, JWT_SECRETE);
    return token;
  }
}
export default JWTService;
