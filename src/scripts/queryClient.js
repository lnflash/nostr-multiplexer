"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketClient = void 0;
var WebSocket = require("ws");
var WebSocketClient = /** @class */ (function () {
    function WebSocketClient(url, handleEvent) {
        var _this = this;
        this.url = url;
        this.socket = new WebSocket(url);
        this.handleEvent = handleEvent;
        this.isSocketOpen = false;
        this.socket.onopen = function () {
            console.log("WebSocket connected");
            _this.isSocketOpen = true;
        };
        this.socket.onmessage = function (event) {
            var message = JSON.parse(event.data);
            _this.handleMessage(message);
        };
        this.socket.onclose = function (event) {
            console.log("WebSocket closed:", event.reason);
            _this.isSocketOpen = false;
        };
        this.socket.onerror = function (error) {
            console.error("WebSocket error:", error);
            _this.isSocketOpen = false;
        };
    }
    WebSocketClient.prototype.subscribe = function (subscriptionId, filters) {
        if (!this.isSocketOpen) {
            console.error("WebSocket is not open");
            return;
        }
        var message = ["REQ", subscriptionId, filters];
        this.socket.send(JSON.stringify(message));
    };
    WebSocketClient.prototype.unsubscribe = function (subscriptionId) {
        if (!this.isSocketOpen) {
            console.error("WebSocket is not open");
            return;
        }
        var message = ["CLOSE", subscriptionId];
        this.socket.send(JSON.stringify(message));
    };
    WebSocketClient.prototype.handleMessage = function (message) {
        var messageType = message[0];
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
    };
    WebSocketClient.prototype.handleEOSE = function (subscriptionId) {
        console.log("End of stored events for subscription", subscriptionId);
    };
    WebSocketClient.prototype.handleNotice = function (message) {
        console.log("Notice:", message);
    };
    return WebSocketClient;
}());
exports.WebSocketClient = WebSocketClient;
