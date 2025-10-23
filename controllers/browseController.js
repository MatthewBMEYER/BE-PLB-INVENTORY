const express = require('express')
const { DB } = require('../config/conf')
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const ExcelJS = require("exceljs");

module.exports = {

    pemasukan_search: async function (req, res) {
        try {
            const {tglDocStart, tglDocEnd, tglDaftarStart, tglDaftarEnd, tglBuktiStart, tglBuktiEnd, jenisDoc,} = req.query;

            const dataPath = path.join(__dirname, '../sample/LaporanPemasukan.json');
            const rawData = fs.readFileSync(dataPath);
            const data = JSON.parse(rawData);

            res.status(200).json({ kode: 200, data });
        } catch (error) {
            console.log(error);
            res.status(500).json(error);
        }
    },

    pengeluaran_search: async function (req, res) {
        try {
            const {tglDocStart, tglDocEnd, tglDaftarStart, tglDaftarEnd, tglBuktiStart, tglBuktiEnd, jenisDoc,} = req.query;

            const dataPath = path.join(__dirname, '../sample/LaporanPengeluaran.json');
            const rawData = fs.readFileSync(dataPath);
            const data = JSON.parse(rawData);

            res.status(200).json({ kode: 200, data });
        } catch (error) {
            console.log(error);
            res.status(500).json(error);
        }
    },

    mutasi_search: async function (req, res) {
        try {
            const {tglDocStart, tglDocEnd, tglDaftarStart, tglDaftarEnd, tglBuktiStart, tglBuktiEnd, jenisDoc,} = req.query;
            console.log("search mutasi :", {tglDocStart, tglDocEnd, tglDaftarStart, tglDaftarEnd, tglBuktiStart, tglBuktiEnd, jenisDoc,});

            const dataPath = path.join(__dirname, '../sample/LaporanMutasi.json');
            const rawData = fs.readFileSync(dataPath);
            const data = JSON.parse(rawData);

            res.status(200).json({ kode: 200, data });
        } catch (error) {
            console.log(error);
            res.status(500).json(error);
        }
    },

    pemasukan_download: async function (req, res) {
        try {
            const {tglDocStart, tglDocEnd, tglDaftarStart, tglDaftarEnd, tglBuktiStart, tglBuktiEnd, jenisDoc,} = req.query;
            const dataPath = path.join(__dirname, "../sample/LaporanPemasukan.json");
            const rawData = fs.readFileSync(dataPath);
            const data = JSON.parse(rawData);
    
            // === Generate Excel ===
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Laporan Pemasukan");  
            // header kolom
            worksheet.columns = [
              { header: "No", key: "no", width: 5 },
              { header: "Dokumen", key: "dokumen", width: 10 },
              { header: "Nomor Daftar", key: "no_daftar", width: 18 },
              { header: "Tanggal Daftar", key: "tgl_daftar", width: 15 },
              { header: "No Bukti Terima", key: "no_bukti_penerimaan", width: 22 },
              { header: "Tanggal Bukti Terima", key: "tgl_bukti_penerimaan", width: 20 },
              { header: "Pengirim / Pemasok", key: "pengirim", width: 25 },
              { header: "Nama Pemilik", key: "nama_pemilik", width: 25 },
              { header: "Kode Barang", key: "kode_barang", width: 20 },
              { header: "Nama Barang", key: "nama_barang", width: 25 },
              { header: "Satuan", key: "satuan", width: 10 },
              { header: "Jumlah", key: "jumlah", width: 10 },
            ];
      
            // isi data ke sheet
            data.forEach((item) => {
              worksheet.addRow(item);
            });
      
            // styling header biar rapi
            worksheet.getRow(1).eachCell((cell) => {
              cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" }, };
              cell.alignment = { vertical: "middle", horizontal: "center" };
            });
      
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", "attachment; filename=Laporan_Pemasukan.xlsx");
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            console.error(error);
            if (!res.headersSent) {
                res.status(500).json({ kode: 500, message: "Gagal export Excel", error });
            }
        }
    },

    pengeluaran_download: async function (req, res) {
        try {
            const {tglDocStart, tglDocEnd, tglDaftarStart, tglDaftarEnd, tglBuktiStart, tglBuktiEnd, jenisDoc,} = req.query;
            const dataPath = path.join(__dirname, "../sample/LaporanPengeluaran.json");
            const rawData = fs.readFileSync(dataPath);
            const data = JSON.parse(rawData);
    
            // === Generate Excel ===
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Laporan Pengeluaran");  
            // header kolom
            worksheet.columns = [
                { header: "No", key: "no", width: 5 },
                { header: "Dokumen", key: "dokumen", width: 10 },
                { header: "Nomor Daftar", key: "no_daftar", width: 18 },
                { header: "Tanggal Daftar", key: "tgl_daftar", width: 15 },
                { header: "No Bukti Pengeluaran", key: "no_bukti_pengeluaran", width: 25 },
                { header: "Tanggal Bukti Pengeluaran", key: "tgl_bukti_pengeluaran", width: 20 },
                { header: "Pembeli", key: "Pembeli", width: 25 },
                { header: "Nama Pemilik", key: "nama_pemilik", width: 25 },
                { header: "Kode Barang", key: "kode_barang", width: 20 },
                { header: "Nama Barang", key: "nama_barang", width: 25 },
                { header: "Satuan", key: "satuan", width: 10 },
                { header: "Jumlah", key: "jumlah", width: 10 },
                { header: "Nilai", key: "nilai", width: 20 }
            ];
      
            // isi data ke sheet
            data.forEach((item) => {
              worksheet.addRow(item);
            });
      
            // styling header biar rapi
            worksheet.getRow(1).eachCell((cell) => {
              cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" }, };
              cell.alignment = { vertical: "middle", horizontal: "center" };
            });

            // === Auto Fit Row Height ===
            worksheet.eachRow((row) => {
                row.height = 20;
            });
      
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", "attachment; filename=Laporan_Pengeluaran.xlsx");
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            console.error(error);
            if (!res.headersSent) {
                res.status(500).json({ kode: 500, message: "Gagal export Excel", error });
            }
        }
    },

    mutasi_download: async function (req, res) {
        try {
            const {tglDocStart, tglDocEnd, tglDaftarStart, tglDaftarEnd, tglBuktiStart, tglBuktiEnd, jenisDoc,} = req.query;
            const dataPath = path.join(__dirname, "../sample/LaporanMutasi.json");
            const rawData = fs.readFileSync(dataPath);
            const data = JSON.parse(rawData);
    
            // === Generate Excel ===
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Laporan Mutasi");  
            // header kolom
            worksheet.columns = [
                { header: "No", key: "no", width: 5 },
                { header: "Kode Barang", key: "kode_barang", width: 20 },
                { header: "Nama Barang", key: "nama_barang", width: 25 },
                { header: "Satuan", key: "satuan", width: 10 },
                { header: "Jumlah", key: "jumlah", width: 12 },
                { header: "Saldo Awal", key: "saldo_awal", width: 12 },
                { header: "Jumlah Pemasukan", key: "jumlah_pemasukan", width: 18 },
                { header: "Jumlah Pengeluaran", key: "jumlah_pengeluaran", width: 18 },
                { header: "Penyesuaian", key: "penyesuaian", width: 12 },
                { header: "Saldo Akhir", key: "saldo_akhir", width: 12 },
                { header: "Hasil Pencacahan", key: "hasil_pencacahan", width: 18 },
                { header: "Selisih", key: "selisih", width: 10 },
                { header: "Keterangan", key: "keterangan", width: 20 }
            ];
      
            // isi data ke sheet
            data.forEach((item) => {
              worksheet.addRow(item);
            });
      
            // styling header biar rapi
            worksheet.getRow(1).eachCell((cell) => {
              cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" }, };
              cell.alignment = { vertical: "middle", horizontal: "center" };
            });

            // === Auto Fit Row Height ===
            worksheet.eachRow((row) => {
                row.height = 20;
            });
      
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", "attachment; filename=Laporan_Mutasi.xlsx");
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            console.error(error);
            if (!res.headersSent) {
                res.status(500).json({ kode: 500, message: "Gagal export Excel", error });
            }
        }
    },

}