const { supabase, isSupabaseConfigured } = require("../src/lib/supabase");

console.log("Testing database connection...");

// Check if Supabase is configured
if (!isSupabaseConfigured) {
  console.log("Supabase is not configured. Using mock data instead.");
} else {
  console.log("Supabase is configured. Testing connection...");
  
  // Test database connection
  supabase.from("migrations").select("id").limit(1)
    .then(({ data, error }) => {
      if (error && error.code !== "PGRST116") {
        console.error("Error connecting to Supabase:", error);
      } else {
        console.log("Database connection successful.");
      }
    })
    .catch(error => {
      console.error("Error connecting to Supabase:", error);
    });
}
