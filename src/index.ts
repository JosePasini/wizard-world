import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { initDatabase } from './database/db.js';
import { runBootstrap } from './services/bootstrap.js';
import { globalCache } from './cache/elixirCache.js'; 
import { typeDefs } from './graphql/typeDefs.js';
import { resolvers } from './graphql/resolvers.js';

async function main() {
  try {
    console.log('--- SYSTEM: Starting application services... ---');
    
    await initDatabase();
    await runBootstrap();
    await globalCache.hydrate()
    
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      introspection: true, 
      plugins: [
        ApolloServerPluginLandingPageLocalDefault({ 
          embed: true,
          includeCookies: true
        })
      ],
    });

    const { url } = await startStandaloneServer(server, {
      listen: { port: 4000 },
    });

    console.log(`\n🚀  --- SERVER RUNNING: GraphQL Sandbox ready at ${url} --- 🚀\n`);
  } catch (error) {
    console.error('--- CRITICAL SYSTEM ERROR: Startup routine aborted ---', error);
    process.exit(1);
  }
}

main();