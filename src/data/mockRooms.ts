export interface Room {
  id: string;
  hostelName: string;
  roomNumber: string;
  roomType: "Single" | "Double" | "Triple";
  price: number;
  capacity: number;
  amenities: string[];
  description: string;
  images: string[];
  hostelLocation?: string;
  hostelType?: "Male" | "Female" | "Both";
  available: boolean;
}

export const mockRooms: Room[] = [
  {
    id: "1",
    hostelName: "Sunrise Boys Hostel",
    roomNumber: "A-101",
    roomType: "Single",
    price: 5000,
    capacity: 1,
    amenities: ["WiFi", "AC", "Attached Bathroom", "Study Table"],
    description: "A cozy single room with all modern amenities, perfect for focused students.",
    images: ["/placeholder.svg"],
    available: true,
  },
  {
    id: "2",
    hostelName: "Sunrise Boys Hostel",
    roomNumber: "B-204",
    roomType: "Double",
    price: 3500,
    capacity: 2,
    amenities: ["WiFi", "Fan", "Common Bathroom", "Wardrobe"],
    description: "Spacious double-sharing room with comfortable beds and storage space.",
    images: ["/placeholder.svg"],
    available: true,
  },
  {
    id: "3",
    hostelName: "Green Valley Hostel",
    roomNumber: "C-302",
    roomType: "Triple",
    price: 2500,
    capacity: 3,
    amenities: ["WiFi", "Fan", "Common Bathroom"],
    description: "Budget-friendly triple-sharing room in a well-maintained hostel.",
    images: ["/placeholder.svg"],
    available: true,
  },
  {
    id: "4",
    hostelName: "Green Valley Hostel",
    roomNumber: "A-105",
    roomType: "Single",
    price: 6000,
    capacity: 1,
    amenities: ["WiFi", "AC", "Attached Bathroom", "Balcony", "Mini Fridge"],
    description: "Premium single room with balcony view and extra amenities.",
    images: ["/placeholder.svg"],
    available: false,
  },
  {
    id: "5",
    hostelName: "City Stay Hostel",
    roomNumber: "D-110",
    roomType: "Double",
    price: 4000,
    capacity: 2,
    amenities: ["WiFi", "AC", "Attached Bathroom", "Study Table"],
    description: "Well-furnished double room near the city center.",
    images: ["/placeholder.svg"],
    available: true,
  },
  {
    id: "6",
    hostelName: "City Stay Hostel",
    roomNumber: "D-112",
    roomType: "Single",
    price: 5500,
    capacity: 1,
    amenities: ["WiFi", "AC", "Attached Bathroom", "Laundry"],
    description: "Modern single room with laundry service included.",
    images: ["/placeholder.svg"],
    available: true,
  },
];
