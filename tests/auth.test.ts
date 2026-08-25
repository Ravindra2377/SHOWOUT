import { describe, expect, it } from "vitest";
import { createSessionValue, parseSessionValue } from "@/lib/server/auth";
describe("local auth adapter",()=>{it("authenticates signed sessions and rejects tampering",()=>{const session=createSessionValue("maya");expect(parseSessionValue(session)?.role).toBe("USER");expect(parseSessionValue(`${session}tampered`)).toBeNull();});});
