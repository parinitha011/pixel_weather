import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const API_KEY = process.env.API_KEY;

// Serve frontend files
app.use(express.static("public"));

/* -------- WEATHER BY CITY -------- */
app.get("/weather", async (req, res) => {
    const { city } = req.query;

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
    const r = await fetch(url);
    const data = await r.json();

    res.json(data);
});

/* -------- WEATHER BY COORDINATES -------- */
app.get("/weathercoords", async (req, res) => {
    const { lat, lon } = req.query;

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    const r = await fetch(url);
    const data = await r.json();

    res.json(data);
});

/* -------- AIR QUALITY (AQI) -------- */
app.get("/aqi", async (req, res) => {
    const { lat, lon } = req.query;

    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    const r = await fetch(url);
    const data = await r.json();

    res.json(data);
});

/* -------- START SERVER -------- */
app.listen(3000, () =>
    console.log("Server running at http://localhost:3000")
);
