import { ImageSourcePropType } from "react-native";
import icons from "./icons";
import images from "./images";

export const cards = [
  {
    title: "Card 1",
    location: "Location 1",
    price: "$100",
    rating: 4.8,
    category: "house",
    image: images.newYork,
  },
  {
    title: "Card 2",
    location: "Location 2",
    price: "$200",
    rating: 3,
    category: "house",
    image: images.japan,
  },
  {
    title: "Card 3",
    location: "Location 3",
    price: "$300",
    rating: 2,
    category: "flat",
    image: images.newYork,
  },
  {
    title: "Card 4",
    location: "Location 4",
    price: "$400",
    rating: 5,
    category: "villa",
    image: images.japan,
  },
];

export const featuredCards = [
  {
    title: "Featured 1",
    location: "Location 1",
    price: "$100",
    rating: 4.8,
    image: images.newYork,
    category: "house",
  },
  {
    title: "Featured 2",
    location: "Location 2",
    price: "$200",
    rating: 3,
    image: images.japan,
    category: "flat",
  },
];

export const categories = [
  { title: "All", category: "All", icon: icons.all },
  { title: "Houses", category: "House", icon: icons.house },
  { title: "Condos", category: "Condo", icon: icons.condo },
  { title: "Duplexes", category: "Duplex", icon: icons.duplex },
  { title: "Studios", category: "Studio", icon: icons.studio },
  { title: "Villas", category: "Villa", icon: icons.villa },
  { title: "Apartments", category: "Apartment", icon: icons.apartment },
  { title: "Townhouses", category: "Townhouse", icon: icons.townhouse },
  { title: "Others", category: "Other", icon: icons.more },
];

export const areaRange = [
  { title: "0.5 km", value: 0.5, icon: icons.location_marker },
  { title: "1 km", value: 1, icon: icons.location_marker },
  { title: "2 km", value: 2, icon: icons.location_marker },
  { title: "3 km", value: 3, icon: icons.location_marker },
  { title: "5 km", value: 5, icon: icons.location_marker },
  { title: "10 km", value: 10, icon: icons.location_marker },
  { title: "15 km", value: 15, icon: icons.location_marker },
  { title: "25 km", value: 25, icon: icons.location_marker },
  { title: "50 km", value: 50, icon: icons.location_marker },
  { title: "100 km", value: 100, icon: icons.location_marker },
];

export const settings = [
  {
    title: "My Bookings",
    icon: icons.calendar,
  },
  {
    title: "Payments",
    icon: icons.wallet,
  },
  {
    title: "Profile",
    icon: icons.profile_outline,
  },
  {
    title: "Notifications",
    icon: icons.bell,
  },
  {
    title: "Security",
    icon: icons.shield,
  },
  {
    title: "Language",
    icon: icons.language,
  },
  {
    title: "Help Center",
    icon: icons.info,
  },
  {
    title: "Invite Friends",
    icon: icons.people,
  },
];

export const facilities: Array<{ title: string; icon: ImageSourcePropType }> = [
  {
    title: "Laundry",
    icon: icons.laundry,
  },
  {
    title: "Parking",
    icon: icons.carPark,
  },
  {
    title: "Sports Center",
    icon: icons.run,
  },
  {
    title: "Cutlery",
    icon: icons.cutlery,
  },
  {
    title: "Gym",
    icon: icons.dumbell,
  },
  {
    title: "Swimming pool",
    icon: icons.swim,
  },
  {
    title: "Wi-fi",
    icon: icons.wifi,
  },
  {
    title: "Pet friendly",
    icon: icons.dog,
  },
];

export const gallery = [
  {
    id: 1,
    image: images.newYork,
  },
  {
    id: 2,
    image: images.japan,
  },
  {
    id: 3,
    image: images.newYork,
  },
  {
    id: 4,
    image: images.japan,
  },
  {
    id: 5,
    image: images.newYork,
  },
  {
    id: 6,
    image: images.japan,
  },
];

export const propertyDetail = {
  name: "Mordernica Apartment",
  address: "Grand City St. 100, New York, United States",
  rating: 4.5,
  description:
    "Sleek, modern 2-bedroom apartment with open living space. high-end finishes. and city views. Minutes from downtown. dining. and transit.",
  type: "Apartment",
  price: "2100",
  bedrooms: 8,
  bathrooms: 3,
  image:
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  area: 2000,
  geolocation: "192.168.1.20, 192.168.1.20",
  facilities: [
    "Laundry",
    "Parking",
    "Gym",
    "Pet friendly",
    "Wi-fi",
    "Swimming pool",
  ],
  agent: "123",
  agent_name: "Natasya Wildora",
  agent_email: "samanta.n1962@gmail.com",
  agent_avatar:
    "https://images.unsplash.com/photo-1691335053879-02096d6ee2ca?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  gallery_images: [
    "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1621293954908-907159247fc8?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1604328702728-d26d2062c20b?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  ],
  top_reviews: [
    {
      id: "12345",
      name: "Charolette Hanlin",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      review: "This is a review for Property 2 by Reviewer 2-3.",
      created_at: "2025-05-12 15:42:03.797772+00",
    },
  ],
  review_count: 1275,
};

export const propertyPriceRange = [
  {
    range_start: 1100,
    range_end: 1600,
    property_count: 1,
  },
  {
    range_start: 1400,
    range_end: 1900,
    property_count: 2,
  },
  {
    range_start: 2100,
    range_end: 2600,
    property_count: 1,
  },
  {
    range_start: 3600,
    range_end: 4100,
    property_count: 1,
  },
  {
    range_start: 4900,
    range_end: 5400,
    property_count: 1,
  },
  {
    range_start: 5100,
    range_end: 5600,
    property_count: 1,
  },
  {
    range_start: 5300,
    range_end: 5800,
    property_count: 1,
  },
  {
    range_start: 5600,
    range_end: 6100,
    property_count: 1,
  },
  {
    range_start: 5900,
    range_end: 6400,
    property_count: 1,
  },
  {
    range_start: 6000,
    range_end: 6500,
    property_count: 1,
  },
  {
    range_start: 6700,
    range_end: 7200,
    property_count: 1,
  },
  {
    range_start: 7000,
    range_end: 7500,
    property_count: 1,
  },
  {
    range_start: 7100,
    range_end: 7600,
    property_count: 1,
  },
  {
    range_start: 8100,
    range_end: 8600,
    property_count: 1,
  },
  {
    range_start: 8600,
    range_end: 9100,
    property_count: 1,
  },
  {
    range_start: 9100,
    range_end: 9600,
    property_count: 1,
  },
  {
    range_start: 9800,
    range_end: 10300,
    property_count: 1,
  },
  {
    range_start: 9900,
    range_end: 10400,
    property_count: 2,
  },
];
