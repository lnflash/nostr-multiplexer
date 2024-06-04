import { rejects } from "assert";
import {
  SimplePool,
  Event,
  useWebSocketImplementation,
  Relay,
  Filter,
} from "nostr-tools";

import { NostrClient } from "./nostrClient";

const relays = [
  "wss://relay.damus.io",
  "wss://relay.primal.net",
  "wss://relay.snort.social",
];

const FLASH_RELAY = "wss://relay.staging.flashapp.me";

const FlashClient = new NostrClient(FLASH_RELAY, (event: any) => {
  console.log("GOT EVENT", event);
});

const handleEvent = function (subscriptionId: string, event: any) {
  console.log("Handling event", event);
  delay(1000).then((value) => {
    FlashClient.publishEvent(event);
  });
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const queryPubkey = async (
  pubKeyStart: string,
  client: NostrClient,
  subscriptionId: string
) => {
  console.log("Fetching all events with", pubKeyStart);
  const filter: Filter = {
    kinds: [0],
    authors: [pubKeyStart],
  };
  console.log("starting fetch with filter", filter);
  const filters = {
    kinds: [0],
  };
  client.subscribe(subscriptionId, filters);
};

const fetchEvents = async () => {
  relays.forEach(async (relay) => {
    const client = new NostrClient(relay, handleEvent);
    const subscriptionId = "my-subscription";
    for (let i = 0; i < 256; i++) {
      const hexValue = i.toString(16).padStart(2, "0");
      queryPubkey(hexValue, client, subscriptionId);
      await delay(5000); // Wait for 5 seconds
    }
    client.unsubscribe("my-subscription");
  });
  console.log("Fetch complete");
  //pool.close(FLASH_RELAYS);
};

function main() {
  console.log("Script is running...");
  fetchEvents().then(
    (res) => {
      console.log("Script ran successfully");
    },
    (req) => {
      console.log("error", req);
    }
  );
}

main();
