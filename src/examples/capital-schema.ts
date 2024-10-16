import { schema, user, last } from "../framework/function";
import { JSONSchema4 } from "json-schema";
import { gpt } from "./engine";

/**
 * JSON Schema for representing a capital city with its associated country, continent, and founding year information.
 * @type {JSONSchema4}
 */
const capitalSchema: JSONSchema4 = {
  $schema: "http://json-schema.org/draft-04/schema#",
  title: "Capital",
  description: "Schema for representing a capital city with country, continent, and founding year information.",
  type: "object",
  properties: {
    name: {
      type: "string",
      description: "The name of the capital city.",
    },
    country: {
      type: "string",
      description: "The country to which the capital belongs.",
    },
    continent: {
      type: "string",
      enum: ["Europe", "Americas", "Asia"],
      description: "The continent where the capital is located.",
    },
    year_founded: {
      type: "integer",
      description: "The year when the capital was founded.",
    },
  },
  required: ["name", "country", "continent", "year_founded"],
  additionalProperties: false,
};

/**
 * Enum for representing the continents.
 */
enum Continent {
  Europe = "Europe",
  Americas = "Americas",
  Asia = "Asia",
}

/**
 * Interface to define the structure of a Capital object.
 */
interface Capital {
  name: string;
  country: string;
  continent: Continent;
  year_founded: number; // TypeScript supports large integers with BigInt
}

/**
 * Create a schema-based object for Capital.
 */
const capitalObject = schema<Capital>(capitalSchema);

/**
 * Main function to retrieve and log information about a capital city.
 */
const main = async () => {
  const capital = await last(
    gpt(user("What is the capital of France?"), capitalObject())
  );

  console.log(capital);
};

main();
