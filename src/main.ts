import "./style.css";

const app = document.getElementById("app")!;

const button = document.createElement("button");
button.textContent = "Click me!";
button.onclick = () => {
  alert("Hello, world!");
};
app.appendChild(button);
