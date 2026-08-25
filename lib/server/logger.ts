import "server-only";
const sensitive=new Set(["body","message","token","authorization","cookie","secret","password"]);
function redact(value:unknown):unknown{if(!value||typeof value!=="object")return value;return Object.fromEntries(Object.entries(value as Record<string,unknown>).map(([key,item])=>[key,sensitive.has(key.toLowerCase())?"[REDACTED]":item]));}
export const logger={error(event:string,error:unknown,context:Record<string,unknown>={}){console.error(JSON.stringify({level:"error",event,error:error instanceof Error?error.message:"Unknown error",context:redact(context)}));},info(event:string,context:Record<string,unknown>={}){console.info(JSON.stringify({level:"info",event,context:redact(context)}));}};
