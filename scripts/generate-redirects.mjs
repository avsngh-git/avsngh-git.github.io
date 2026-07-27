import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const redirects = JSON.parse(
  await readFile(resolve(repositoryRoot, "redirects.json"), "utf8"),
);
const generatedMarker = 'name="portfolio-generated-redirect"';

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

async function findGeneratedRedirects(directory) {
  const generated = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      generated.push(...await findGeneratedRedirects(path));
    } else if (
      entry.name.endsWith(".html") &&
      (await readFile(path, "utf8")).includes(generatedMarker)
    ) {
      generated.push(path);
    }
  }
  return generated;
}

const expectedOutputs = new Set(
  redirects.map((redirect) =>
    resolve(repositoryRoot, "public", redirect.output)),
);
for (const generated of await findGeneratedRedirects(
  resolve(repositoryRoot, "public"),
)) {
  if (!expectedOutputs.has(generated)) await unlink(generated);
}

for (const redirect of redirects) {
  const output = resolve(repositoryRoot, "public", redirect.output);
  const target = escapeHtml(redirect.target);
  const canonical = redirect.target.startsWith("/assets/")
    ? ""
    : `\n    <link rel="canonical" href="https://avsngh-git.github.io${target}">`;
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta ${generatedMarker} content="true">
    <meta http-equiv="refresh" content="0; url=${target}">${canonical}
    <title>${escapeHtml(redirect.title)}</title>
    <script>location.replace(${JSON.stringify(redirect.target)})</script>
  </head>
  <body><a href="${target}">${escapeHtml(redirect.label)}</a></body>
</html>
`;

  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, html, "utf8");
}
