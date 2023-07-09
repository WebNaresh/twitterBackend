import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { GraphqlContext } from "../interfaces";
import JWTService from "../services/jwt";
import { Tweet } from "./tweet";
import { User } from "./user";

export async function initServer() {
  const app = express();
  app.use(bodyParser.json());
  app.use(cors());

  const server = new ApolloServer<GraphqlContext>({
    typeDefs: `
       ${User.types}
       ${Tweet.types}
       
        type Query {
            ${User.queries}
            ${Tweet.queries}
        }
        type Mutation {
          ${Tweet.muatations}
          ${User.mutations}
        }
    `,
    resolvers: {
      Query: {
        ...User.resolvers.queries,
        ...Tweet.resolvers.queries,
      },
      Mutation: {
        ...Tweet.resolvers.mutations,
        ...User.resolvers.mutations,
      },
      ...Tweet.resolvers.extraResolvers,
      ...User.resolvers.extraResolvers,
    },
  });
  await server.start();
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req, res }) => {
        return {
          user: req.headers.authorization
            ? JWTService.decodeToken(
                req.headers.authorization.split("Bearer ")[1]
              )
            : undefined,
        };
      },
    })
  );
  return app;
}
