module.exports = function allowedRoles(roles) {
    return (req,res,next)=> {
        try{
            console.log("Role dari token:", req.user); // <== DEBUG
            const userRole = req.user.role_id; // dari jwt

            const allowed =  Array.isArray(roles) ? roles : [roles]

            if (!allowed.includes(userRole)){
                return res.status(403).json({
                    status : 'error',
                    massage : 'Akses  ditolak : role (${userRole}) tidak punya izin',
                });
            }

             next();
        }catch(err) {
        return res.status(500).json({
            status : 'error',
            massage : 'Terjadi kesalahan role middleware',
        });
    }

};
};