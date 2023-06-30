import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { User } from "./user";

export async function intializeServer() {
  const app = express();
  app.use(bodyParser.json());
  app.use(cors());
  const typeDefs = `
  ${User.types}
    type Query {
    ${User.queries}
    }
  `;

  const resolvers = {
    Query: {
      ...User.resolvers.queries,
    },
  };
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  app.use("/graphql", expressMiddleware(server));
  return app;
}
