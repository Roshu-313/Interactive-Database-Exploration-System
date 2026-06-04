const { User } = require('../models');

function toSafeUser(userInstance) {
  if (!userInstance) return null;
  const plain = userInstance.get ? userInstance.get({ plain: true }) : userInstance;
  if (!plain) return null;
  // eslint-disable-next-line no-unused-vars
  const {
    password,
    resetPasswordToken,
    resetPasswordExpires,
    ...safe
  } = plain;
  return safe;
}

async function findSafeUserById(id) {
  const user = await User.findByPk(id);
  return toSafeUser(user);
}

module.exports = {
  findSafeUserById,
  toSafeUser,
};
