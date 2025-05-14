//Script to have AI generate a joke 

async function getScamJoke() {

  // First display a loading icon
  document.getElementById("joke-output").innerText = "Loading...";
  // Then fetch the joke from the server
  const res = await fetch("/api/joke");
  const data = await res.json();
  document.getElementById("joke-output").innerText = data.joke;
}
