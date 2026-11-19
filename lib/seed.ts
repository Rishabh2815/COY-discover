// 36 mock profiles. LIKES_ME marks the ones that have already liked the demo user,
// so matches can be produced on demand. That fact lives only in the `swipes` table
// and is never exposed by any API response.
type Row = [name: string, age: number, location: string, bio: string, interests: string[]];

const ROWS: Row[] = [
  ["Aanya", 21, "Delhi · Miranda House", "Poetry slams, filter coffee, and losing at Catan.", ["Poetry", "Coffee", "Board games"]],
  ["Riya", 22, "Delhi · DU North Campus", "Third-floor hostel legend. Will trade playlists for momos.", ["Momos", "Indie music", "Photography"]],
  ["Kabir", 23, "Delhi · IIT Delhi", "Builds robots by day, bakes terrible bread by night.", ["Robotics", "Baking", "Cricket"]],
  ["Ishaan", 24, "Gurugram · Product designer", "Sketchbook in my bag, Figma in my soul.", ["Design", "Sketching", "Running"]],
  ["Meera", 20, "Mumbai · St. Xavier's", "Film-school kid. Ask me about my favourite Ray movie.", ["Cinema", "Theatre", "Chai"]],
  ["Arjun", 25, "Bangalore · Software engineer", "Weekend cyclist. Weekday debugger.", ["Cycling", "Open source", "Ramen"]],
  ["Zoya", 22, "Hyderabad · IIIT-H", "Biryani loyalist, ML enthusiast, karaoke menace.", ["Biryani", "ML", "Karaoke"]],
  ["Vihaan", 21, "Pune · COEP", "Guitar, gully cricket, and long drives to Lonavala.", ["Guitar", "Cricket", "Road trips"]],
  ["Tara", 23, "Delhi · JNU", "Reading Murakami at Dhaba at 2am. Join me?", ["Books", "Late-night walks", "Politics"]],
  ["Rohan", 24, "Noida · Startup founder", "Fundraising, football, and far too many tabs open.", ["Startups", "Football", "Podcasts"]],
  ["Naina", 21, "Chandigarh · Panjab University", "Dance society captain. Bhangra is a lifestyle.", ["Dance", "Fashion", "Street food"]],
  ["Dev", 22, "Jaipur · MNIT", "Chess nerd. Lost to a nine-year-old last week.", ["Chess", "Sketching", "Trekking"]],
  ["Sara", 20, "Kolkata · Presidency", "Adda, rolls, and rooftop sunsets.", ["Adda", "Photography", "Rolls"]],
  ["Aditya", 25, "Bangalore · Data analyst", "Climbing gym regular. Excel wizard (sorry).", ["Climbing", "Data", "Craft beer"]],
  ["Mehak", 22, "Delhi · Lady Shri Ram", "Economics major, amateur potter, pro napper.", ["Pottery", "Economics", "Brunch"]],
  ["Kunal", 23, "Delhi · DTU", "Hackathon addict. Will fix your laptop for samosas.", ["Hackathons", "Samosas", "Gaming"]],
  ["Ananya", 21, "Mumbai · NMIMS", "Stand-up open mics and terrible puns.", ["Comedy", "Puns", "Thrifting"]],
  ["Sahil", 24, "Gurugram · Consultant", "Padel on weekends, pasta on weeknights.", ["Padel", "Cooking", "Travel"]],
  ["Ira", 20, "Pune · Symbiosis", "Psych student. Yes, I'm analysing you. Kindly.", ["Psychology", "Journaling", "Indie films"]],
  ["Pranav", 22, "Hyderabad · BITS Hyderabad", "Quizzing circuit veteran. Ask me anything. Anything.", ["Quizzing", "Anime", "Chai"]],
  ["Diya", 23, "Delhi · NSUT", "Embedded systems and ethnic-wear shopping.", ["Electronics", "Fashion", "Yoga"]],
  ["Neel", 21, "Ahmedabad · NID", "Typography nerd. Will judge your fonts.", ["Typography", "Cycling", "Chai"]],
  ["Kiara", 22, "Mumbai · Wilson College", "Marine biology dreams, Marine Drive evenings.", ["Ocean", "Sunsets", "Journaling"]],
  ["Yash", 24, "Noida · Backend engineer", "Go, gym, and gaming. In that order, mostly.", ["Go", "Gym", "Gaming"]],
  ["Simran", 21, "Amritsar · GNDU", "Folk music, lassi, and slow mornings.", ["Folk music", "Lassi", "Poetry"]],
  ["Aarav", 23, "Bangalore · IISc", "Physics PhD. Will explain black holes on first date.", ["Physics", "Stargazing", "Filter coffee"]],
  ["Myra", 22, "Delhi · Ambedkar University", "Sociology, street photography, and chai tapris.", ["Photography", "Sociology", "Chai"]],
  ["Karan", 25, "Gurugram · Finance", "Spreadsheets by day, stand-up comedy by night.", ["Finance", "Comedy", "Tennis"]],
  ["Anika", 20, "Jaipur · Banasthali", "Block printing, bookstores, and bad movie nights.", ["Block printing", "Books", "Movies"]],
  ["Veer", 23, "Chandigarh · Chitkara", "Bike rides to Manali. Back by Monday. Maybe.", ["Biking", "Mountains", "Maggi"]],
  ["Pooja", 24, "Pune · Product manager", "Roadmaps, rangoli, and relentless optimism.", ["Product", "Art", "Hiking"]],
  ["Harsh", 22, "Delhi · Hansraj College", "Debate society. I will win this argument and the next.", ["Debate", "Cricket", "Chai"]],
  ["Tanya", 21, "Mumbai · Jai Hind", "Journalism student. Always asking why.", ["Journalism", "Podcasts", "Coffee"]],
  ["Rahul", 26, "Bangalore · Founder", "Third startup is the charm. Probably.", ["Startups", "Running", "Coffee"]],
  ["Sneha", 23, "Hyderabad · ISB", "MBA life. Irani chai is non-negotiable.", ["Irani chai", "Strategy", "Dancing"]],
  ["Nikhil", 22, "Delhi · IIIT Delhi", "Cybersecurity, chess, and cold coffee.", ["Security", "Chess", "Cold coffee"]],
];

export const PROFILES = ROWS.map(([name, age, location, bio, interests], i) => {
  const id = `u${String(i + 1).padStart(2, "0")}`;
  return { id, name, age, location, bio, interests, photo: `https://picsum.photos/seed/coy-${id}/640/860` };
});

// Riya, Meera, Tara, Naina, Aditya, Sahil, Kiara, Myra, Pooja, Sneha
export const LIKES_ME = ["u02", "u05", "u09", "u11", "u14", "u18", "u23", "u27", "u31", "u35"];
