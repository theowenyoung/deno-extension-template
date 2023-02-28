import { main } from "../../content_script/main.ts";
import log from "../../log.ts";

main().catch((e) => {
  log.error(e);
});
