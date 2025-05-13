//Script to have AI generate a joke 

async function getScamJoke() {
  const res = await fetch("/api/joke");
  const data = await res.json();
  document.getElementById("joke-output").innerText = data.joke;
}
