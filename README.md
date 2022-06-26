# race-car-orch

This is an express server responsible for orchestrating communication between clients and the cars controller themselves. It also proxies the cars video feed to the clients

## Setup

`npm install`

`npm start`

There is also a dev mode (this will just hot reload on save)
`npm run dev`

## Other Devices

Cars need to be running the following [firmware](https://github.com/OlliePugh/race-track-car-firmware.git)

And the USB connected controller needs to have the following [firmware](https://github.com/OlliePugh/race-track-controller-firmware)