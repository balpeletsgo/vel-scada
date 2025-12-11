import Echo from "laravel-echo";

import Pusher from "pusher-js";
window.Pusher = Pusher;

// Initialize Echo immediately
window.Echo = new Echo({
    broadcaster: "reverb",
    key: "vel-scada-key",
    wsHost: "localhost",
    wsPort: 8080,
    wssPort: 8080,
    forceTLS: false,
    enabledTransports: ["ws", "wss"],
});
