"use strict";

const form = document.querySelector(".form");
const containerPlans = document.getElementById("plans");
const inputTitle = document.querySelector(".plan_title_input");
// Buttons
const addButton = document.querySelector(".btn_add");
const saveButton = document.querySelector(".btn_save");
const deleteButton = document.querySelector(".btn_delete");

class App {
  // Private class properties
  #map;
  #mapZoomLevel = 19;
  #mapEvent;
  #currentCoords = [];
  #plans = [];
  #latlngs = [];
  #currentLayer = [];
  #polylines = [];

  constructor() {
    // Get user's position
    this._getPosition();

    // get data from local storage
    this._getLocalStorage();

    // Attach event handlers
    containerPlans.addEventListener("click", this._moveToPopup.bind(this));
    addButton.addEventListener("click", this._showForm.bind(this));
    saveButton.addEventListener("click", this._saveCurrentPlan.bind(this));
    deleteButton.addEventListener("click", this.reset.bind(this));
  }

  _getPosition() {
    // Gets the user's position using the in-browser golocation. If the navigation is not enabled, the function will throw an error
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert(
            "Could not get your position, please verify the browser settings for location and check your internet connection"
          );
        }
      );
  }

  _loadMap(position) {
    // Loads the map in the position specified.
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    // coords for current user's location
    const coordsLoc = [latitude, longitude];
    //   Coords for Bucharest
    const coords = [44.4357786, 26.0323529];

    this.#map = L.map("map").setView(coords, this.#mapZoomLevel);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on("click", this._newPoint.bind(this));

    this.#currentCoords.forEach((point) => {
      this._renderPlanMarker(point);
      this._renderPolyline(point);
    });
  }

  _showForm(e) {
    // Shows the form for inputting the title for the current plan
    e.preventDefault();
    this.#currentCoords = [];
    this.#latlngs = [];
    this._removeRenderedPlan();
    form.classList.remove("hidden");
    inputTitle.focus();
  }

  _hideForm() {
    // Hides the form for the plan
    inputTitle.value = "";
    form.classList.add("hidden");
  }

  _newPoint(mapE) {
    // Inserts a new marker on the map
    const { lat, lng } = mapE.latlng;
    let point;

    // Check if data is valid
    if (!inputTitle.value)
      return alert("Please add a new plan and enter a title");

    point = [lat, lng];

    // Add new object to coordinates array
    this.#currentCoords.push(point);

    // Renders the marker for the current point and the polylines between points
    this._renderPlanMarker(point);
    this._renderPolyline(point);
  }

  _renderPlanMarker(point) {
    // Display the pin
    const markerPoint = L.circle(point, {
      color: "red",
      fillColor: "red",
      fillOpacity: 1,
      radius: 2,
    })
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          closeOnClick: false,
        })
      )
      .setPopupContent("Point");

    markerPoint.addTo(this.#map).openPopup();
    this.#currentLayer.push(markerPoint);
  }

  _renderPolyline(point) {
    // Displays the polylines between points
    this.#latlngs.push(point);
    let polyline = L.polyline(this.#latlngs, { color: "red" });
    polyline.addTo(this.#map);
    this.#polylines.push(polyline);
    this.#map.fitBounds(polyline.getBounds());
  }

  _renderPlanInSidebar(plan) {
    // Renders the form in the sidebar
    let html = `<div id=${plan.id} class="flight_plan">
    ${plan.title}
  </div>`;

    form.insertAdjacentHTML("afterend", html);
  }

  _moveToPopup(e) {
    // Move the view on the first point of the plan and removes the other renders of points and polylines
    const planEl = e.target.closest(".flight_plan");

    // Guard clause for no plan clicked
    if (!planEl) return;

    const plan = this.#plans.find((p) => +p.id === +planEl.id);

    // Guard clause for plan without selected points
    if (!plan.plan[0]) return alert("No point selected for this plan");

    this.#map.setView(plan.plan[0], this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    this._removeRenderedPlan();
    plan.plan.forEach((p) => {
      this._renderPlanMarker(p);
      this._renderPolyline(p);
    });
  }

  _removeRenderedPlan() {
    // Removes the present points and polylines
    this.#currentLayer.forEach((p) => p.remove());
    this.#polylines.forEach((l) => l.remove());
    this.#latlngs = [];
  }

  _saveCurrentPlan() {
    // saves the current plan
    const title = inputTitle.value;

    if (!title) return alert("Please input a name for the plan before saving!");

    const plan = {
      id: Date.now(),
      title: title,
      plan: [...this.#currentCoords],
    };
    this.#plans.push(plan);

    this._setLocalStorage();
    this._hideForm();
    this._renderPlanInSidebar(plan);
  }

  _setLocalStorage() {
    // Adds the plans to the local storage
    localStorage.setItem("plans", JSON.stringify(this.#plans));
  }

  _getLocalStorage() {
    // Get the data from the local storage
    const data = JSON.parse(localStorage.getItem("plans"));

    if (!data) return;

    this.#plans = data;

    this.#plans.forEach((p) => {
      this._renderPlanInSidebar(p);
    });
  }

  reset(e) {
    // Resets all the plans
    e.preventDefault();
    localStorage.removeItem("plans");
    location.reload();
  }
}

const droneFlighPlanApp = new App();
