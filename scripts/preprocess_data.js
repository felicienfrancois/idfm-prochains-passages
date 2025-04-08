/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const { parseFile } = require("@fast-csv/parse");

const stops = {};
const lines = {};
parseFile("arrets-lignes.csv", { delimiter: ";", headers: true })
  .on("error", console.error)
  .on("data", (row) => {
    const stop_id = row.stop_id.split(":").pop();
    const line_id = row.id.split(":").pop();
    stops[stop_id] = stops[stop_id] || {
      id: stop_id,
      name: row.stop_name,
      lines: [line_id],
      _search: row.stop_name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036F]/g, "")
        .replace(/[^a-zA-Z]/, " "),
      city: row.nom_commune,
    };
    if (!stops[stop_id].lines.includes(line_id)) {
      stops[stop_id].lines.push(line_id);
      stops[stop_id].lines.sort();
    }
    if (!lines[line_id]) {
      lines[line_id] = row.route_long_name;
    }
  })
  .on("end", (rowCount) => {
    console.log(`Loaded ${rowCount} stops entries`);
    fs.writeFileSync("data/stops.json", JSON.stringify(stops));
    fs.writeFileSync("data/lines.json", JSON.stringify(lines));
    console.log("SUCCESS: Processed data written to data dir");
  });
