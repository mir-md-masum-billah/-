import { currentUser } from "@/lib/guard";
import { json, handle } from "@/lib/http";
export const GET = handle(async () => json(await currentUser()));
