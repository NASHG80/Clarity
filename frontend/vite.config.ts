import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";

function nluMockPlugin(): Plugin {
  return {
    name: "nlu-mock-plugin",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/api/nlu/extract" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", () => {
            try {
              const { text = "" } = JSON.parse(body || "{}");

              if (text.includes("FAIL_TEST") || text.includes("SIMULATE_FAIL")) {
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "Simulated extraction failure" }));
                return;
              }

              // Canonical contract response matching docs/API_CONTRACT.md:
              // Only explicitly stated fields are populated. Never fabricate origin or destination.
              const lower = text.toLowerCase();

              let origin: string | undefined = undefined;
              let destination: string | undefined = undefined;

              // Match patterns like "from <X> to <Y>" or "<X> to <Y>"
              const fromToMatch = text.match(/(?:from\s+)?([A-Za-z]+)\s+to\s+([A-Za-z]+)/i);
              if (fromToMatch) {
                const rawOrigin = fromToMatch[1].trim();
                const rawDest = fromToMatch[2].trim();
                if (!['want', 'going', 'plan', 'planning'].includes(rawOrigin.toLowerCase())) {
                  origin = rawOrigin.charAt(0).toUpperCase() + rawOrigin.slice(1);
                  destination = rawDest.charAt(0).toUpperCase() + rawDest.slice(1);
                }
              }

              const knownCities = [
                'mumbai', 'goa', 'delhi', 'bengaluru', 'bangalore', 'jaipur',
                'mysore', 'kochi', 'alleppey', 'pune', 'chennai', 'hyderabad',
                'kolkata', 'ahmedabad', 'varanasi', 'shimla', 'manali', 'rishikesh',
                'agra', 'udaipur', 'coorg', 'wayanad'
              ];

              if (!origin) {
                const fromCityMatch = text.match(/from\s+([A-Za-z]+)/i);
                if (fromCityMatch) {
                  const city = fromCityMatch[1].trim();
                  origin = city.charAt(0).toUpperCase() + city.slice(1);
                }
              }

              if (!destination) {
                const toCityMatch = text.match(/to\s+([A-Za-z]+)/i);
                if (toCityMatch) {
                  const city = toCityMatch[1].trim();
                  destination = city.charAt(0).toUpperCase() + city.slice(1);
                } else {
                  // Direct city mention (e.g. "Goa")
                  for (const city of knownCities) {
                    const regex = new RegExp(`\\b${city}\\b`, 'i');
                    if (regex.test(text)) {
                      if (!origin || origin.toLowerCase() !== city) {
                        destination = city.charAt(0).toUpperCase() + city.slice(1);
                        break;
                      }
                    }
                  }
                }
              }

              // Passenger counts - extracted ONLY if explicitly stated
              let adult_count: number | undefined = undefined;
              let children_count: number | undefined = undefined;
              let senior_count: number | undefined = undefined;

              const adultMatch = text.match(/(\d+)\s*adult/i);
              if (adultMatch) {
                adult_count = parseInt(adultMatch[1], 10);
              }

              const childMatch = text.match(/(\d+)\s*(?:child|children|kid)/i);
              if (childMatch) {
                children_count = parseInt(childMatch[1], 10);
              }

              const seniorMatch = text.match(/(\d+)\s*(?:senior|elderly)/i);
              if (seniorMatch) {
                senior_count = parseInt(seniorMatch[1], 10);
              }

              // Accessibility flags:
              // 1. Explicit detailed requirements (canonical IDs)
              const accessibility_flags: string[] = [];
              if (lower.includes("step-free") || lower.includes("step free") || lower.includes("step_free")) {
                accessibility_flags.push("step_free_entrance");
              }
              if (lower.includes("elevator") || lower.includes("lift")) {
                accessibility_flags.push("elevator");
              }
              if (lower.includes("roll-in shower") || lower.includes("roll in shower") || lower.includes("roll_in_shower")) {
                accessibility_flags.push("roll_in_shower");
              }
              if (lower.includes("wheelchair room") || lower.includes("wheelchair accessible room") || lower.includes("wheelchair-accessible room")) {
                accessibility_flags.push("wheelchair_accessible_room");
              }
              if (lower.includes("accessible toilet") || lower.includes("disabled toilet")) {
                accessibility_flags.push("accessible_toilet");
              }
              if (lower.includes("low walking") || lower.includes("minimal walking") || lower.includes("low walking distance")) {
                accessibility_flags.push("low_walking_distance");
              }
              if (lower.includes("accessible public transport")) {
                accessibility_flags.push("accessible_public_transport");
              }
              if (lower.includes("visual assistance") || lower.includes("braille") || lower.includes("tactile")) {
                accessibility_flags.push("visual_assistance");
              }
              if (lower.includes("hearing assistance") || lower.includes("hearing loop")) {
                accessibility_flags.push("hearing_assistance");
              }

              // 2. Coarse / general flags (only when general terms are used)
              if (lower.includes("wheelchair") && !accessibility_flags.includes("wheelchair_accessible_room")) {
                accessibility_flags.push("wheelchair");
              }
              if ((lower.includes("transport") || lower.includes("vehicle") || lower.includes("cab")) && !accessibility_flags.includes("accessible_public_transport")) {
                accessibility_flags.push("accessible_transport");
              }
              if (lower.includes("hotel") || lower.includes("accommodation") || lower.includes("resort") || lower.includes("stay")) {
                accessibility_flags.push("accessible_accommodation");
              }

              const extracted: Record<string, any> = {};
              if (origin) extracted.origin = origin;
              if (destination) extracted.destination = destination;
              if (adult_count !== undefined) extracted.adult_count = adult_count;
              if (children_count !== undefined) extracted.children_count = children_count;
              if (senior_count !== undefined) extracted.senior_count = senior_count;
              if (accessibility_flags.length > 0) extracted.accessibility_flags = accessibility_flags;

              const missing_or_ambiguous: { field: string; prompt: string }[] = [];
              if (!origin) {
                missing_or_ambiguous.push({
                  field: "origin",
                  prompt: "Where will you be traveling from?",
                });
              }
              if (!destination) {
                missing_or_ambiguous.push({
                  field: "destination",
                  prompt: "Where do you want to travel to?",
                });
              }
              if (adult_count === undefined) {
                missing_or_ambiguous.push({
                  field: "adult_count",
                  prompt: "How many adults are traveling?",
                });
              }

              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  extracted,
                  missing_or_ambiguous,
                })
              );
            } catch {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Invalid JSON body" }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), nluMockPlugin()],
});
