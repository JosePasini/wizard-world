export const typeDefs = `#graphql
  type Ingredient {
    name: String!
  }

  type Elixir {
    id: ID!
    name: String!
    effect: String
    ingredients: [Ingredient!]!
  }

  type Query {
    """
    Returns a list of elixirs that can be fully brewed using the provided inventory of ingredients.
    """
    canBrewElixirs(ingredients: [String!]!): [Elixir!]!
  }
`;