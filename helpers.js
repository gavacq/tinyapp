// TODO: use better RNG and generate capital letters
const generateRandomString = () => {
  return Math.random().toString(36).replace(/[^a-z0-9]+/g, '').substr(0, 6);
};

const getUserByEmail = (email, db) => {
  for (const userId in db) {
    if (db[userId].email === email) {
      return userId;
    }
  }

  return undefined;
};

const getUrlsOfUser = (id, db) => {
  const userUrls = {};

  for (const url in db) {
    if (db[url].userId === id) {
      userUrls[url] = db[url];
    }
  }

  return userUrls;
};

const urlBelongsToUser = (url, id, db) => {
  for (const usersUrl in getUrlsOfUser(id, db)) {
    if (url === usersUrl) {
      return true;
    }
  }

  return false;
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  getUrlsOfUser,
  urlBelongsToUser
};
