// vite.config.ts
import { defineConfig } from "file:///C:/Clarity/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Clarity/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
function nluMockPlugin() {
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
              const lower = text.toLowerCase();
              let origin = void 0;
              let destination = void 0;
              const fromToMatch = text.match(/(?:from\s+)?([A-Za-z]+)\s+to\s+([A-Za-z]+)/i);
              if (fromToMatch) {
                const rawOrigin = fromToMatch[1].trim();
                const rawDest = fromToMatch[2].trim();
                if (!["want", "going", "plan", "planning"].includes(rawOrigin.toLowerCase())) {
                  origin = rawOrigin.charAt(0).toUpperCase() + rawOrigin.slice(1);
                  destination = rawDest.charAt(0).toUpperCase() + rawDest.slice(1);
                }
              }
              const knownCities = [
                "mumbai",
                "goa",
                "delhi",
                "bengaluru",
                "bangalore",
                "jaipur",
                "mysore",
                "kochi",
                "alleppey",
                "pune",
                "chennai",
                "hyderabad",
                "kolkata",
                "ahmedabad",
                "varanasi",
                "shimla",
                "manali",
                "rishikesh",
                "agra",
                "udaipur",
                "coorg",
                "wayanad"
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
                  for (const city of knownCities) {
                    const regex = new RegExp(`\\b${city}\\b`, "i");
                    if (regex.test(text)) {
                      if (!origin || origin.toLowerCase() !== city) {
                        destination = city.charAt(0).toUpperCase() + city.slice(1);
                        break;
                      }
                    }
                  }
                }
              }
              let adult_count = void 0;
              let children_count = void 0;
              let senior_count = void 0;
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
              const accessibility_flags = [];
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
              if (lower.includes("wheelchair") && !accessibility_flags.includes("wheelchair_accessible_room")) {
                accessibility_flags.push("wheelchair");
              }
              if ((lower.includes("transport") || lower.includes("vehicle") || lower.includes("cab")) && !accessibility_flags.includes("accessible_public_transport")) {
                accessibility_flags.push("accessible_transport");
              }
              if (lower.includes("hotel") || lower.includes("accommodation") || lower.includes("resort") || lower.includes("stay")) {
                accessibility_flags.push("accessible_accommodation");
              }
              const extracted = {};
              if (origin) extracted.origin = origin;
              if (destination) extracted.destination = destination;
              if (adult_count !== void 0) extracted.adult_count = adult_count;
              if (children_count !== void 0) extracted.children_count = children_count;
              if (senior_count !== void 0) extracted.senior_count = senior_count;
              if (accessibility_flags.length > 0) extracted.accessibility_flags = accessibility_flags;
              const missing_or_ambiguous = [];
              if (!origin) {
                missing_or_ambiguous.push({
                  field: "origin",
                  prompt: "Where will you be traveling from?"
                });
              }
              if (!destination) {
                missing_or_ambiguous.push({
                  field: "destination",
                  prompt: "Where do you want to travel to?"
                });
              }
              if (adult_count === void 0) {
                missing_or_ambiguous.push({
                  field: "adult_count",
                  prompt: "How many adults are traveling?"
                });
              }
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  extracted,
                  missing_or_ambiguous
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
    }
  };
}
var vite_config_default = defineConfig({
  plugins: [react(), nluMockPlugin()]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxDbGFyaXR5XFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxDbGFyaXR5XFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9DbGFyaXR5L2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBQbHVnaW4gfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XHJcblxyXG5mdW5jdGlvbiBubHVNb2NrUGx1Z2luKCk6IFBsdWdpbiB7XHJcbiAgcmV0dXJuIHtcclxuICAgIG5hbWU6IFwibmx1LW1vY2stcGx1Z2luXCIsXHJcbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XHJcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XHJcbiAgICAgICAgaWYgKHJlcS51cmwgPT09IFwiL2FwaS9ubHUvZXh0cmFjdFwiICYmIHJlcS5tZXRob2QgPT09IFwiUE9TVFwiKSB7XHJcbiAgICAgICAgICBsZXQgYm9keSA9IFwiXCI7XHJcbiAgICAgICAgICByZXEub24oXCJkYXRhXCIsIChjaHVuaykgPT4ge1xyXG4gICAgICAgICAgICBib2R5ICs9IGNodW5rO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICByZXEub24oXCJlbmRcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHsgdGV4dCA9IFwiXCIgfSA9IEpTT04ucGFyc2UoYm9keSB8fCBcInt9XCIpO1xyXG5cclxuICAgICAgICAgICAgICBpZiAodGV4dC5pbmNsdWRlcyhcIkZBSUxfVEVTVFwiKSB8fCB0ZXh0LmluY2x1ZGVzKFwiU0lNVUxBVEVfRkFJTFwiKSkge1xyXG4gICAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcbiAgICAgICAgICAgICAgICByZXMuc2V0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vanNvblwiKTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogXCJTaW11bGF0ZWQgZXh0cmFjdGlvbiBmYWlsdXJlXCIgfSkpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgLy8gQ2Fub25pY2FsIGNvbnRyYWN0IHJlc3BvbnNlIG1hdGNoaW5nIGRvY3MvQVBJX0NPTlRSQUNULm1kOlxyXG4gICAgICAgICAgICAgIC8vIE9ubHkgZXhwbGljaXRseSBzdGF0ZWQgZmllbGRzIGFyZSBwb3B1bGF0ZWQuIE5ldmVyIGZhYnJpY2F0ZSBvcmlnaW4gb3IgZGVzdGluYXRpb24uXHJcbiAgICAgICAgICAgICAgY29uc3QgbG93ZXIgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgICAgICAgIGxldCBvcmlnaW46IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgICBsZXQgZGVzdGluYXRpb246IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgICAgICAgLy8gTWF0Y2ggcGF0dGVybnMgbGlrZSBcImZyb20gPFg+IHRvIDxZPlwiIG9yIFwiPFg+IHRvIDxZPlwiXHJcbiAgICAgICAgICAgICAgY29uc3QgZnJvbVRvTWF0Y2ggPSB0ZXh0Lm1hdGNoKC8oPzpmcm9tXFxzKyk/KFtBLVphLXpdKylcXHMrdG9cXHMrKFtBLVphLXpdKykvaSk7XHJcbiAgICAgICAgICAgICAgaWYgKGZyb21Ub01hdGNoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByYXdPcmlnaW4gPSBmcm9tVG9NYXRjaFsxXS50cmltKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByYXdEZXN0ID0gZnJvbVRvTWF0Y2hbMl0udHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFbJ3dhbnQnLCAnZ29pbmcnLCAncGxhbicsICdwbGFubmluZyddLmluY2x1ZGVzKHJhd09yaWdpbi50b0xvd2VyQ2FzZSgpKSkge1xyXG4gICAgICAgICAgICAgICAgICBvcmlnaW4gPSByYXdPcmlnaW4uY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyByYXdPcmlnaW4uc2xpY2UoMSk7XHJcbiAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uID0gcmF3RGVzdC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHJhd0Rlc3Quc2xpY2UoMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBjb25zdCBrbm93bkNpdGllcyA9IFtcclxuICAgICAgICAgICAgICAgICdtdW1iYWknLCAnZ29hJywgJ2RlbGhpJywgJ2JlbmdhbHVydScsICdiYW5nYWxvcmUnLCAnamFpcHVyJyxcclxuICAgICAgICAgICAgICAgICdteXNvcmUnLCAna29jaGknLCAnYWxsZXBwZXknLCAncHVuZScsICdjaGVubmFpJywgJ2h5ZGVyYWJhZCcsXHJcbiAgICAgICAgICAgICAgICAna29sa2F0YScsICdhaG1lZGFiYWQnLCAndmFyYW5hc2knLCAnc2hpbWxhJywgJ21hbmFsaScsICdyaXNoaWtlc2gnLFxyXG4gICAgICAgICAgICAgICAgJ2FncmEnLCAndWRhaXB1cicsICdjb29yZycsICd3YXlhbmFkJ1xyXG4gICAgICAgICAgICAgIF07XHJcblxyXG4gICAgICAgICAgICAgIGlmICghb3JpZ2luKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmcm9tQ2l0eU1hdGNoID0gdGV4dC5tYXRjaCgvZnJvbVxccysoW0EtWmEtel0rKS9pKTtcclxuICAgICAgICAgICAgICAgIGlmIChmcm9tQ2l0eU1hdGNoKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGNpdHkgPSBmcm9tQ2l0eU1hdGNoWzFdLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgICAgb3JpZ2luID0gY2l0eS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIGNpdHkuc2xpY2UoMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBpZiAoIWRlc3RpbmF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0b0NpdHlNYXRjaCA9IHRleHQubWF0Y2goL3RvXFxzKyhbQS1aYS16XSspL2kpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRvQ2l0eU1hdGNoKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGNpdHkgPSB0b0NpdHlNYXRjaFsxXS50cmltKCk7XHJcbiAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uID0gY2l0eS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIGNpdHkuc2xpY2UoMSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAvLyBEaXJlY3QgY2l0eSBtZW50aW9uIChlLmcuIFwiR29hXCIpXHJcbiAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY2l0eSBvZiBrbm93bkNpdGllcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChgXFxcXGIke2NpdHl9XFxcXGJgLCAnaScpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWdleC50ZXN0KHRleHQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoIW9yaWdpbiB8fCBvcmlnaW4udG9Mb3dlckNhc2UoKSAhPT0gY2l0eSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvbiA9IGNpdHkuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBjaXR5LnNsaWNlKDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIC8vIFBhc3NlbmdlciBjb3VudHMgLSBleHRyYWN0ZWQgT05MWSBpZiBleHBsaWNpdGx5IHN0YXRlZFxyXG4gICAgICAgICAgICAgIGxldCBhZHVsdF9jb3VudDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAgIGxldCBjaGlsZHJlbl9jb3VudDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAgIGxldCBzZW5pb3JfY291bnQ6IG51bWJlciB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgICAgICAgY29uc3QgYWR1bHRNYXRjaCA9IHRleHQubWF0Y2goLyhcXGQrKVxccyphZHVsdC9pKTtcclxuICAgICAgICAgICAgICBpZiAoYWR1bHRNYXRjaCkge1xyXG4gICAgICAgICAgICAgICAgYWR1bHRfY291bnQgPSBwYXJzZUludChhZHVsdE1hdGNoWzFdLCAxMCk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBjb25zdCBjaGlsZE1hdGNoID0gdGV4dC5tYXRjaCgvKFxcZCspXFxzKig/OmNoaWxkfGNoaWxkcmVufGtpZCkvaSk7XHJcbiAgICAgICAgICAgICAgaWYgKGNoaWxkTWF0Y2gpIHtcclxuICAgICAgICAgICAgICAgIGNoaWxkcmVuX2NvdW50ID0gcGFyc2VJbnQoY2hpbGRNYXRjaFsxXSwgMTApO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgY29uc3Qgc2VuaW9yTWF0Y2ggPSB0ZXh0Lm1hdGNoKC8oXFxkKylcXHMqKD86c2VuaW9yfGVsZGVybHkpL2kpO1xyXG4gICAgICAgICAgICAgIGlmIChzZW5pb3JNYXRjaCkge1xyXG4gICAgICAgICAgICAgICAgc2VuaW9yX2NvdW50ID0gcGFyc2VJbnQoc2VuaW9yTWF0Y2hbMV0sIDEwKTtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIC8vIEFjY2Vzc2liaWxpdHkgZmxhZ3M6XHJcbiAgICAgICAgICAgICAgLy8gMS4gRXhwbGljaXQgZGV0YWlsZWQgcmVxdWlyZW1lbnRzIChjYW5vbmljYWwgSURzKVxyXG4gICAgICAgICAgICAgIGNvbnN0IGFjY2Vzc2liaWxpdHlfZmxhZ3M6IHN0cmluZ1tdID0gW107XHJcbiAgICAgICAgICAgICAgaWYgKGxvd2VyLmluY2x1ZGVzKFwic3RlcC1mcmVlXCIpIHx8IGxvd2VyLmluY2x1ZGVzKFwic3RlcCBmcmVlXCIpIHx8IGxvd2VyLmluY2x1ZGVzKFwic3RlcF9mcmVlXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBhY2Nlc3NpYmlsaXR5X2ZsYWdzLnB1c2goXCJzdGVwX2ZyZWVfZW50cmFuY2VcIik7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGlmIChsb3dlci5pbmNsdWRlcyhcImVsZXZhdG9yXCIpIHx8IGxvd2VyLmluY2x1ZGVzKFwibGlmdFwiKSkge1xyXG4gICAgICAgICAgICAgICAgYWNjZXNzaWJpbGl0eV9mbGFncy5wdXNoKFwiZWxldmF0b3JcIik7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGlmIChsb3dlci5pbmNsdWRlcyhcInJvbGwtaW4gc2hvd2VyXCIpIHx8IGxvd2VyLmluY2x1ZGVzKFwicm9sbCBpbiBzaG93ZXJcIikgfHwgbG93ZXIuaW5jbHVkZXMoXCJyb2xsX2luX3Nob3dlclwiKSkge1xyXG4gICAgICAgICAgICAgICAgYWNjZXNzaWJpbGl0eV9mbGFncy5wdXNoKFwicm9sbF9pbl9zaG93ZXJcIik7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGlmIChsb3dlci5pbmNsdWRlcyhcIndoZWVsY2hhaXIgcm9vbVwiKSB8fCBsb3dlci5pbmNsdWRlcyhcIndoZWVsY2hhaXIgYWNjZXNzaWJsZSByb29tXCIpIHx8IGxvd2VyLmluY2x1ZGVzKFwid2hlZWxjaGFpci1hY2Nlc3NpYmxlIHJvb21cIikpIHtcclxuICAgICAgICAgICAgICAgIGFjY2Vzc2liaWxpdHlfZmxhZ3MucHVzaChcIndoZWVsY2hhaXJfYWNjZXNzaWJsZV9yb29tXCIpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBpZiAobG93ZXIuaW5jbHVkZXMoXCJhY2Nlc3NpYmxlIHRvaWxldFwiKSB8fCBsb3dlci5pbmNsdWRlcyhcImRpc2FibGVkIHRvaWxldFwiKSkge1xyXG4gICAgICAgICAgICAgICAgYWNjZXNzaWJpbGl0eV9mbGFncy5wdXNoKFwiYWNjZXNzaWJsZV90b2lsZXRcIik7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGlmIChsb3dlci5pbmNsdWRlcyhcImxvdyB3YWxraW5nXCIpIHx8IGxvd2VyLmluY2x1ZGVzKFwibWluaW1hbCB3YWxraW5nXCIpIHx8IGxvd2VyLmluY2x1ZGVzKFwibG93IHdhbGtpbmcgZGlzdGFuY2VcIikpIHtcclxuICAgICAgICAgICAgICAgIGFjY2Vzc2liaWxpdHlfZmxhZ3MucHVzaChcImxvd193YWxraW5nX2Rpc3RhbmNlXCIpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBpZiAobG93ZXIuaW5jbHVkZXMoXCJhY2Nlc3NpYmxlIHB1YmxpYyB0cmFuc3BvcnRcIikpIHtcclxuICAgICAgICAgICAgICAgIGFjY2Vzc2liaWxpdHlfZmxhZ3MucHVzaChcImFjY2Vzc2libGVfcHVibGljX3RyYW5zcG9ydFwiKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgaWYgKGxvd2VyLmluY2x1ZGVzKFwidmlzdWFsIGFzc2lzdGFuY2VcIikgfHwgbG93ZXIuaW5jbHVkZXMoXCJicmFpbGxlXCIpIHx8IGxvd2VyLmluY2x1ZGVzKFwidGFjdGlsZVwiKSkge1xyXG4gICAgICAgICAgICAgICAgYWNjZXNzaWJpbGl0eV9mbGFncy5wdXNoKFwidmlzdWFsX2Fzc2lzdGFuY2VcIik7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGlmIChsb3dlci5pbmNsdWRlcyhcImhlYXJpbmcgYXNzaXN0YW5jZVwiKSB8fCBsb3dlci5pbmNsdWRlcyhcImhlYXJpbmcgbG9vcFwiKSkge1xyXG4gICAgICAgICAgICAgICAgYWNjZXNzaWJpbGl0eV9mbGFncy5wdXNoKFwiaGVhcmluZ19hc3Npc3RhbmNlXCIpO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgLy8gMi4gQ29hcnNlIC8gZ2VuZXJhbCBmbGFncyAob25seSB3aGVuIGdlbmVyYWwgdGVybXMgYXJlIHVzZWQpXHJcbiAgICAgICAgICAgICAgaWYgKGxvd2VyLmluY2x1ZGVzKFwid2hlZWxjaGFpclwiKSAmJiAhYWNjZXNzaWJpbGl0eV9mbGFncy5pbmNsdWRlcyhcIndoZWVsY2hhaXJfYWNjZXNzaWJsZV9yb29tXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBhY2Nlc3NpYmlsaXR5X2ZsYWdzLnB1c2goXCJ3aGVlbGNoYWlyXCIpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBpZiAoKGxvd2VyLmluY2x1ZGVzKFwidHJhbnNwb3J0XCIpIHx8IGxvd2VyLmluY2x1ZGVzKFwidmVoaWNsZVwiKSB8fCBsb3dlci5pbmNsdWRlcyhcImNhYlwiKSkgJiYgIWFjY2Vzc2liaWxpdHlfZmxhZ3MuaW5jbHVkZXMoXCJhY2Nlc3NpYmxlX3B1YmxpY190cmFuc3BvcnRcIikpIHtcclxuICAgICAgICAgICAgICAgIGFjY2Vzc2liaWxpdHlfZmxhZ3MucHVzaChcImFjY2Vzc2libGVfdHJhbnNwb3J0XCIpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBpZiAobG93ZXIuaW5jbHVkZXMoXCJob3RlbFwiKSB8fCBsb3dlci5pbmNsdWRlcyhcImFjY29tbW9kYXRpb25cIikgfHwgbG93ZXIuaW5jbHVkZXMoXCJyZXNvcnRcIikgfHwgbG93ZXIuaW5jbHVkZXMoXCJzdGF5XCIpKSB7XHJcbiAgICAgICAgICAgICAgICBhY2Nlc3NpYmlsaXR5X2ZsYWdzLnB1c2goXCJhY2Nlc3NpYmxlX2FjY29tbW9kYXRpb25cIik7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBjb25zdCBleHRyYWN0ZWQ6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fTtcclxuICAgICAgICAgICAgICBpZiAob3JpZ2luKSBleHRyYWN0ZWQub3JpZ2luID0gb3JpZ2luO1xyXG4gICAgICAgICAgICAgIGlmIChkZXN0aW5hdGlvbikgZXh0cmFjdGVkLmRlc3RpbmF0aW9uID0gZGVzdGluYXRpb247XHJcbiAgICAgICAgICAgICAgaWYgKGFkdWx0X2NvdW50ICE9PSB1bmRlZmluZWQpIGV4dHJhY3RlZC5hZHVsdF9jb3VudCA9IGFkdWx0X2NvdW50O1xyXG4gICAgICAgICAgICAgIGlmIChjaGlsZHJlbl9jb3VudCAhPT0gdW5kZWZpbmVkKSBleHRyYWN0ZWQuY2hpbGRyZW5fY291bnQgPSBjaGlsZHJlbl9jb3VudDtcclxuICAgICAgICAgICAgICBpZiAoc2VuaW9yX2NvdW50ICE9PSB1bmRlZmluZWQpIGV4dHJhY3RlZC5zZW5pb3JfY291bnQgPSBzZW5pb3JfY291bnQ7XHJcbiAgICAgICAgICAgICAgaWYgKGFjY2Vzc2liaWxpdHlfZmxhZ3MubGVuZ3RoID4gMCkgZXh0cmFjdGVkLmFjY2Vzc2liaWxpdHlfZmxhZ3MgPSBhY2Nlc3NpYmlsaXR5X2ZsYWdzO1xyXG5cclxuICAgICAgICAgICAgICBjb25zdCBtaXNzaW5nX29yX2FtYmlndW91czogeyBmaWVsZDogc3RyaW5nOyBwcm9tcHQ6IHN0cmluZyB9W10gPSBbXTtcclxuICAgICAgICAgICAgICBpZiAoIW9yaWdpbikge1xyXG4gICAgICAgICAgICAgICAgbWlzc2luZ19vcl9hbWJpZ3VvdXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgIGZpZWxkOiBcIm9yaWdpblwiLFxyXG4gICAgICAgICAgICAgICAgICBwcm9tcHQ6IFwiV2hlcmUgd2lsbCB5b3UgYmUgdHJhdmVsaW5nIGZyb20/XCIsXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgaWYgKCFkZXN0aW5hdGlvbikge1xyXG4gICAgICAgICAgICAgICAgbWlzc2luZ19vcl9hbWJpZ3VvdXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgIGZpZWxkOiBcImRlc3RpbmF0aW9uXCIsXHJcbiAgICAgICAgICAgICAgICAgIHByb21wdDogXCJXaGVyZSBkbyB5b3Ugd2FudCB0byB0cmF2ZWwgdG8/XCIsXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgaWYgKGFkdWx0X2NvdW50ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIG1pc3Npbmdfb3JfYW1iaWd1b3VzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICBmaWVsZDogXCJhZHVsdF9jb3VudFwiLFxyXG4gICAgICAgICAgICAgICAgICBwcm9tcHQ6IFwiSG93IG1hbnkgYWR1bHRzIGFyZSB0cmF2ZWxpbmc/XCIsXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uXCIpO1xyXG4gICAgICAgICAgICAgIHJlcy5lbmQoXHJcbiAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgICAgIGV4dHJhY3RlZCxcclxuICAgICAgICAgICAgICAgICAgbWlzc2luZ19vcl9hbWJpZ3VvdXMsXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAwO1xyXG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uXCIpO1xyXG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogXCJJbnZhbGlkIEpTT04gYm9keVwiIH0pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG5leHQoKTtcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG4gIH07XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcGx1Z2luczogW3JlYWN0KCksIG5sdU1vY2tQbHVnaW4oKV0sXHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWlQLFNBQVMsb0JBQTRCO0FBQ3RSLE9BQU8sV0FBVztBQUVsQixTQUFTLGdCQUF3QjtBQUMvQixTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixnQkFBZ0IsUUFBUTtBQUN0QixhQUFPLFlBQVksSUFBSSxDQUFDLEtBQUssS0FBSyxTQUFTO0FBQ3pDLFlBQUksSUFBSSxRQUFRLHNCQUFzQixJQUFJLFdBQVcsUUFBUTtBQUMzRCxjQUFJLE9BQU87QUFDWCxjQUFJLEdBQUcsUUFBUSxDQUFDLFVBQVU7QUFDeEIsb0JBQVE7QUFBQSxVQUNWLENBQUM7QUFDRCxjQUFJLEdBQUcsT0FBTyxNQUFNO0FBQ2xCLGdCQUFJO0FBQ0Ysb0JBQU0sRUFB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
