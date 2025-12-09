const express = require('express');
const router = express.Router();
const userController = require("../controllers/userController");

router.use(express.json());
router.use(express.urlencoded({ extended: false }));

router.post(`/login`, userController.login);
router.get(`/list`, userController.list);
router.post(`/register`, userController.registerUser);
router.delete(`/deleteUser`, userController.deleteUser);
router.post(`/resetPassword`, userController.resetPassword);
router.post(`/forgotPassword`, userController.forgotPassword);

router.post('/google/auth/login', userController.googleLogin);
router.post('/google/auth/register', userController.googleRegister);


module.exports = router;
