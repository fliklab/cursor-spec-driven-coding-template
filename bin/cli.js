#!/usr/bin/env node

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const projectName = process.argv[2];
if (!projectName) {
  console.error("Please provide a name for your new project.");
  process.exit(1);
}

const currentPath = process.cwd();
const projectPath = path.join(currentPath, projectName);
const templatePath = path.resolve(__dirname, ".."); // This points to the root of the template

try {
  fs.mkdirSync(projectPath);
} catch (err) {
  if (err.code === "EEXIST") {
    console.error(`The directory ${projectName} already exists.`);
  } else {
    console.error(err);
  }
  process.exit(1);
}

function createDirectoryContents(templatePath, newProjectPath) {
  const filesToCreate = fs.readdirSync(templatePath);

  filesToCreate.forEach((file) => {
    const origFilePath = path.join(templatePath, file);
    const stats = fs.statSync(origFilePath);

    // Skip git, node_modules, and the bin directory itself
    if (
      file === ".git" ||
      file === "node_modules" ||
      file === "bin" ||
      file === "package.json" ||
      file === "package-lock.json"
    ) {
      return;
    }

    if (stats.isFile()) {
      const contents = fs.readFileSync(origFilePath, "utf8");
      const writePath = path.join(newProjectPath, file);
      fs.writeFileSync(writePath, contents, "utf8");
    } else if (stats.isDirectory()) {
      const newDirPath = path.join(newProjectPath, file);
      fs.mkdirSync(newDirPath);
      createDirectoryContents(path.join(templatePath, file), newDirPath);
    }
  });
}

console.log(`Creating a new project in ${projectPath}...`);

// Copy template files
createDirectoryContents(templatePath, projectPath);

// Create a new package.json for the project
const projectPackageJson = {
  name: projectName,
  version: "1.0.0",
  private: true,
};
fs.writeFileSync(
  path.join(projectPath, "package.json"),
  JSON.stringify(projectPackageJson, null, 2)
);

console.log("Initializing a new git repository...");
execSync(
  `git init && git add . && git commit -m "Initial commit from template"`,
  { cwd: projectPath }
);

console.log("Installing dependencies...");
execSync("npm install", { cwd: projectPath, stdio: "inherit" });

console.log("Done. Your project is ready.");
console.log(`To get started, run: cd ${projectName}`);
