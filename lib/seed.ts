import { Supabase } from "./supabase"; // Your configured Supabase client
import {
  agentImages,
  galleryImages,
  propertiesImages,
  reviewImages,
} from "./data";

const propertyTypes = [
  "House",
  "Townhouse",
  "Condo",
  "Duplex",
  "Studio",
  "Villa",
  "Apartment",
  "Other",
];

const facilities = [
  "Laundry",
  "Parking",
  "Gym",
  "Pet friendly",
  "Wi-fi",
  "Swimming pool",
];

function getRandomSubset<T>(array: T[], min: number, max: number): T[] {
  const subsetSize = Math.floor(Math.random() * (max - min + 1)) + min;
  return [...array].sort(() => 0.5 - Math.random()).slice(0, subsetSize);
}

async function seed() {
  try {
    // Clear tables
    await Supabase.from("properties").delete().neq("id", "");
    await Supabase.from("galleries").delete().neq("id", "");
    await Supabase.from("reviews").delete().neq("id", "");
    await Supabase.from("agents").delete().neq("id", "");

    console.log("Cleared all existing data.");

    // Seed Agents
    const agents = [];
    for (let i = 1; i <= 5; i++) {
      const { data, error } = await Supabase.from("agents")
        .insert({
          name: `Agent ${i}`,
          email: `agent${i}@example.com`,
          avatar: agentImages[Math.floor(Math.random() * agentImages.length)],
        })
        .select()
        .single();

      if (error) throw error;
      agents.push(data);
    }

    console.log(`Seeded ${agents.length} agents.`);

    // Seed Properties
    for (let i = 1; i <= 20; i++) {
      const assignedAgent = agents[Math.floor(Math.random() * agents.length)];
      const selectedFacilities = getRandomSubset(facilities, 3, 6);

      const image =
        propertiesImages[i] ||
        propertiesImages[Math.floor(Math.random() * propertiesImages.length)];

      // Insert Property
      const { data: property, error: propertyError } = await Supabase.from(
        "properties"
      )
        .insert({
          name: `Property ${i}`,
          type: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
          description: `This is the description for Property ${i}.`,
          address: `123 Property Street, City ${i}`,
          geolocation: `192.168.1.${i}, 192.168.1.${i}`,
          price: Math.floor(Math.random() * 9000) + 1000,
          area: Math.floor(Math.random() * 3000) + 500,
          bedrooms: Math.floor(Math.random() * 5) + 1,
          bathrooms: Math.floor(Math.random() * 5) + 1,
          rating: Math.floor(Math.random() * 5) + 1,
          facilities: selectedFacilities,
          image,
          agent: assignedAgent.id,
        })
        .select()
        .single();

      if (propertyError) throw propertyError;

      // Insert Reviews for this Property
      const reviewCount = Math.floor(Math.random() * 3) + 2; // 2 to 4 reviews
      for (let r = 0; r < reviewCount; r++) {
        const reviewerIndex = Math.floor(Math.random() * reviewImages.length);
        const { error: reviewError } = await Supabase.from("reviews").insert({
          name: `Reviewer ${i}-${r + 1}`,
          avatar: reviewImages[reviewerIndex],
          review: `This is a review for Property ${i} by Reviewer ${i}-${
            r + 1
          }.`,
          rating: Math.floor(Math.random() * 5) + 1,
          property: property.id, // ⬅️ Link to property
        });

        if (reviewError) throw reviewError;
      }

      // Insert Gallery Images for this Property
      const assignedGalleryImages = getRandomSubset(galleryImages, 3, 8); // 3–8 images
      for (const galleryImage of assignedGalleryImages) {
        const { error: galleryError } = await Supabase.from("galleries").insert(
          {
            image: galleryImage,
            property: property.id, // foreign key
          }
        );
        if (galleryError) throw galleryError;
      }

      console.log(`Seeded property: ${property.name}`);
    }

    console.log("Data seeding completed.");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
}

export default seed;
