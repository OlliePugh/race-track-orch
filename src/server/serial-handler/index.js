import { ReadlineParser, SerialPort } from "serialport"
import config from "../../config"

export default class SerialHandler {
    static #serialHandler;

    port = config.port;
    baudRate = config.baudRate;

    constructor(autoConnect) {
        if (SerialHandler.#serialHandler) {
            return this.getInstance();
        }
        SerialHandler.#serialHandler = this;

        if (autoConnect) {
            this.connect();
        }
    }

    async safeWrite(message) {
        try {
            console.log(`Sending Message ${message}`)
            await this.serialPort.write(message)
        }
        catch (e) {
            console.error(e);
            console.log(`Failed to write message to ${this.port} - is it connected?`)
        }
    }

    async connect() {  // todo this all needs testing
        console.log(`Attempting to connect to ${this.port} with baud rate ${this.baudRate}`)
        this.serialPort = new SerialPort({
            path: this.port,
            baudRate: this.baudRate,
            autoOpen: false
        });
        this.parser = new ReadlineParser();
        this.serialPort.pipe(this.parser);

        this.serialPort.on('open', () => {
            console.log(`Successfully connected to serial ${this.port}`)
            this.connected = true;
        });
        this.serialPort.on('close', () => {
            this.connected = false;
            setTimeout(this.reconnect.bind(this), 5000);
        });
        this.serialPort.on('error', () => {
            setTimeout(this.reconnect.bind(this), 5000);
        });

        this.parser.on("data", this.handleMessage.bind(this));

        this.serialPort.open();

        return this.parser;
    }

    reconnect() {
        console.log(`Attempting to reconnect to ${this.port}`)
        if (!this.connected) { this.serialPort.open(); }
    }

    handleMessage(content) {
        console.log(`Message from ${this.port}: ${content}`)
    }

    static getInstance() {
        return SerialHandler.#serialHandler;
    }
}