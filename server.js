import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const API_KEY = process.env.API_KEY;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* -------------------------------------------------------
   DISABLE CACHING (REQUIRED FOR RENDER !!!)
---------------------------------------------------------*/
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
});

/* -------------------------------------------------------
   SERVE STATIC FILES
---------------------------------------------------------*/
app.use(express.static(path.join(__dirname, "public")));

/* -------------------------------------------------------
   ROUTE: WEATHER BY CITY
---------------------------------------------------------*/
app.get("/weather", async (req, res) => {
    const { city } = req.query;
    if (!city) return res.status(400).json({ error: "City required" });

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

    try {
        const result = await fetch(url);
        const data = await result.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch weather" });
    }
});

/* -------------------------------------------------------
   ROUTE: WEATHER BY COORDS
---------------------------------------------------------*/
app.get("/weathercoords", async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon)
        return res.status(400).json({ error: "lat and lon required" });

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

    try {
        const result = await fetch(url);
        const data = await result.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch weather coords" });
    }
});

/* -------------------------------------------------------
   ROUTE: AIR QUALITY
---------------------------------------------------------*/
app.get("/aqi", async (req, res) => {
    const { lat, lon } = req.query;

    if (!lat || !lon)
        return res.status(400).json({ error: "lat and lon required" });

    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

    try {
        const result = await fetch(url);
        const data = await result.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch AQI" });
    }
});

/* -------------------------------------------------------
   SERVE INDEX.HTML
---------------------------------------------------------*/
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* -------------------------------------------------------
   START SERVER
---------------------------------------------------------*/
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
