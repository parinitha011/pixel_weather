/* -------------------------------------------------------
   SET BACKGROUND IMAGE
---------------------------------------------------------*/
function setBackground(el, file) {
    el.style.backgroundImage = `url('images/${file}')`;
}

/* -------------------------------------------------------
   REAL SEASONS
---------------------------------------------------------*/
function getRealSeason(lat) {
    const north = lat > 0;
    const today = new Date();
    const y = today.getFullYear();

    const spring = new Date(y, 2, 20);
    const summer = new Date(y, 5, 21);
    const autumn = new Date(y, 8, 23);
    const winter = new Date(y, 11, 21);

    if (north) {
        if (today >= winter || today < spring) return "winter.gif";
        if (today >= spring && today < summer) return "spring.gif";
        if (today >= summer && today < autumn) return "summer.gif";
        return "autumn.gif";
    } else {
        if (today >= winter || today < spring) return "summer.gif";
        if (today >= spring && today < summer) return "autumn.gif";
        if (today >= summer && today < autumn) return "winter.gif";
        return "spring.gif";
    }
}

/* -------------------------------------------------------
   AQI CALCULATION
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
                return ((I_high - I_low) / (C_high - C_low)) *
                    (C - C_low) + I_low;
            }
        }
        return 500;
    }

    return Math.round(Math.max(
        calc("pm25", pm25),
        calc("pm10", pm10)
    ));
}

/* -------------------------------------------------------
   FETCH AQI
---------------------------------------------------------*/
async function getAQI(lat, lon) {
    const res = await fetch(`/aqi?lat=${lat}&lon=${lon}`);
    const data = await res.json();

    // guard: if data.list or components missing, return fallback
    if (!data || !data.list || !data.list[0] || !data.list[0].components) {
        return "N/A";
    }

    const c = data.list[0].components;
    return calculateAQI(c.pm2_5, c.pm10);
}

/* -------------------------------------------------------
   CHOOSE BACKGROUND
---------------------------------------------------------*/
function chooseBackground(main, temp, wind, lat) {
    if (wind >= 20) return "windyy.gif";
    if (main === "Rain" || main === "Drizzle") return "rainy.gif";
    if (main === "Snow") return "winter.gif";

    return getRealSeason(lat);
}

/* -------------------------------------------------------
   MOOD
---------------------------------------------------------*/
function chooseMood(main, temp, wind) {
    if (wind >= 20) return "Windy 💨";
    if (main === "Rain") return "Rainy ☔";
    if (main === "Snow") return "Snowy ❄";
    if (main === "Clouds") return "Cloudy ☁";
    return "Clear 🌤";
}

/* -------------------------------------------------------
   UPDATE WINDOW
---------------------------------------------------------*/
async function updateWindow(prefix, data) {

    // basic guards
    if (!data || !data.weather || !data.weather[0] || !data.main) return;

    const main = data.weather[0].main;
    const temp = Math.round(data.main.temp);
    const humidity = data.main.humidity;
    const wind = Math.round(data.wind.speed * 3.6);

    const lat = data.coord ? data.coord.lat : 0;
    const lon = data.coord ? data.coord.lon : 0;

    // background
    const bg = chooseBackground(main, temp, wind, lat);
    setBackground(document.getElementById(prefix + "Background"), bg);

    // main data
    document.getElementById(prefix + "Temp").textContent = `${temp}°C`;
    document.getElementById(prefix + "Humidity").textContent = `H: ${humidity}%`;
    document.getElementById(prefix + "Wind").textContent = `W: ${wind} km/h`;

    // AQI
    const aqi = await getAQI(lat, lon);
    document.getElementById(prefix + "AQI").textContent = `AQI: ${aqi}`;

    // mood + tomorrow
    document.getElementById(prefix + "Mood").textContent =
        chooseMood(main, temp, wind);

    document.getElementById(prefix + "Tomorrow").textContent =
        `Tomorrow: ${main}`;

    // feels like side box
    document.getElementById(prefix + "Side").textContent =
        `Feels like: ${Math.round(data.main.feels_like)}°C`;


    // --- SAKURA POPUP (simple direct updates) ---
    const popupCityEl = document.getElementById("popupCity");
    const popupCountryEl = document.getElementById("popupCountry");
    const popupSeasonEl = document.getElementById("popupSeason");
    const popupSunriseEl = document.getElementById("popupSunrise");
    const popupSunsetEl = document.getElementById("popupSunset");

    if (popupCityEl) popupCityEl.textContent =
        "City: " + (data.name || "--");

    if (popupCountryEl) popupCountryEl.textContent =
        "Country: " + (data.sys && data.sys.country ? data.sys.country : "--");

    // compute a season label (match your background)
    if (popupSeasonEl) popupSeasonEl.textContent =
        "Season: " + (typeof bg === "string" ? bg.replace(".gif", "") : "--");

    // sunrise / sunset (guarded)
    if (popupSunriseEl) popupSunriseEl.textContent =
        "Sunrise: " + (data.sys && data.sys.sunrise ? new Date(data.sys.sunrise * 1000).toLocaleTimeString() : "--");

    if (popupSunsetEl) popupSunsetEl.textContent =
        "Sunset: " + (data.sys && data.sys.sunset ? new Date(data.sys.sunset * 1000).toLocaleTimeString() : "--");
} // end updateWindow


/* -------------------------------------------------------
   API CALLS
---------------------------------------------------------*/
async function getWeather(city) {
    return (await fetch(`/weather?city=${city}`)).json();
}

async function getWeatherByCoords(lat, lon) {
    return (await fetch(`/weathercoords?lat=${lat}&lon=${lon}`)).json();
}

/* -------------------------------------------------------
   INIT
---------------------------------------------------------*/
function loadAuto() {
    navigator.geolocation.getCurrentPosition(async pos => {
        const data = await getWeatherByCoords(
            pos.coords.latitude,
            pos.coords.longitude
        );
        updateWindow("auto", data);
    }, (err) => {
        // silently fail geolocation if user blocks it
        console.warn("Geolocation failed:", err);
    });
}

async function loadCity() {
    const city = document.getElementById("cityInput").value.trim();
    if (!city) return;

    const data = await getWeather(city);
    updateWindow("search", data);
}

document.addEventListener("DOMContentLoaded", () => {
    loadAuto();

    // keep the calm GIF as initial search background
    setBackground(
        document.getElementById("searchBackground"),
        "sunday-mornings_calm.gif"
    );

    document.getElementById("searchBtn").addEventListener("click", loadCity);
    document.getElementById("cityInput").addEventListener("keydown", e => {
        if (e.key === "Enter") loadCity();
    });
});
