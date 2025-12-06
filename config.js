module.exports = {
  //port
  PORT: process.env.PORT || 5000,

  //secret key for API
  SECRET_KEY: process.env.SECRET_KEY || "E21A7F1EF5563ABBCD24615B2E7FE",

  //gmail credentials for send email
  EMAIL: process.env.EMAIL || "katkotlive0@gmail.com",
  PASSWORD: "pvcl azlf yyaq rjcm",

  //secret key for jwt
  JWT_SECRET: process.env.JWT_SECRET || "E21A7F1EF5563ABBCD24615B2E7FE",

  //baseURL
  baseURL: process.env.BASE_URL || "https://seahorse-app-dus62.ondigitalocean.app/",

  //firebase server key for send notification
  SERVER_KEY: process.env.SERVER_KEY || "server_key_here",
};
