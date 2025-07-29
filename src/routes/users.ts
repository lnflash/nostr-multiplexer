import { Router } from "express";
import { getNip05 } from "../controllers/NIP05Controller";

const router = Router();

router.get("/.well-known/nostr.json", getNip05);

export default router;
