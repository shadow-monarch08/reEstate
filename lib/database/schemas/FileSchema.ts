import { ObjectSchema } from "realm";

export const FileSchema: ObjectSchema = {
    name: 'File',
    embedded: true,
    properties:{
        url: {
            type: "string",
        },
        size: {
            type: "string",
        },
        type: {
            type: "string",
        },
    }
}