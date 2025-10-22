const express = require('express')
const { DB } = require('../config/conf')
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

module.exports = {

    search: async function (req, res) {
        try {
            const {tglDocStart, tglDocEnd, tglDaftarStart, tglDaftarEnd, tglBuktiStart, tglBuktiEnd, jenisLaporan, jenisDoc,} = req.query;
            console.log("PARAMETER DITERIMA :", {tglDocStart, tglDocEnd, tglDaftarStart, tglDaftarEnd, tglBuktiStart, tglBuktiEnd, jenisLaporan, jenisDoc,});

            const dataPath = path.join(__dirname, '../sample/searchLaporan.json');
            const rawData = fs.readFileSync(dataPath);
            const data = JSON.parse(rawData);

            res.status(200).json({ kode: 200, data });
        } catch (error) {
            console.log(error);
            res.status(500).json(error);
        }
    },

}