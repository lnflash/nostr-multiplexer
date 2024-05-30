class WebSocketClient {
  url: string;
  socket: WebSocket;
  handleEvent: (subscriptionId: string, event: any) => void;

  constructor(
    url: string,
    handleEvent: (subscriptionId: string, event: any) => void
  ) {
    this.url = url;
    this.socket = new WebSocket(url);
    this.handleEvent = handleEvent;

    this.socket.onopen = () => {
      console.log("WebSocket connected");
    };

    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.socket.onclose = (event) => {
      console.log("WebSocket closed:", event.reason);
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  subscribe(subscriptionId: string, filters: any) {
    const message = ["REQ", subscriptionId, filters];
    this.socket.send(JSON.stringify(message));
  }

  unsubscribe(subscriptionId: string) {
    const message = ["CLOSE", subscriptionId];
    this.socket.send(JSON.stringify(message));
  }

  handleMessage(message: any) {
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

  handleEOSE(subscriptionId: string) {
    console.log("End of stored events for subscription", subscriptionId);
  }

  handleNotice(message: any) {
    console.log("Notice:", message);
  }
}
