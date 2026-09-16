import { parseAdminEnv } from "./admin.js";
import { loadWorkspaceEnvironment } from "./load.js";
import { parseMobileEnv } from "./mobile.js";
import { parseServerEnv } from "./server.js";
loadWorkspaceEnvironment();
parseServerEnv();
parseAdminEnv(process.env);
parseMobileEnv(process.env);
console.log("Environment contract OK");
