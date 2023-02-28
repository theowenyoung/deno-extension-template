import { serve } from "https://deno.land/std@0.166.0/http/server.ts";
import { delay } from "./deps.ts";
import {
  serveDir,
  serveFile,
} from "https://deno.land/std@0.166.0/http/file_server.ts";
let requestLength = 0;

serve(async (req) => {
  const urlObj = new URL(req.url);
  const pathname = urlObj.pathname;

  if (pathname.startsWith("/auth-done")) {
    // serve file
    return serveFile(req, "./dist/userscript/auth-done/index.html");
  } else if (
    pathname === "/immersive-translate.user.js" ||
    pathname.startsWith("/auth-done") || pathname.startsWith("/options")
  ) {
    return serveDir(req, {
      fsRoot: "./dist/userscript",
      showIndex: true,
    });
  }

  if (pathname.startsWith("/dist")) {
    // remove /dist from the pathname
    const newUrlObj = new URL(urlObj.toString());
    newUrlObj.pathname = pathname.slice(5);
    if (newUrlObj.pathname === "") {
      newUrlObj.pathname = "/";
    }
    const newRequest = new Request(newUrlObj.toString(), req);
    return serveDir(newRequest, {
      fsRoot: "./dist",
      showIndex: true,
    });
  }

  if (pathname === "/v2/translate") {
    requestLength++;
    const body = await req.formData();
    const texts: string[] = body.getAll("text") as string[];
    await delay(getRandomInt(40, 500));
    const radom = getRandomInt(0, 100);
    if (radom < 50) {
      return new Response(
        JSON.stringify({
          translations: texts.map((text) => {
            return {
              text: "mock: " + text.slice(0, -9),
              detected_source_language: "EN",
            };
          }),
        }),
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );
    } else {
      return new Response("502", {
        status: 502,
      });
    }
  }

  return serveDir(req, {
    fsRoot: "./example",
    showIndex: true,
  });
}, {
  port: 8000,
});

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min)) + min;
}
