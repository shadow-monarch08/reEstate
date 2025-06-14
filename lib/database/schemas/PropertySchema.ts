import { ObjectSchema } from "realm";

export const PropertySchema: ObjectSchema = {
    name: "Property",
    embedded: true,
    properties:{
        image: {
            type: "string",
        },
        name: {
            type: "string",
        },
        price: {
            type: "int",
        },
        address:{
            type: "string",
        },
        rating: {
            type: "float",
        }
    }
}