require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require("http");
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

const PORT = process.env.PORT || 801;
server.listen(PORT, () => {
  console.log(`The Service running well... at http://localhost:${PORT}`);
});
