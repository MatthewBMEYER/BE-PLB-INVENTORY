const express = require('express')
const { DB } = require('../config/conf')
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const ExcelJS = require("exceljs");

module.exports = {

    dokumen_search: async function (req, res) {
        try {
            const { nomorJob,
                jenisPengajuan,
                referensi,
                dokumen,
                importirExportir,
                pengajuanVia,
                tdsStatus,
                mandiriStatus } = req.query;

            const dataPath = path.join(__dirname, '../sample/DokumenInventory.json');
            const rawData = fs.readFileSync(dataPath);
            const data = JSON.parse(rawData);

            res.status(200).json({ kode: 200, data });
        } catch (error) {
            console.log(error);
            res.status(500).json(error);
        }
    },

    dokumen_lihatPengajuan: async function (req, res) {
        try {
            const id = req.params.id;
            const dataPath = path.join(__dirname, '../sample/LihatPengajuan.json');
            const rawData = fs.readFileSync(dataPath);
            const data = JSON.parse(rawData);

            res.status(200).json({ kode: 200, data });
        } catch (error) {
            console.log(error);
            res.status(500).json(error);
        }
    },


}