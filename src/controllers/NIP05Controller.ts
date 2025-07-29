// controllers/nostrController.ts

import { Request, Response } from "express";
import { getPubkeyByName } from "../repository/queries";
import { nip19 } from "nostr-tools";

export const getNip05 = async (req: Request, res: Response) => {
  const name = req.query.name as string;

  if (!name) {
    return res.status(400).json({ error: "Name query parameter is required" });
  }

  try {
    const npub = await getPubkeyByName(name);

    if (npub) {
      res.json({
        names: {
          [name]: nip19.decode(npub).data as string,
        },
      });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
