import { Filter } from "nostr-tools";

const WebSocket = require("ws");

export class NostrClient {
  url: string;
  socket: WebSocket;
  handleEvent: (subscriptionId: string, event: string) => void;
  isSocketOpen: boolean;

  constructor(
    url: string,
    handleEvent: (subscriptionId: string, event: string) => void
  ) {
    this.url = url;
    this.socket = new WebSocket(url);
    this.handleEvent = handleEvent;
    this.isSocketOpen = false;

    this.socket.onopen = () => {
      console.log("WebSocket connected");
      this.isSocketOpen = true;
    };

    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.socket.onclose = (event) => {
      console.log("WebSocket closed:", event.reason);
      this.isSocketOpen = false;
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.isSocketOpen = false;
    };
  }

  subscribe(subscriptionId: string, filters: Filter) {
    if (!this.isSocketOpen) {
      console.error("WebSocket is not open");
      return;
    }
    const message = ["REQ", subscriptionId, filters];
    this.socket.send(JSON.stringify(message));
  }

  unsubscribe(subscriptionId: string) {
    if (!this.isSocketOpen) {
      console.error("WebSocket is not open");
      return;
    }
    const message = ["CLOSE", subscriptionId];
    this.socket.send(JSON.stringify(message));
  }

  handleMessage(message: string[]) {
    const messageType = message[0];
    switch (messageType) {
      case "EVENT":
        this.handleEvent(message[1], message[2]);
        break;
      case "EOSE":
        this.handleEOSE(message[1]);
        break;
      case "NOTICE":
        this.handleNotice(message[1]);
        break;
      default:
        console.warn("Unknown message type:", messageType);
    }
  }

  publishEvent(event: any) {
    if (!this.isSocketOpen) {
      console.error("WebSocket is not open");
      return;
    }
    const message = ["EVENT", event];
    this.socket.send(JSON.stringify(message));
  }

  handleEOSE(subscriptionId: string) {
    console.log("End of stored events for subscription", subscriptionId);
  }

  handleNotice(message: any) {
    console.log("Notice:", message);
  }
}
