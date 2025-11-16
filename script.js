const API_KEY = "c67d554c79c156ddaea086bb57d75ce5"; // your OpenWeather key


/* -------------------------------------------------------
   SET BACKGROUND IMAGE
---------------------------------------------------------*/
function setBackground(el, file) {
    el.style.backgroundImage = `url('images/background/${file}')`;
}


/* -------------------------------------------------------
   REAL SEASON LOGIC (Astronomical Seasons)
---------------------------------------------------------*/
function getRealSeason(lat) {
    const north = lat > 0;
    const today = new Date();
    const y = today.getFullYear();

    // Astronomical season dates
    const spring = new Date(y, 2, 20);   // March 20
    const summer = new Date(y, 5, 21);   // June 21
    const autumn = new Date(y, 8, 23);   // Sept 23
    const winter = new Date(y, 11, 21);  // Dec 21

    if (north) {
        if (today >= winter || today < spring) return "winter";
        if (today >= spring && today < summer) return "spring";
        if (today >= summer && today < autumn) return "summer";
        return "autumn";
    } else {
        // Opposite for Southern Hemisphere
        if (today >= winter || today < spring) return "summer";
        if (today >= spring && today < summer) return "autumn";
        if (today >= summer && today < autumn) return "winter";
        return "spring";
    }
}


/* -------------------------------------------------------
   REAL EPA AQI CALCULATION (0–500)
---------------------------------------------------------*/
function calculateAQI(pm25, pm10) {

    function calc(ind, C) {
        const ranges = {
            pm25: [
                [0.0, 12.0, 0, 50],
                [12.1, 35.4, 51, 100],
                [35.5, 55.4, 101, 150],
                [55.5, 150.4, 151, 200],
                [150.5, 250.4, 201, 300],
                [250.5, 350.4, 301, 400],
                [350.5, 500.4, 401, 500],
            ],
            pm10: [
                [0, 54, 0, 50],
                [55, 154, 51, 100],
                [155, 254, 101, 150],
                [255, 354, 151, 200],
                [355, 424, 201, 300],
                [425, 504, 301, 400],
                [505, 604, 401, 500],
            ],
        };

        for (let r of ranges[ind]) {
            const [C_low, C_high, I_low, I_high] = r;
            if (C >= C_low && C <= C_high) {
                return ((I_high - I_low) / (C_high - C_low)) * (C - C_low) + I_low;
            }
        }
        return 500;
    }

    const aqi_pm25 = calc("pm25", pm25);
    const aqi_pm10 = calc("pm10", pm10);

    return Math.round(Math.max(aqi_pm25, aqi_pm10));
}


/* -------------------------------------------------------
   AIR POLLUTION API (OPENWEATHER)
---------------------------------------------------------*/
async function getAQI(lat, lon) {
    const url =
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    const c = data.list[0].components;
    const pm25 = c.pm2_5;
    const pm10 = c.pm10;

    return calculateAQI(pm25, pm10);
}


/* -------------------------------------------------------
   CHOOSE BACKGROUND (REAL SEASON-BASED)
---------------------------------------------------------*/
function chooseBackground(main, temp, wind, lat) {

    // Weather-based overrides FIRST
    if (wind >= 20) return "windyy.gif";
    if (main === "Rain" || main === "Drizzle") return "rainy.gif";
    if (main === "Snow") return "winter.gif";

    // Clouds should match season, NOT force autumn
    if (main === "Clouds") {
        const season = getRealSeason(lat);
        return season + ".gif";  // cloudy winter? winter.gif
    }

    // If nothing else overrides → use real season
    const season = getRealSeason(lat);
    return season + ".gif";
}


/* -------------------------------------------------------
   MOOD TEXT
---------------------------------------------------------*/
function chooseMood(main, temp, wind) {
    if (wind >= 20) return "Windy 💨";
    if (main === "Rain") return "Rainy ☔";
    if (main === "Snow") return "Snowy ❄";
    if (main === "Clouds") return "Cloudy ☁";
    return "Clear 🌤";
}


/* -------------------------------------------------------
   UPDATE UI
---------------------------------------------------------*/
async function updateWindow(prefix, data) {

    const main = data.weather[0].main;
    const temp = Math.round(data.main.temp);
    const humidity = data.main.humidity;
    const wind = Math.round(data.wind.speed * 3.6);
    const lat = data.coord.lat;
    const lon = data.coord.lon;

    const bg = chooseBackground(main, temp, wind, lat);
    setBackground(document.getElementById(prefix + "Background"), bg);

    document.getElementById(prefix + "Temp").textContent = temp + "°C";
    document.getElementById(prefix + "Humidity").textContent = "H: " + humidity + "%";
    document.getElementById(prefix + "Wind").textContent = "W: " + wind + " km/h";

    const aqi = await getAQI(lat, lon);
    document.getElementById(prefix + "AQI").textContent = "AQI: " + aqi;

    document.getElementById(prefix + "Mood").textContent =
        chooseMood(main, temp, wind);

    document.getElementById(prefix + "Tomorrow").textContent =
        "Tomorrow: " + main;

    document.getElementById(prefix + "Side").textContent =
        "Feels like: " + Math.round(data.main.feels_like) + "°C";

    // Sakura popup
    document.getElementById("popupCity").textContent = "City: " + data.name;
    document.getElementById("popupCountry").textContent =
        "Country: " + data.sys.country;
    document.getElementById("popupSeason").textContent =
        "Season: " + bg.replace(".gif", "");
    document.getElementById("popupSunrise").textContent =
        "Sunrise: " + new Date(data.sys.sunrise * 1000).toLocaleTimeString();
    document.getElementById("popupSunset").textContent =
        "Sunset: " + new Date(data.sys.sunset * 1000).toLocaleTimeString();
}


/* -------------------------------------------------------
   WEATHER API
---------------------------------------------------------*/
async function getWeatherByCoords(lat, lon) {
    const url =
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    return (await fetch(url)).json();
}

async function getWeather(city) {
    const url =
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
    return (await fetch(url)).json();
}


/* -------------------------------------------------------
   LOAD AUTO LOCATION
---------------------------------------------------------*/
function loadAuto() {
    navigator.geolocation.getCurrentPosition(async pos => {
        const data = await getWeatherByCoords(
            pos.coords.latitude,
            pos.coords.longitude
        );
        updateWindow("auto", data);
    });
}


/* -------------------------------------------------------
   CITY SEARCH
---------------------------------------------------------*/
async function loadCity() {
    const c = document.getElementById("cityInput").value.trim();
    if (!c) return;
    const data = await getWeather(c);
    updateWindow("search", data);
}


/* -------------------------------------------------------
   INIT
---------------------------------------------------------*/
document.addEventListener("DOMContentLoaded", () => {

    loadAuto();

    setBackground(
        document.getElementById("searchBackground"),
        "sunday-mornings_calm.gif"
    );

    document.getElementById("searchBtn").addEventListener("click", loadCity);

    document.getElementById("cityInput").addEventListener("keydown", e => {
        if (e.key === "Enter") loadCity();
    });
});
