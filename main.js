const userName = document.querySelector("#name");
const userWeight = document.querySelector("#weight");
const saveBtn = document.querySelector(".save");

let db;

window.onload = function() {
  userName.value = "";
  userWeight.value = 0;
  userName.focus();

  // create indexedDB
  let request = window.indexedDB.open("weightControl");
  // create objectStore and indexes
  request.onupgradeneeded = function(e) {
    let db = e.target.result;
    let oStore = db.createObjectStore("users", {keyPath: "name"});

    oStore.createIndex("weight", "weight", {unique: false});
    oStore.createIndex("created", "created", {unique: false});
  }

  request.onsuccess = function() {
    db = request.result;
  }
}

function checkUser() {
  let n = userName.value;
  let obStore = db.transaction(["users"]).objectStore("users");
  let request = obStore.get(n);

  request.onsuccess = function() {
    // if username not found then make new user
    if(request.result === undefined) {
      addData();
    }
    else {
      //if username found then add new weight and day to arrays
      let d = new Date();
      let day = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
      let newUser = {
        name: request.result.name.toLowerCase(),
        weight: request.result.weight,
        created: request.result.created
      };
      request.result.weight.push(userWeight.value);
      request.result.created.push(day);
      // update indexedDB
      updateData(newUser);
      // show graph
      showData(newUser.created, newUser.weight);
    }
    
  }
  request.onerror = function() {
    console.log("Can't get info from database");
  }
}


function addData() {
  let d = new Date();
  let day = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
  // add newUser
  let newUser = {
    name: userName.value,
    weight: [userWeight.value],
    created: [day]
  };
  
  let transaction = db.transaction(["users"], "readwrite");
  let obStore = transaction.objectStore("users");
  let request = obStore.add(newUser);

  request.onsuccess = function() {
    userName.value = "";
    userWeight.value = 0;
    userName.focus();
  }

  request.onerror = function() {
    console.log("Can't add values to DB!");
  }

  transaction.oncomplete = function() {
    // when new user is added to DB then show graph
    showData(newUser.created, newUser.weight);
  }
}

function updateData(user) {
  let transaction = db.transaction(["users"], "readwrite");
  let obStore = transaction.objectStore("users");
  let request = obStore.put(user);

  request.onsuccess = function() {
    userName.value = "";
    userWeight.value = 0;
    userName.focus();
  }

  request.onerror = function() {
    console.log("Can't update user!");
  }
}

function showData(dayArr, weightArr) {
  // remove old canvas
  const oldCanvas = document.querySelector("#chart");
  oldCanvas.parentNode.removeChild(oldCanvas);
  // add new canvas element
  const canvasCont = document.querySelector(".chart-container");
  const c = document.createElement("canvas");
  c.id = "chart";
  canvasCont.appendChild(c);
  //make new chart using chart.js 
  const ctx = document.querySelector('#chart').getContext('2d');
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: dayArr,
        datasets: [{
            label: 'Weight',
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 98, 132)',
            fill: false,
            data: weightArr
        }]
    },
    options: {
      maintainAspectRatio: false,
      title: {
        display: true,
        text: 'Weight tracker'
      },
      tooltips: {
        mode: 'index',
        intersect: false,
      },
      hover: {
        mode: 'nearest',
        intersect: true
      },
      scales: {
        xAxes: [{
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Day'
          }
        }],
        yAxes: [{
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Value'
          }
        }]
      }
    }
  });
}
// Save weight button event listener
saveBtn.addEventListener("click", checkUser);

// if you wanna delete database try this on console:
// indexedDB.deleteDatabase("weightControl");
