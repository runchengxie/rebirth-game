import fs from "node:fs";

const years = ["2023", "2024", "2025"];
let changed = 0;

for (const year of years) {
  const path = `src/game/content/${year}.json`;
  const content = JSON.parse(fs.readFileSync(path, "utf8"));
  for (const month of content.decisions) {
    for (const decision of month) {
      if (decision.method === "self_management") {
        const sound = decision.effects.lifeBalance >= 8
          || decision.effects.fatigue <= -8
          || decision.reflectionValue >= 10;
        const nextTags = decision.reflectionValue >= 10 ? ["reflective"] : [];
        if (decision.quality !== (sound ? "sound" : "mixed")
          || decision.outcomeAlignment !== "mixed"
          || JSON.stringify(decision.behaviorTags) !== JSON.stringify(nextTags)) {
          decision.quality = sound ? "sound" : "mixed";
          decision.outcomeAlignment = "mixed";
          decision.behaviorTags = nextTags;
          changed += 1;
        }
      }
      if (decision.method === "collaboration") {
        const sound = decision.effects.teamTrust >= 8 || decision.reflectionValue >= 8;
        const nextTags = decision.reflectionValue >= 10 ? ["reflective"] : [];
        if (decision.quality !== (sound ? "sound" : "mixed")
          || decision.outcomeAlignment !== "mixed"
          || JSON.stringify(decision.behaviorTags) !== JSON.stringify(nextTags)) {
          decision.quality = sound ? "sound" : "mixed";
          decision.outcomeAlignment = "mixed";
          decision.behaviorTags = nextTags;
          changed += 1;
        }
      }
    }
  }
  fs.writeFileSync(path, `${JSON.stringify(content, null, 2)}\n`);
}

process.stdout.write(`Updated ${changed} non-analytical decisions.\n`);
