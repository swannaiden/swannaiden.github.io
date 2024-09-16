/*
Aiden Swann
UID: 2132118
Date 2/20/2021

weather.js is an interactive webpage which reports weather data from a user 
entered zip code using a location and weather api
*/


(function() {
    "use strict";

    // API 1
    const ZIP_API_URL = "http://api.zippopotam.us/us/";
    // API 2, using API 1 results
    const WEATHER_API_URL = "http://api.openweathermap.org/data/2.5/weather";
    // open weather key
    const APPID = "e0f6ffa9c6b0b61db9eb6e346c35729a"; 

    window.addEventListener("load", init);

    /**
     * Sets up the page to request weather data when a user has entered a zip code
     * and clicks on the Get Weather! button.
     */
    function init() {
        // attached submit listener to the form
        let submitButton = id("weather");
        submitButton.addEventListener("submit", fetchLocationData);
    }

    /**
     * Handles the submit request, checking for valid (non-empty) input
     * for zipcode and then requesting location information for the given zipcode
     * to use in another fetch request for weather data to update the page with
     * information. 
     * 
     * If zipcode input is empty, displays an error message on the page and
     * hides any earlier results.
     * 
     * @param {Object} evt - submit event object to override default submit behavior 
     */
    function fetchLocationData(evt) {
        evt.preventDefault(); // prevent default submit behavior

        // get value of zipcode entered
        let zip = id('zipcode').value

        // check if empty
        if(zip === '') {
          handleError('empty zip code')
          return
        }
        
        // fetch location data from zip code and call fetchWeatherData with response
        fetch(ZIP_API_URL+zip)
        .then(checkStatus)
        .then(response => response.json())
        .then(fetchWeatherData)
        .catch(err => handleError('zip code not found'))
    }

    /**
     * Uses the given data to fetch the current weather forecast with for a particular
     * city, state, and country abbreviation that were returned from the first Zippopotamus
     * API request when given a ZIP code.
     * 
     * @param {JSON} data - data from Zippopotamus API
     */
    function fetchWeatherData(data) {

        // get first location from zipcode api
        let firstMatch = data.places[0];
        let url = WEATHER_API_URL;
        
        // get date needed to call the weather api
        let city = firstMatch['place name']
        let state = firstMatch['state']
        let country = data["country abbreviation"]
        
        // build the query string
        let query = '?appid=' + APPID + '&units=imperial&q=' + city + ',' + state + ',' + country

        // call the open weather API, call processWeatherData with response
        fetch(WEATHER_API_URL+query)
        .then(checkStatus)
        .then(response => response.json())
        .then(processWeatherData)
        .catch(err => handleError('cannot find weather at given location'));

    }

    /**
     * Uses the given data to fetch the current weather forecast with for a particular
     * city, state, and country abbreviation that were returned from the first Zippopotamus
     * API request when given a ZIP code.
     * 
     * @param {JSON} data - data from OpenWeather API
     */
    function processWeatherData(data) {
     
      // weather location to be updated on page
      let location = data.name
      id('location').textContent = location

      // url of weather icon
      let iconUrl = "http://openweathermap.org/img/w/" + data.weather[0].icon + ".png";
      // create image element and set url and alt text
      let img = document.createElement("IMG")
      img.setAttribute('src', iconUrl)
      img.setAttribute('alt', data.weather.main)
      // display image under icon
      if(id('icon').firstChild) {
        id('icon').removeChild(id('icon').firstChild)
      }
      document.getElementById('icon').appendChild(img)

      // update temperature
      let temp = data.main.temp
      document.getElementById('temp').textContent = temp

      // update windspeed
      let wind = data.wind.speed
      document.getElementById('windspeed').textContent = wind + " mph"

      // update date
      let dt = data.dt
      id("result-time").textContent = Date(dt); 

      // show the response
      id('response').classList.remove('hidden')
      id('results').classList.remove('hidden')

      // hid any previous error messages
      id('error').classList.add('hidden')

    }

    /* ------------------------------ Helper Functions ------------------------------ */
    /**
     * Helper function to return the response's result text if successful, otherwise
     * returns the rejected Promise result with an error status and corresponding text
     * @param {object} response - response to check for success/error
     * @returns {object} - Response if status code is ok (200-level)
     */
    function checkStatus(response) {
      if (!response.ok) {
        // Throwing this Error will be caught in the .catch of a fetch pipeline, 
        // skipping the remaining .then calls
        throw Error("Error in request: " + response.statusText);
      }
      return response; // a Response object
    }
    
    /**
     * Displays an error message on the page, hiding any previous results.
     * @param {string} errMsg - error message to display on page. 
     */
    function handleError(errMsg) {
        let errorP = id("error");
        errorP.textContent = errMsg;
        errorP.classList.remove("hidden");
        id("response").classList.remove("hidden");
        id("results").classList.add("hidden");
    }

    /**
     * Returns the element that has the ID attribute with the specified value.
     * @param {string} idName - element ID
     * @returns {object} DOM object associated with id.
     */
    function id(idName) {
        return document.getElementById(idName);
    }

    /**
     * Returns the first element that matches the given CSS selector.
     * @param {string} query - CSS query selector.
     * @returns {object[]} array of DOM objects matching the query.
     */
    function qs(query) {
        return document.querySelector(query);
    }

    /**
     * Returns the array of elements that match the given CSS selector.
     * @param {string} query - CSS query selector
     * @returns {object[]} array of DOM objects matching the query.
     */
    function qsa(query) {
        return document.querySelectorAll(query);
    }
})();
