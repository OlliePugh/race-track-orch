import express from "express";
import streamSetup from "./stream-handler.js"

const app = express();
app.listen(3000);

app.use(express.static("src/view"));
streamSetup(app)


