const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
const bcrypt = require("bcrypt");
let db = null;

const serverStarted = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`server started`);
    });
  } catch (error) {
    console.log(`error ${error.message}`);
    process.exit(1);
  }
};

serverStarted();

//API REGISTER
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const getQuery = `select * from user where username = '${username}'`;
  const dbUser = await db.get(getQuery);

  if (dbUser === undefined) {
    const lengthOfPassword = password.length;
    if (lengthOfPassword < 5) {
      response.send("Password is too short");
      response.status(400);
    } else {
      const registerUser = `insert into 
         user(username,name,password,gender,location)
         values(
             '${username}',
             '${name}',
             '${hashedPassword}',
             '${gender}',
             '${location}'
         )`;
      await db.run(registerUser);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send(`User already exists`);
  }
});

//API LOGIN
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getQuery = `select * from user where username = '${username}'`;
  const dbUser = await db.get(getQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getQuery = `select * from user where username = '${username}'`;
  const dbUser = await db.get(getQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("User not registered");
  } else {
    const comparePassword = await bcrypt.compare(oldPassword, dbUser.password);
    if (comparePassword === true) {
      const lengthOfNewPassword = newPassword.length;
      if (lengthOfNewPassword < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const encryptPassword = await bcrypt.hash(newPassword, 10);
        const updatePassword = `update user 
             set 
             password = '${encryptPassword}'
             where username = '${username}'`;
        await db.run(updatePassword);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
