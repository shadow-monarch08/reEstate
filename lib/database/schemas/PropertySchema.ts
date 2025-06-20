import { isLoading } from "expo-font";
import { ObjectSchema } from "realm";

export const PropertySchema: ObjectSchema = {
  name: "Property",
  embedded: true,
  properties: {
    id: {
      type: "string",
    },
    image: {
      type: "string",
      optional: true,
    },
    name: {
      type: "string",
      optional: true,
    },
    price: {
      type: "int",
      optional: true,
    },
    address: {
      type: "string",
      optional: true,
    },
    rating: {
      type: "float",
      optional: true,
    },
    isLoading: {
      type: "bool",
      default: true,
    },
  },
};
