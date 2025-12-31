import fs from "fs";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";
import path from "path";

const inputFile = "./src/input.css";
const outputFile = "./dist/output.css";

async function build() {
  const input = fs.readFileSync(inputFile, "utf8");

  const result = await postcss([
    tailwindcss()
  ]).process(input, {
    from: inputFile,
    to: outputFile,
  });

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, result.css);

  console.log("Tailwind CSS processed successfully!");
}

build();
