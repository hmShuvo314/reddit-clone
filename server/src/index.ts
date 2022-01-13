import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import mikroOrmConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolvers } from "./resolvers/hello";
import { PostResolvers } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";

// import redis from "redis";
// import session from "express-session";
// import connectRedis from "connect-redis";
import { __prod__ } from "./constants";
import { MyContext } from "./types";
// import cors from "cors";

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up();

  const app = express();

  // const RedisStore = connectRedis(session);
  // const redisClient = redis.createClient();

  // app.set("trust proxy", 1);

  // app.use(
  //   cors({
  //     origin: ["*"],
  //     credentials: true,
  //   })
  // );

  // app.use(
  //   session({
  //     name: "lol",
  //     store: new RedisStore({ client: redisClient, disableTouch: true }),
  //     secret: "poop",
  //     resave: false,
  //     cookie: {
  //       maxAge: 1000 * 60 * 60 * 24 * 30,
  //       httpOnly: true,
  //       secure: __prod__,
  //       sameSite: "lax",
  //     },
  //     saveUninitialized: false,
  //   })
  // );

  // app.get("/", (_, res) => {
  //   res.send("LOL");
  // });
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolvers, PostResolvers, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({ em: orm.em, req, res }),
  });
  await apolloServer.start();

  apolloServer.applyMiddleware({ app });

  app.listen(8080, () => {
    console.log("Server is running at http://localhost:8080");
  });
};

main().catch((err) => console.log(err));
