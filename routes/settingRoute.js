const express = require('express')
const route = express.Router();
const settingController = require("../controllers/settingController");

route.use(express.urlencoded({ extended: false }));

route.get("/roles", settingController.getAllRoles);
route.get('/roles/:role_id/access', settingController.getAccessByRole);
route.put('/roles/:role_id/access', settingController.updateAccessForRole);
route.get("/menu-headers", settingController.getAllMenuHeaders);

route.get("/users", settingController.getAllUsers);
route.get("/users/:id", settingController.getUserDetail);
route.put("/users/:user_id", settingController.updateUserRoleAndStatus);


module.exports = route;