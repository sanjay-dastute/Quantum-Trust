import { Resolver, Query } from '@nestjs/graphql';

@Resolver()
export class AppResolver {
  @Query(() => String)
  helloGraphQL(): string {
    return 'Hello from QuantumTrust GraphQL API!';
  }
}
