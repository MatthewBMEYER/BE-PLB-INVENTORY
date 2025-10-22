const express = require('express')
const route = express.Router();
const masterController = require("../controllers/masterController");

route.use(express.urlencoded({ extended: false }));

route.get("/roles", masterController.getAllRoles);
route.get('/roles/:role_id/access', masterController.getAccessByRole);
route.put('/roles/:role_id/access', masterController.updateAccessForRole);
route.get("/menu-headers", masterController.getAllMenuHeaders);

route.get("/users", masterController.getAllUsers);
route.get("/users/:id", masterController.getUserDetail);
route.put("/users/:user_id", masterController.updateUserRoleAndStatus);


module.exports = route;