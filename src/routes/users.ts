import { Router } from "express";
import { getNip05 } from "../controllers/NIP05Controller";
import cors from "cors";

const router = Router();

router.get("/.well-known/nostr.json", cors({ origin: "*" }), getNip05);

export default router;
