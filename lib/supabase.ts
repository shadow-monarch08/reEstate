import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthError, createClient, PostgrestError } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

export const Supabase = createClient(
  Constants.expoConfig?.extra?.SUPABASE_URL,
  Constants.expoConfig?.extra?.SUPABASE_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Data sample :-
/*const obj = {
  session: {
    access_token:
      "eyJhbGciOiJIUzI1NiIsImtpZCI6ImFrb1FNRXBINDlKVmpOS28iLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2J4d29sdm93Y3puYXFqZXlmb2lsLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJmN2JkNDVhNi1mNzk1LTRiMTYtOThmMy05YjM3Y2FiZjJmNjgiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ2MTgzNDQwLCJpYXQiOjE3NDYxNzk4NDAsImVtYWlsIjoic2FtYW50YS5uMTk2MkBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6Imdvb2dsZSIsInByb3ZpZGVycyI6WyJnb29nbGUiXX0sInVzZXJfbWV0YWRhdGEiOnsiYXZhdGFyX3VybCI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvxY0lZei0xSTJMcGlYd2phd05pTlB4NXluc2xVb25EeDRGUUZoZWlrbmJuT2hVVHBnOWM9czk2LWMiLCJlbWFpbCI6InNhbWFudGEubjE5NjJAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6Ik5hcmVuZHJhIFNhbWFudGEiLCJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYW1lIjoiTmFyZW5kcmEgU2FtYW50YSIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0lZei0xSTJMcGlYd2phd05pTlB4NXluc2xVb25EeDRGUUZoZWlrbmJuT2hVVHBnOWM9czk2LWMiLCJwcm92aWRlcl9pZCI6IjExNzYyNzA0Mjc1MjQ5MzQ2NjM2NSIsInN1YiI6IjExNzYyNzA0Mjc1MjQ5MzQ2NjM2NSJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im9hdXRoIiwidGltZXN0YW1wIjoxNzQ2MTc5ODQwfV0sInNlc3Npb25faWQiOiI1OGFmNDE0Ny02MmEyLTQwYTYtYWVlMi1mZmE4MjU1YmQwMWQiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.s8PYdy3QV1O929ZHqryZLmYrns4RDEOm3ABeUNI3m1o",
    expires_at: 1746183440,
    expires_in: 3600,
    refresh_token: "aj46msxdbt42",
    token_type: "bearer",
    user: {
      app_metadata: [Object],
      aud: "authenticated",
      created_at: "2025-05-02T09:57:20.629741Z",
      email: "samanta.n1962@gmail.com",
      email_confirmed_at: "2025-05-02T09:57:20.648370109Z",
      id: "f7bd45a6-f795-4b16-98f3-9b37cabf2f68",
      identities: [Array],
      is_anonymous: false,
      last_sign_in_at: "2025-05-02T09:57:20.654135717Z",
      phone: "",
      role: "authenticated",
      updated_at: "2025-05-02T09:57:20.657336Z",
      user_metadata: [Object],
    },
  },
  user: {
    app_metadata: { provider: "google", providers: [Array] },
    aud: "authenticated",
    created_at: "2025-05-02T09:57:20.629741Z",
    email: "samanta.n1962@gmail.com",
    email_confirmed_at: "2025-05-02T09:57:20.648370109Z",
    id: "f7bd45a6-f795-4b16-98f3-9b37cabf2f68",
    identities: [[Object]],
    is_anonymous: false,
    last_sign_in_at: "2025-05-02T09:57:20.654135717Z",
    phone: "",
    role: "authenticated",
    updated_at: "2025-05-02T09:57:20.657336Z",
    user_metadata: {
      avatar_url:
        "https://lh3.googleusercontent.com/a/ACg8ocIYz-1I2LpiXwjawNiNPx5ynslUonDx4FQFheiknbnOhUTpg9c=s96-c",
      email: "samanta.n1962@gmail.com",
      email_verified: true,
      full_name: "Narendra Samanta",
      iss: "https://accounts.google.com",
      name: "Narendra Samanta",
      phone_verified: false,
      picture:
        "https://lh3.googleusercontent.com/a/ACg8ocIYz-1I2LpiXwjawNiNPx5ynslUonDx4FQFheiknbnOhUTpg9c=s96-c",
      provider_id: "117627042752493466365",
      sub: "117627042752493466365",
    },
  },
};
*/

interface User {
  id: string | undefined;
  avatar_url: string | undefined;
  email: string | undefined;
  full_name: string | undefined;
}

export interface PropertyReturnType {
  address: string;
  id: string;
  image: string;
  name: string;
  price: number;
  rating: number;
}

interface PropertyRef {
  address?: string;
  id: string;
  image?: string;
  name?: string;
  price?: number;
  rating?: number;
  isLoading?: boolean;
}

export interface Sort {
  name: "ascending" | "descending";
  date: "latest" | "oldest";
  rating: "ascending" | "descending";
}

interface PropertyParameter {
  filter?: string;
  query?: string;
  range: Array<number>;
  sort?: string;
  propFilter?: string;
}

export interface propertyOverviewReturnType {
  id: string;
  name: string;
  type: string;
  description: string;
  address: string;
  geolocation: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  rating: number;
  facilities: string[];
  image: string;
  gallery_images: string[];
  agent: string;
  agent_name: string;
  agent_email: string;
  agent_avatar: string;
  review_count: number;
  top_reviews: Review[];
}

export interface Review {
  id: string;
  name: string;
  avatar: string;
  property: string;
  rating: number;
  review: string;
  created_at: string; // ISO timestamp
}

interface Filters {
  range: [number, number];
  areaRange: [number, number];
  propertyType: string[];
  facilities: string[];
  bathroomCount: number;
  bedroomCount: number;
}

interface PriceRange {
  property_count: number;
  range_start: number;
  range_end: number;
}

interface AreaSummary {
  max_area: number;
  min_area: number;
}

export interface FilterDetailReturnType {
  area_summary: AreaSummary;
  price_ranges: PriceRange[];
}

export interface ReviewReturn {
  avatar: string;
  created_at: string;
  id: string;
  name: string;
  property: string;
  rating: number;
  review: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  receiver_id: string;
  sender_id: string;
  message: string | null;
  file: File | null;
  property_ref: string | PropertyRef | null;
  created_at: string;
  status: string;
  identifier_user?: string;
  identifier_agent?: string;
}

export interface Conversation {
  conversation_id: string;
  agent_id: string;
  agent_name: string;
  agent_avatar: string;
  avatar_last_update: string;
  unread_count: number;
}

export interface File {
  url: string;
  type: string;
  size: string;
}

export interface ChatOverviewReturnType {
  agent_avatar: string;
  agent_id: string;
  agent_name: string;
  avatar_last_update: string;
  conversation_id: string;
  last_message?: string | null;
  last_message_time: string; // ISO timestamp (can use Date if parsed)
  last_file?: File | null;
  last_property_ref?: string | PropertyRef | null;
  unread_count?: number;
  unread_messages?: Array<Message>;
}

export interface ChatReturnType {
  id: string;
  message: string;
  created_at: string;
  sender_id: string;
  status: "sent" | "received" | "read";
  property_ref: string;
  file: File;
}

export const login = async (): Promise<AuthError | null> => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    if (userInfo.data?.idToken) {
      const { data, error } = await Supabase.auth.signInWithIdToken({
        provider: "google",
        token: userInfo.data.idToken,
      });
      return error;
    }
    return null;
  } catch (error: any) {
    // some other error happened
    console.error(error);
    return null;
  }
};

