import { MyContext } from "../types";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Resolver,
} from "type-graphql";
import argon2 from "argon2";
import { User } from "../entities/User";

@InputType()
class UsernameAndPasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: String;

  @Field()
  message: String;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  erros?: FieldError[];
  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  // @Query(() => User, { nullable: true })
  // async me(@Ctx() { em, req }: MyContext): Promise<User | null> {
  //   console.log(req.session);
  //   if (!req.session.userId) {
  //     return null;
  //   }
  //   const user = await em.findOne(User, { id: req.session.userId });
  //   return user;
  // }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernameAndPasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    if (options.username.length <= 2) {
      return {
        erros: [
          {
            field: "username",
            message: "Username must contain at least 3 character",
          },
        ],
      };
    }
    if (options.password.length <= 2) {
      return {
        erros: [
          {
            field: "password",
            message: "Password must contain at least 3 character",
          },
        ],
      };
    }

    const userAlreadyExist = await em.findOne(User, {
      username: options.username,
    });

    if (userAlreadyExist) {
      return {
        erros: [
          {
            field: "username",
            message: "Username already exists",
          },
        ],
      };
    }

    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
    });
    await em.persistAndFlush(user);

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UsernameAndPasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username: options.username });
    if (!user) {
      return {
        erros: [
          {
            field: "username",
            message: "That username dosen't exist",
          },
        ],
      };
    }
    const isValidPassword = await argon2.verify(
      user.password,
      options.password
    );
    if (!isValidPassword) {
      return {
        erros: [
          {
            field: "password",
            message: "Incorrect password",
          },
        ],
      };
    }

    return { user };
  }
}
