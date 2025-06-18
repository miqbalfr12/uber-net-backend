const {Op} = require("sequelize");
const {ISP} = require("../../../models");

module.exports = {
 getAllPaket: async (req, res) => {
  const dataPaket = await ISP.findAll();

  const dataPaketJson = JSON.parse(JSON.stringify(dataPaket));

  dataPaketJson.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  res.status(200).json(dataPaketJson);
 },
 //  getProfile: (req, res) => {
 //   const user = req.user;

 //   res.status(200).json(user);
 //  },

 //  deleteUser: async (req, res) => {
 //   const user = req.user;
 //   const {user_id} = req.body;

 //   console.log(user_id);
 //   try {
 //    const userData = await User.findOne({where: {user_id}}).then((userData) => {
 //     userData.updated_at = new Date();
 //     userData.updated_by = user.user_id;
 //     userData.deleted_at = new Date();
 //     userData.deleted_by = user.user_id;
 //     return userData;
 //    });
 //    await userData.save().then(() => {
 //     console.log("User deleted");
 //     return res.status(200).json({message: "User deleted"});
 //    });
 //   } catch (error) {
 //    return res.status(500).json({message: error.message});
 //   }
 //  },
 //  restoreUser: async (req, res) => {
 //   const user = req.user;
 //   const {user_id} = req.body;

 //   console.log(user_id);
 //   try {
 //    const userData = await User.findOne({where: {user_id}}).then((userData) => {
 //     userData.updated_at = new Date();
 //     userData.updated_by = user.user_id;
 //     userData.deleted_at = null;
 //     userData.deleted_by = null;
 //     return userData;
 //    });
 //    await userData.save().then(() => {
 //     console.log("User deleted");
 //     return res.status(200).json({message: "User restored"});
 //    });
 //   } catch (error) {
 //    return res.status(500).json({message: error.message});
 //   }
 //  },
};
