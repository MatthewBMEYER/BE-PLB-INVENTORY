const express = require('express');
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require ('../middleware/authMiddleware'); //jwt
const allowedRoles = require ('../middleware/roleMiddleware');

router.use(express.json()); 
router.use(express.urlencoded({ extended: false }));

router.post(`/login`, userController.login);
router.post(`/register`, userController.register);
router.post(`/forget-password`, userController.forgetPassword);


// semua user login bisa akses
router.get('/profile',auth,(req,res)=>{
res.json
    ({
    status : 'success',
    massage: 'ini profile', 
    user: req.user
    })

});

// khsusus admin
router.get ('/admin-dashboard',auth,allowedRoles('admin'),(req,res)=>{
    res.json({
        status : 'success',
        massage: 'welcome admin',
        user: req.user
    });
});

// Khusus company user
router.get('/company-dashboard', auth, allowedRoles('company'), (req, res) => {
  res.json({
    status: 'success',
    message: 'Welcome Company User',
    user: req.user
  });
});

// Khusus custom user
router.get('/custom-dashboard', auth, allowedRoles('custom'), (req, res) => {
  res.json({
    status: 'success',
    message: 'Welcome Custom User ',
    user: req.user
  });
});

module.exports = router;
