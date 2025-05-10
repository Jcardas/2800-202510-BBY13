console.log("Location alert script loaded.");

fetch("https://ipapi.co/json/")
    .then(response => response.json())
    .then(locationData => {
        const city = locationData.city;
        const country = locationData.country_name;
        const lat = locationData.latitude;
        const lon = locationData.longitude;

        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
            .then(response => response.json())
            .then(weatherData => {
                const temperature = weatherData.current_weather.temperature;
                document.getElementById("banner-text").textContent =
                    `We know that you are now in ${city}, ${country} (${temperature}°C), so do the scammers and online hackers! Stay alert.`;
            })
            .catch(() => {
                document.getElementById("banner-text").textContent =
                    `We know that you are now in ${city}, ${country}. So do the scammers and online hackers! Stay alert.`;
            });
    })
    .catch(() => {
        document.getElementById("banner-text").textContent =
            "We know where you are, so do scammers! Stay alert.";
    });