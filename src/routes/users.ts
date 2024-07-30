import { Router } from "express";
import { getAllUsers, addUser, getPubkeyByName } from "../db/queries";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/.well-known/nostr.json", async (req, res) => {
  const name = req.query.name as string;

  if (!name) {
    return res.status(400).json({ error: "Name query parameter is required" });
  }

  try {
    const user = await getPubkeyByName(name);

    if (user) {
      res.json({
        names: {
          [user.name]: user.pubkey,
        },
      });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/users", async (req, res) => {
  const { name, pubkey } = req.body;
  if (pubkey.length !== 64) throw Error("Pubkey is wrong length");
  try {
    const id = await addUser(name, pubkey);
    res.json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
