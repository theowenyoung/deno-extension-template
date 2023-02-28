import * as esbuild from "https://deno.land/x/esbuild@v0.17.6/mod.js";
import {
  BuildOptions,
  Format,
} from "https://deno.land/x/esbuild@v0.17.6/mod.js";
import { denoPlugin } from "./tool/esbuild_deno_loader/mod.ts";
import { config } from "https://deno.land/std@0.166.0/dotenv/mod.ts";
import { parse } from "https://deno.land/std@0.159.0/flags/mod.ts";
import { fs, path } from "./test_deps.ts";

const { join } = path;
const { copy, ensureDir } = fs;
const localesData: Record<string, Record<string, string>> = {};
async function main() {
  const flags = parse(Deno.args, {
    boolean: [
      "watch",
    ],
  });
  // export .env
  await config({
    export: true,
  });
  const isProd = Deno.env.get("PROD") === "1";
  const noMock = Deno.env.get("MOCK") === "0";

  const allPlatforms = ["chrome", "firefox"];

  const platforms: string[] = [];
  if (flags.all) {
    platforms.push(...allPlatforms);
  } else if (flags.firefox) {
    platforms.push("firefox");
  } else if (flags.chrome) {
    platforms.push("chrome");
  } else if (flags.userscript) {
    platforms.push("userscript");
  }

  for (const platform of platforms) {
    // remove dist first
    try {
      await Deno.remove(`dist/${platform}`, { recursive: true });
    } catch (_e) {
      // ignore
    }
    const ctx: Context = {
      platform: platform,
      flags: flags as Record<string, string>,
      isProd: isProd,
      noMock: noMock,
    };

    await copyStaticFiles(ctx);
    await buildForPlatform(ctx);
  }

  if (!flags.watch) {
    Deno.exit(0);
  }
}
interface Context {
  platform: string;
  flags: Record<string, string>;
  isProd: boolean;
  noMock: boolean;
}

async function buildForPlatform(context: Context) {
  const { platform, flags } = context;
  const definition = {};

  let entries: string[] = [];
  if (platform !== "userscript") {
    entries = [
      "./entry/extension/content_script.ts",
      "./entry/extension/options.ts",
      "./entry/extension/popup.ts",
      "./entry/extension/background/background.ts",
    ];
  } else {
    entries = [
      "./entry/userscript/immersive-translate.user.ts",
    ];
  }

  const esbuildOptions: BuildOptions = {
    plugins: [denoPlugin()],
    entryPoints: entries,
    entryNames: platform + "/[name]",
    define: definition,
    outdir: `dist`,
    bundle: true,
    minify: false,
    sourcemap: false,
    format: "iife" as Format,
    logLevel: "verbose",
    treeShaking: true,
  };

  const esbuildCtx = await esbuild.context(esbuildOptions);
  if (flags.watch) {
    await esbuildCtx.watch();
  } else {
    await esbuildCtx.rebuild();
  }
  console.log(`Build complete`);
  if (!flags.watch) {
    await esbuildCtx.dispose();
    await esbuildCtx.cancel();
  }

  return esbuildCtx;
}

async function copyStaticFiles(
  ctx: Context,
) {
  const { platform } = ctx;
  const distDir = `dist/${ctx.platform}`;
  const options = { overwrite: true };
  await ensureDir(`${distDir}`);
  await copyManifest(ctx);
  await copy("static/common", distDir, options);
  if (platform !== "userscript") {
    await copy("static/extension", distDir, options);
  }

  // build locales
  const localesFiles = Deno.readDir("./locales");
  for await (const file of localesFiles) {
    if (file.name.endsWith(".json")) {
      // get file content
      const content = await Deno.readTextFile(`./locales/${file.name}`);
      const json = JSON.parse(content);
      // build to chrome format locales
      const chromeLocales: Record<string, { message: string }> = {};
      for (const key in json) {
        if (key.startsWith("browser.")) {
          const chromeKey = key.replace("browser.", "");
          chromeLocales[chromeKey] = {
            message: json[key],
          };
        }
      }
      const locale = file.name.replace(".json", "");
      localesData[locale] = json;
      // replace - to _
      const chromeLocale = locale.replace("-", "_");

      const targetPath = join(
        distDir,
        "_locales",
        chromeLocale,
        "messages.json",
      );
      await ensureDir(join(distDir, "_locales", chromeLocale));
      await Deno.writeTextFile(
        targetPath,
        JSON.stringify(chromeLocales, null, 2),
      );
    }
  }
}

interface BrowserManifestSettings {
  color: string;
  omits: string[];
  // deno-lint-ignore no-explicit-any
  overrides?: { [id: string]: any };
}

interface BrowserManifests {
  [id: string]: BrowserManifestSettings;
}
async function copyManifest(ctx: Context) {
  const { flags, platform, isProd } = ctx;
  const browsers: BrowserManifests = {};

  browsers.chrome = {
    color: "\x1b[32m",
    omits: [
      "browser_specific_settings",
      "applications",
      "options_ui",
      "browser_action",
    ],
  };

  if (isProd) {
    const RELEASE_ZIP = Deno.env.get("RELEASE_ZIP");
    if (RELEASE_ZIP && RELEASE_ZIP === "1") {
      // do nothing
    } else {
      browsers.chrome.omits.push("key");
    }
  }
  browsers.firefox = {
    color: "\x1b[32m",
    overrides: {
      manifest_version: 2,
      background: {
        scripts: ["background/background.js"],
      },
    },
    omits: [
      "options_page",
      "host_permissions",
      "action",
      "declarative_net_request",
      "key",
    ],
  };
  // Transform Manifest
  const manifest = {
    ...JSON.parse(await Deno.readTextFile("manifest.json")),
    ...browsers[platform].overrides,
  };

  // merge host_permissions to permissions if firefox
  if (platform === "firefox") {
    manifest.permissions = [
      ...(manifest.host_permissions || []),
      ...(manifest.permissions || []),
    ];
    const omitKeys = [
      "declarativeNetRequestWithHostAccess",
      "declarativeNetRequestFeedback",
      "declarativeNetRequest",
    ];
    // remote some permission
    manifest.permissions = manifest.permissions.filter((p: string) => {
      return !omitKeys.includes(p);
    });
  }
  // @ts-ignore: it's ok
  browsers[platform].omits.forEach((omit) => delete manifest[omit]);
  // for chrome change web_accessible_resources
  if (platform === "chrome") {
    manifest.web_accessible_resources = [{
      resources: manifest.web_accessible_resources,
      matches: ["<all_urls>", "file:///*", "*://*/*"],
    }];
    // rmeote some permission
    //webRequestBlocking
    manifest.permissions = manifest.permissions.filter((p: string) => {
      return p !== "webRequestBlocking";
    });
  }

  await Deno.writeTextFile(
    "./dist/" + platform + "/manifest.json",
    JSON.stringify(manifest, null, 2),
  );
}

main();
