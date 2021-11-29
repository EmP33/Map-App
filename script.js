'use strict';

class Workout {
  #date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;
  constructor(coords, inputDistance, inputDuration) {
    this.coords = coords;
    this.distance = inputDistance;
    this.duration = inputDuration;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December',
    ];
    return (this.description = ` ${
      this.type[0].toUpperCase() + this.type.slice(1)
    } on ${months[this.#date.getMonth()]} ${this.#date.getDate()}`);
  }
}
class Running extends Workout {
  type = 'running';
  constructor(coords, inputDistance, inputDuration, inputCadence) {
    super(coords, inputDistance, inputDuration);
    this.cadence = inputCadence;
    this._calcPace();
  }
  _calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, inputDistance, inputDuration, inputElevation) {
    super(coords, inputDistance, inputDuration);
    this.elevation = inputElevation;
    this._calcSpeed();
  }
  _calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
///////////////////////////////////////////////////////
//App architecutre
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workout = [];
  #workouts = [];
  constructor() {
    this._getPosition();

    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleElevationField.bind(this));

    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    this._getLocalStorage();
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }localStorage

  _loadMap(position) {
    const { latitude, longitude } = position.coords;

    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;

    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _toggleElevationField() {
    inputCadence.parentElement.classList.toggle('form__row--hidden');
    inputElevation.parentElement.classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);
    e.preventDefault();
    const { lat, lng } = this.#mapEvent.latlng;
    const coords = [lat, lng];
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    let workout;
    let popupClass;
    if (type === 'running') {
      const cadence = +inputCadence.value;

      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('Inputs have to be positive');
      }

      // if (
      //   !Number.isFinite(distance) ||
      //   !Number.isFinite(duration) ||
      //   !Number.isFinite(cadence)
      // ) {
      //   alert('Inputs have to be positive');
      // }

      popupClass = 'running-popup';
      workout = new Running(coords, distance, duration, cadence);
      workout._setDescription();
      this.#workouts.push(workout);
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert('Inputs have to be positive');
      }
      popupClass = 'cycling-popup';
      workout = new Cycling(coords, distance, duration, elevation);
      workout._setDescription();
      this.#workouts.push(workout);
    }

    this._setLocalStorage();
    this._renderWorkoutMarker(workout);
    this._renderWorkout(workout);
    this._hideForm();
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          closeOnClick: false,
          autoClose: false,
          className: `${workout.type}-popup`,
        })
      )

      .setPopupContent(
        `${workout.type === 'cycling' ? '🚴‍♂️' : '🏃‍♂️'} ${workout.description}`
      )
      .openPopup();
  }
  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _renderWorkout(workout) {
    let post = `<li class="workout workout--${
      workout.type === 'running' ? 'running' : 'cycling'
    }" data-id="${workout.id}">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
   `;
    if (workout.type === 'running') {
      post += ` <div class="workout__details">
     <span class="workout__icon">⚡️</span>
     <span class="workout__value">${workout.pace.toFixed(1)}</span>
     <span class="workout__unit">min/km</span>
   </div>
   <div class="workout__details">
     <span class="workout__icon">🦶🏼</span>
     <span class="workout__value">${workout.cadence}</span>
     <span class="workout__unit">spm</span>
   </div>
 </li>`;
    }
    if (workout.type === 'cycling') {
      post += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevation}</span>
        <span class="workout__unit">m</span>
      </div>        
  </li>`;
    }
    form.insertAdjacentHTML('afterend', post);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    workout.clicks++;
  }
  _setLocalStorage() {
    localStorage.setItem('wk', JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('wk'));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }
}

const app = new App();
