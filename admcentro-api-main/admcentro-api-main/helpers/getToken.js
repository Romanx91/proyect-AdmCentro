const fs = require("fs");
const axios = require("axios");
require("dotenv").config();

async function getToken() {
  try {
    const email = process.env.PROD_EMAIL;
    const password = process.env.PROD_PASSWORD;

    if (!email || !password) {
      throw new Error("❌ Falta PROD_EMAIL o PROD_PASSWORD en el archivo .env");
    }

    const res = await axios.post(
      "https://vps-3272208-x.dattaweb.com/api/v1/auth/signin",
      { email, password },
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("Respuesta completa del servidor:\n", res.data);

    const token = res.data.token || res.data?.data?.token;
    if (!token) {
      console.log("⚠️ No se encontró token en la respuesta.");
      return;
    }

    console.log("✅ Token obtenido:", token);

    let envContent = fs.readFileSync(".env", "utf8");
    if (envContent.includes("TOKEN_PROD_MIGRATION")) {
      envContent = envContent.replace(
        /TOKEN_PROD_MIGRATION=.*/g,
        `TOKEN_PROD_MIGRATION=${token}`
      );
    } else {
      envContent += `\nTOKEN_PROD_MIGRATION=${token}`;
    }
    fs.writeFileSync(".env", envContent);

    console.log("✅ TOKEN_PROD_MIGRATION actualizado en .env");
  } catch (err) {
    console.error("❌ Error al obtener el token:\n", err.message);
  }
}

getToken();
