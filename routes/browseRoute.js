const express = require('express')
const route = express.Router();
const browseController = require("../controllers/browseController");

route.use(express.urlencoded({ extended: false }));

route.get("/laporan/search", browseController.search);


module.exports = route;