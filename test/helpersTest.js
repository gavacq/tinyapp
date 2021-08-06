const { expect } = require('chai');

const { getUrlsOfUser, getUserByEmail, urlBelongsToUser } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const urlDatabase = {
  "test2": {
    longURL: "http://www.lighthouselabs.ca",
    userId: "userRandomID"
  },
  "test1":{
    longURL: "http://www.google.com",
    userId: "123"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedOutput = "userRandomID";
    expect(user).to.equal(expectedOutput);
  });
  it("should return undefined if given a email not in the db", () => {
    expect(getUserByEmail("foo@foo.com", testUsers)).to.equal(undefined);
  });
});

describe('getUrlsOfUser', () => {
  it('should return all urls created by a valid user', () => {
    expect(getUrlsOfUser("123", urlDatabase)).to.deep.equal({
      "test1":{
        longURL: "http://www.google.com",
        userId: "123"
      }
    });
  });
  it('should return an empty object if there were no urls created by a user', () => {
    expect(getUrlsOfUser("1", urlDatabase)).to.deep.equal({});
  });
});

describe('urlBelongsToUser', () => {
  it('should return true if the url was created by the user', () => {
    expect(urlBelongsToUser("test2", "userRandomID", urlDatabase)).to.equal(true);
  });
  it('should return false if the url was not created by the user', () => {
    expect(urlBelongsToUser("test2", "123", urlDatabase)).to.equal(false);
  });
});