export const logout = async (): Promise<AuthError | null> => {
  try {
    const { error } = await Supabase.auth.signOut();
    return error;
  } catch (error: any) {
    console.error(error);
    return null;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data, error } = await Supabase.auth.getSession();
    const user = data.session?.user;
    if (!data.session || error) {
      return null;
    }
    const userData: User = {
      id: user?.id,
      avatar_url: user?.user_metadata.picture,
      email: user?.user_metadata.email,
      full_name: user?.user_metadata.full_name,
    };
    return userData;
  } catch (error: any) {
    console.error("inside getuser : ", error);
    return null;
  }
};

// const property_blueprint = {
//   address: "123 Property Street, City 1",
//   id: "1a287a66-16c3-4710-8e38-e6afc705444b",
//   image:
//     "https://images.unsplash.com/photo-1605146768851-eda79da39897?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//   name: "Property 1",
//   price: 7780,
//   rating: 1,
// };
export const getFeaturedProperties = async ({
  filter,
  sort,
  range = [0, 5],
}: {
  filter: string;
  sort?: string;
  range: Array<number | number>;
}): Promise<Array<PropertyReturnType> | [] | null> => {
  try {
    if (filter && filter !== "All") {
      if (sort && sort !== "null") {
        const sortParam: Sort = JSON.parse(sort);
        const { data: properties, error } = await Supabase.from("properties")
          .select("id, name, address, price, rating, image")
          .eq("type", filter)
          .order(`${Object.keys(sortParam)[0]}`, {
            ascending: Object.values(sortParam)[0] === "ascending",
          })
          .range(range[0], range[1]);

        if (error) {
          console.error(error);
          return [];
        }
        return properties;
      }
      const { data: properties, error } = await Supabase.from("properties")
        .select("id, name, address, price, rating, image")
        .eq("type", filter)
        .range(range[0], range[1]);

      if (error) {
        console.error(error);
        return [];
      }
      return properties;
    } else if (sort && sort !== "null") {
      const sortParam: Sort = JSON.parse(sort);
      const { data: properties, error } = await Supabase.from("properties")
        .select("id, name, address, price, rating, image")
        .order(`${Object.keys(sortParam)[0]}`, {
          ascending: Object.values(sortParam)[0] === "ascending",
        })
        .range(range[0], range[1]);

      if (error) {
        console.error(error);
        return [];
      }
      return properties;
    } else {
      const { data: properties, error } = await Supabase.from("properties")
        .select("id, name, address, price, rating, image")
        .range(range[0], range[1]);

      if (error) {
        console.error(error);
        return [];
      }

      return properties;
    }
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getLatestProperties = async ({
  filter,
  range,
  sort,
}: PropertyParameter): Promise<Array<PropertyReturnType> | [] | null> => {
  try {
    if (filter && filter !== "All") {
      if (sort && sort !== "null") {
        const sortParam: Sort = JSON.parse(sort);
        const { data: properties, error } = await Supabase.from("properties")
          .select("id, name, address, price, rating, image")
          .eq("type", filter)
          .order(`${Object.keys(sortParam)[0]}`, {
            ascending: Object.values(sortParam)[0] === "ascending",
          })
          .range(range[0], range[1]);

        if (error) {
          console.error(error);
          return [];
        }
        return properties;
      }
      const { data: properties, error } = await Supabase.from("properties")
        .select("id, name, address, price, rating, image")
        .eq("type", filter)
        .range(range[0], range[1]);

      if (error) {
        console.error(error);
        return [];
      }

      return properties;
    } else {
      if (sort && sort !== "null") {
        const sortParam: Sort = JSON.parse(sort);
        const { data: properties, error } = await Supabase.from("properties")
          .select("id, name, address, price, rating, image")
          .range(range[0], range[1])
          .order(`${Object.keys(sortParam)[0]}`, {
            ascending: Object.values(sortParam)[0] === "ascending",
          });
        if (error) {
          console.error(error);
          return [];
        }
        return properties;
      }
      const { data: properties, error } = await Supabase.from("properties")
        .select("id, name, address, price, rating, image")
        .range(range[0], range[1]);

      if (error) {
        console.error(error);
        return [];
      }

      return properties;
    }
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getSearchedProperties = async ({
  query,
  filter,
  range,
  propFilter,
}: PropertyParameter): Promise<Array<PropertyReturnType> | [] | null> => {
  try {
    if (propFilter && propFilter !== "null") {
      const filters: Filters = JSON.parse(propFilter);
      if (query) {
        let { data: properties, error } = await Supabase.from("properties")
          .select("id, name, address, price, rating, image")
          .contains("facilities", filters.facilities)
          .gte("price", filters.range[0])
          .gte("area", filters.areaRange[0])
          .lte("price", filters.range[1])
          .lte("area", filters.areaRange[1])
          .in("type", filters.propertyType)
          .eq("bathrooms", filters.bathroomCount)
          .eq("bedrooms", filters.bedroomCount)
          .or(`name.ilike.%${query}%, address.ilike.%${query}%`);

        if (error) {
          console.error(error);
          return [];
        }
        return properties;
      }
      let { data: properties, error } = await Supabase.from("properties")
        .select("id, name, address, price, rating, image")
        .contains("facilities", filters.facilities)
        .gte("price", filters.range[0])
        .gte("area", filters.areaRange[0])
        .lte("price", filters.range[1])
        .lte("area", filters.areaRange[1])
        .in("type", filters.propertyType)
        .eq("bathrooms", filters.bathroomCount)
        .eq("bedrooms", filters.bedroomCount);

      if (error) {
        console.error(error);
        return [];
      }
      return properties;
    }
    if (query && filter && !(filter === "All")) {
      const { data: properties, error } = await Supabase.from("properties")
        .select("id, name, address, price, rating, image")
        .eq("type", filter)
        .or(`name.ilike.%${query}%, address.ilike.%${query}%`)
        .range(range[0], range[1]);

      if (error) {
        console.error(error);
        return [];
      }
      return properties;
    } else if (query && (!filter || filter === "All")) {
      const { data: properties, error } = await Supabase.from("properties")
        .select("id, name, address, price, rating, image")
        .or(`name.ilike.%${query}%, address.ilike.%${query}%`)
        .range(range[0], range[1]);

      if (error) {
        console.error(error);
        return [];
      }
      return properties;
    } else {
      return [];
    }
  } catch (error) {
    console.error(error);
    return [];
  }
};

// const sample_data = {
//   address: "123 Property Street, City 2",
//   agent: "19731f2e-c84b-4ea5-80fe-4cb728045c3a",
//   agent_avatar:
//     "https://images.unsplash.com/photo-1544723495-432537d12f6c?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//   agent_email: "agent5@example.com",
//   agent_name: "Agent 5",
//   area: 522,
//   bathrooms: 4,
//   bedrooms: 4,
//   description: "This is the description for Property 2.",
//   facilities: ["Gym", "Laundry", "Parking", "Pet friendly"],
//   gallery_images: [
//     "https://images.unsplash.com/photo-1635108198979-9806fdf275c6?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//     "https://images.unsplash.com/photo-1604328702728-d26d2062c20b?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//     "https://unsplash.com/photos/comfort-room-with-white-bathtub-and-brown-wooden-cabinets-CMejBwGAdGk",
//     "https://images.unsplash.com/photo-1621293954908-907159247fc8?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//     "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//     "https://images.unsplash.com/photo-1560185009-dddeb820c7b7?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//     "https://images.unsplash.com/photo-1638799869566-b17fa794c4de?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//     "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//   ],
//   geolocation: "192.168.1.2, 192.168.1.2",
//   id: "14034e79-609a-447f-ab51-01cdb413c47b",
//   image:
//     "https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//   name: "Property 2",
//   price: 1138,
//   rating: 1,
//   review_count: 3,
//   top_reviews: [
//     {
//       avatar:
//         "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//       created_at: "2025-05-12T15:42:03.506165+00:00",
//       id: "cb4d9d8c-2e03-4095-abc5-950119ad5242",
//       name: "Reviewer 2-1",
//       property: "14034e79-609a-447f-ab51-01cdb413c47b",
//       rating: 1,
//       review: "This is a review for Property 2 by Reviewer 2-1.",
//     },
//   ],
//   type: "House",
// };
export const getPropertyDetail = async ({
  property_id,
}: {
  property_id: string;
}): Promise<propertyOverviewReturnType | null> => {
  try {
    let { data, error } = await Supabase.rpc("get_property_overview", {
      property_id,
    });
    // console.log(data)
    if (error) {
      console.error(error);
      return null;
    } else return data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getPropertyById = async <T>(
  propertyIdArr: Array<T>
): Promise<Array<PropertyReturnType> | null> => {
  try {
    const { data, error } = await Supabase.from("properties")
      .select("id, name, address, price, rating, image")
      .in("id", propertyIdArr);

    if (error) {
      console.error(error);
      return null;
    }
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getPropertyFromId = async ({
  propertyIdArr,
}: {
  propertyIdArr: Array<string>;
}) => {
  try {
    const { data, error } = await Supabase.from("properties")
      .select("id, name, image, address, price, rating")
      .in("id", propertyIdArr);

    if (error) {
      console.error(error);
      return null;
    }
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

// const sample_data = {
//   area_summary: { max_area: 3377, min_area: 522 },
//   price_ranges: [
//     { property_count: 1, range_end: 1600, range_start: 1100 },
//     { property_count: 2, range_end: 1900, range_start: 1400 },
//     { property_count: 1, range_end: 2600, range_start: 2100 },
//     { property_count: 1, range_end: 4100, range_start: 3600 },
//     { property_count: 1, range_end: 5400, range_start: 4900 },
//     { property_count: 1, range_end: 5600, range_start: 5100 },
//     { property_count: 1, range_end: 5800, range_start: 5300 },
//     { property_count: 1, range_end: 6100, range_start: 5600 },
//     { property_count: 1, range_end: 6400, range_start: 5900 },
//     { property_count: 1, range_end: 6500, range_start: 6000 },
//     { property_count: 1, range_end: 7200, range_start: 6700 },
//     { property_count: 1, range_end: 7500, range_start: 7000 },
//     { property_count: 1, range_end: 7600, range_start: 7100 },
//     { property_count: 1, range_end: 8600, range_start: 8100 },
//     { property_count: 1, range_end: 9100, range_start: 8600 },
//     { property_count: 1, range_end: 9600, range_start: 9100 },
//     { property_count: 1, range_end: 10300, range_start: 9800 },
//     { property_count: 2, range_end: 10400, range_start: 9900 },
//   ],
// };
export const getFilterDetail =
  async (): Promise<FilterDetailReturnType | null> => {
    try {
      let { data, error } = await Supabase.rpc("get_property_price_histogram");
      if (error) {
        console.error(error);
        return null;
      } else {
        return data;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  };

// const samapleData = {
//   avatar:
//     "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//   created_at: "2025-05-12T15:42:01.901293+00:00",
//   id: "b802597e-2874-494b-a23b-579d67a64765",
//   name: "Reviewer 1-1",
//   property: "7ff9c4b2-7848-4cb4-b975-6c47c5d98d76",
//   rating: 1,
//   review: "This is a review for Property 1 by Reviewer 1-1.",
// };
export const getReviews = async ({
  propertyId,
  filter,
  range,
}: {
  propertyId: string;
  filter: "ascending" | "descending";
  range: Array<number | number>;
}): Promise<Array<ReviewReturn> | null | []> => {
  try {
    if (propertyId) {
      const { data, error } = await Supabase.from("reviews")
        .select("*")
        .eq("property", propertyId)
        .range(range[0], range[1])
        .order("created_at", { ascending: filter === "ascending" });

      if (error) {
        console.error(error);
        return [];
      }
      return data;
    }
    return null;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getWishlistedPropertyId = async ({
  userId,
}: {
  userId: string | undefined;
}): Promise<Array<{ property: string | null }> | null> => {
  try {
    if (userId) {
      const { data, error } = await Supabase.from("wishlist")
        .select("property")
        .eq("user", userId);
      if (error) {
        console.error(error);
        return null;
      }
      return data;
    }
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const updateWishlist = async ({
  propertyId,
  userId,
  operation,
}: {
  propertyId: string | null;
  userId?: string;
  operation: string | null;
}) => {
  try {
    if (operation === "insert") {
      const { data, error } = await Supabase.from("wishlist").insert([
        {
          user: userId,
          property: propertyId,
        },
      ]);
      return error;
    } else {
      const { data, error } = await Supabase.from("wishlist")
        .delete()
        .eq("property", propertyId);
      return error;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getWishlistProperty = async ({
  filter,
  query,
  range,
  propFilter,
  userId,
}: PropertyParameter & {
  userId: string | undefined;
}): Promise<Array<PropertyReturnType> | null> => {
  try {
    if (propFilter && propFilter !== "null") {
      const filters: Filters = JSON.parse(propFilter);
      if (query) {
        let { data: properties, error } = await Supabase.rpc(
          "get_user_wishlist_properties",
          {
            p_user_id: userId,
          }
        )
          .contains("facilities", filters.facilities)
          .gte("price", filters.range[0])
          .gte("area", filters.areaRange[0])
          .lte("price", filters.range[1])
          .lte("area", filters.areaRange[1])
          .in("type", filters.propertyType)
          .eq("bathrooms", filters.bathroomCount)
          .eq("bedrooms", filters.bedroomCount)
          .or(`name.ilike.%${query}%, address.ilike.%${query}%`);

        if (error) {
          console.error(error);
          return null;
        }
        return properties;
      }
      console.log("propfilter");
      let { data: properties, error } = await Supabase.rpc(
        "get_user_wishlist_properties",
        {
          p_user_id: userId,
        }
      )
        .contains("facilities", filters.facilities)
        .gte("price", filters.range[0])
        .gte("area", filters.areaRange[0])
        .lte("price", filters.range[1])
        .lte("area", filters.areaRange[1])
        .in("type", filters.propertyType)
        .eq("bathrooms", filters.bathroomCount)
        .eq("bedrooms", filters.bedroomCount);

      if (error) {
        console.error(error);
        return null;
      }
      return properties;
    } else if (query && filter && !(filter === "All")) {
      let { data: properties, error } = await Supabase.rpc(
        "get_user_wishlist_properties",
        {
          p_user_id: userId,
        }
      )
        .eq("type", filter)
        .or(`name.ilike.%${query}%, address.ilike.%${query}%`)
        .range(range[0], range[1]);

      if (error) {
        console.error(error);
        return null;
      }
      return properties;
    } else if (query && (!filter || filter === "All")) {
      let { data: properties, error } = await Supabase.rpc(
        "get_user_wishlist_properties",
        {
          p_user_id: userId,
        }
      )
        .or(`name.ilike.%${query}%, address.ilike.%${query}%`)
        .range(range[0], range[1]);

      if (error) {
        console.error(error);
        return null;
      }
      return properties;
    } else {
      if (filter && filter !== "All") {
        const { data: properties, error } = await Supabase.rpc(
          "get_user_wishlist_properties",
          {
            p_user_id: userId,
          }
        )
          .eq("type", filter)
          .range(range[0], range[1]);

        if (error) {
          console.error(error);
          return [];
        }
        return properties;
      } else {
        const { data: properties, error } = await Supabase.rpc(
          "get_user_wishlist_properties",
          {
            p_user_id: userId,
          }
        ).range(range[0], range[1]);

        if (error) {
          console.error(error);
          return [];
        }
        return properties;
      }
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getConverationIds = async ({
  userId,
}: {
  userId: string | undefined;
}): Promise<Array<{ id: string }> | null> => {
  try {
    if (userId) {
      const { data, error } = await Supabase.from("conversations")
        .select("id")
        .eq("user", userId);
      if (error) {
        console.error(error);
        return null;
      }
      return data;
    }
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

// const sample_data = {
//   agent_avatar:
//     "https://images.unsplash.com/photo-1691335053879-02096d6ee2ca?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//   agent_id: "04b257ea-3253-4972-ae7f-628fabc49af4",
//   agent_name: "Agent 2",
//   conversation_id: "f965d7d1-e322-417e-a566-dc02cca6599c",
//   last_message:
//     "Sure whatever you like rent it anytime you want, all the properties are available. Is there anything else I can help you with?",
//   last_message_time: "2025-06-09T07:03:03.680662+00:00",
//   unread_count: 1,
// };
export const getChatOverview = async ({
  user_id,
  range,
  conversation_arr,
}: {
  user_id: string | undefined;
  range: Array<number | number>;
  conversation_arr: {
    conversation_id: string;
    last_message_time: Date;
  }[];
}): Promise<Array<ChatOverviewReturnType> | null> => {
  try {
    if (!user_id) {
      return null;
    }
    const { data, error } = await Supabase.rpc(
      "get_chat_overview_with_unread_optimized",
      {
        p_user_id: user_id,
        p_conversations: conversation_arr,
      }
    )
      .select("*")
      .range(range[0], range[1]);
    if (error) {
      console.error(error);
      return null;
    }
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getCompleteChat = async ({
  conversation_id,
  agent_id,
}: {
  conversation_id: string | undefined;
  agent_id: string | undefined;
}): Promise<Array<ChatReturnType> | null> => {
  try {
    if (conversation_id) {
      const { data, error } = await Supabase.from("messages")
        .select(
          "id, message, created_at, sender_id, status, property_ref, file"
        )
        .eq("conversation_id", conversation_id)
        .or(`sender_id.eq.${agent_id}, receiver_id.eq.${agent_id}`)
        .order("created_at", { ascending: true });
      if (error) {
        console.error(error);
        return null;
      }

      return data.reverse();
    }
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const changeMessageStatus = async (
  conversation_id: string | undefined,
  status: "received" | "read"
) => {
  try {
    if (status === "received") {
      const { data, error } = await Supabase.from("messages")
        .update({
          status: "received",
        })
        .eq("conversation_id", conversation_id)
        .eq("status", "sent");
      return error;
    } else {
      const { data, error } = await Supabase.from("messages")
        .update({
          status: "received",
        })
        .eq("conversation_id", conversation_id)
        .or("status.eq.received, status.eq.sent");
      return error;
    }
  } catch (error) {
    console.error(error);
    return error;
  }
};

export const createConversation = async ({
  data,
}: {
  data: {
    user_id: string;
    agent_id: string;
  };
}): Promise<{ id: string } | null> => {
  try {
    const { data: conversationId, error } = await Supabase.from("conversations")
      .insert([
        {
          agent_id: data.agent_id,
          user_id: data.user_id,
        },
      ])
      .select("id")
      .single();
    if (error) {
      console.error(error);
      return null;
    }
    return conversationId;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getAgentData = async (agentId: string) => {
  try {
    const { data, error } = await Supabase.from("agents")
      .select("avatar")
      .eq("id", agentId);

    if (error) {
      console.error(error);
      return null;
    }

    return data[0];
  } catch (error) {
    console.error(error);
    return null;
  }
};
