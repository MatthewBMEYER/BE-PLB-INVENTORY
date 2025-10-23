const express = require('express')
const route = express.Router();
const browseController = require("../controllers/browseController");

route.use(express.urlencoded({ extended: false }));

// -- Search -- //
route.get("/laporanPemasukan/search", browseController.pemasukan_search);
route.get("/laporanPengeluaran/search", browseController.pengeluaran_search);
route.get("/laporanMutasi/search", browseController.mutasi_search);

// -- Download -- //
route.get("/laporanPemasukan/download", browseController.pemasukan_download);
route.get("/laporanPengeluaran/download", browseController.pengeluaran_download);
route.get("/laporanMutasi/download", browseController.mutasi_download);

module.exports = route;