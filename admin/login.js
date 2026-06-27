function login() {

  const usuario = document.getElementById("usuario").value;

  const password = document.getElementById("password").value;

  const error = document.getElementById("error");

  // CAMBIA ESTOS DATOS
  const USER = "admin";

  const PASS = "Yamir2020.";

  if (
    usuario === USER &&
    password === PASS
  ) {

    localStorage.setItem(
      "adminLogueado",
      "true"
    );

    window.location.href = "index.html";

  }

  else {

    error.innerText =
      "Usuario o contraseña incorrectos";

  }

}