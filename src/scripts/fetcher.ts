import { rejects } from "assert";
import {
  SimplePool,
  Event,
  useWebSocketImplementation,
  Relay,
  Filter,
} from "nostr-tools";
useWebSocketImplementation(require("ws"));

const relays = [
  "wss://relay.damus.io",
  "wss://relay.primal.net",
  "wss://relay.snort.social",
];
const handleEvent = function (subscriptionId: string, event: any) {
  console.log("Handling event", event);
  // Store the event in your own array or perform any other necessary actions
};

const FLASH_RELAYS = ["wss://relay.staging.flashapp.me"];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const queryPubkey = async (
  pubKeyStart: string,
  client: WebSocketClient,
  subscriptionId: string
) => {
  console.log("Fetching all events with", pubKeyStart);
  const events: Event[] = [];
  const filter: Filter = {
    kinds: [0],
    authors: [pubKeyStart],
  };
  console.log("starting fetch with filter", filter);
  const filters = {
    kinds: [0],
  };
  client.subscribe(subscriptionId, filters);

  return events;
};

const pushToFlashRelays = async (events: Event[], pool: SimplePool) => {
  console.log("Publishing to flash relays");
  events.forEach(async (event) => {
    console.log("Pushing Event", event);
    await Promise.allSettled(pool.publish(FLASH_RELAYS, event));
    await delay(1000); // Wait for 5 seconds//Wait 1 second
  });
};

const fetchEvents = async () => {
  relays.forEach(async (relay) => {
    const client = new WebSocketClient(relay, handleEvent);
    const subscriptionId = "my-subscription";
    for (let i = 0; i < 256; i++) {
      const hexValue = i.toString(16).padStart(2, "0");
      queryPubkey(hexValue, client, subscriptionId);
      // await pushToFlashRelays(events, pool);
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
    (rej) => {
      console.log("error", rej);
    }
  );
}

main();
