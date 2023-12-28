const sqlite3 = require("sqlite3");
const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");
const morgan = require("morgan");
// Requiring helmet to set security headers
const helmet = require("helmet");
// Requiring express-validator to validate user input
const { body, validationResult } = require("express-validator");

const db = new sqlite3.Database("./bank_sample.db");

const app = express();
const PORT = 3000;
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.use(morgan("dev"));
app.use(helmet());

app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
    // Securing cookies
    cookie: {
      maxAge:  1000 * 60 * 5, // 5 minutes 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' // true if in production, false otherwise
    },
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", function (request, response) {
  response.sendFile(path.join(__dirname + "/html/login.html"));
});

//LOGIN SQL
app.post("/auth", function (request, response) {
  var username = request.body.username;
  var password = request.body.password;
  if (username && password) {
    db.get(
      `SELECT * FROM users WHERE username = $username AND password = $password`,
      {
        //SQL INJECTION PROTECTED
        $username: username,
        $password: password
      },
      function (error, results) {
        if (results) {
          console.log(results);
          request.session.loggedin = true;
          request.session.username = results["username"];
          request.session.balance = results["balance"];
          request.session.file_history = results["file_history"];
          request.session.account_no = results["account_no"];
          response.redirect("/home");
        } else {
          console.log(error)
          response.send("Incorrect Username and/or Password!");
        }
        response.end();
      }
    );
  } else {
    response.send("Please enter Username and Password!");
    response.end();
  }
});

//Home Menu No Exploits Here.
app.get("/home", function (request, response) {
  if (request.session.loggedin) {
    username = request.session.username;
    balance = request.session.balance;
    response.render("home_page", { username, balance });
  } else {
    console.log("Session.loggedin not set to true");
    response.redirect("/");
  }
  response.end();
});

//CSRF CODE SECURED. SEE HEADERS SET ABOVE
app.get("/transfer", function (request, response) {
  if (request.session.loggedin) {
    var sent = "";
    response.render("transfer", { sent });
  } else {
    response.redirect("/");
  }
});

//CSRF CODE
app.post("/transfer", function (request, response) {
  if (request.session.loggedin) {
    console.log("Transfer in progress");
    var balance = request.session.balance;
    var account_to = parseInt(request.body.account_to);
    var amount = parseInt(request.body.amount);
    var account_from = request.session.account_no;
    if (account_to && amount) {
      if (balance > amount) {
        db.get(
          `UPDATE users SET balance = balance + ${amount} WHERE account_no = ${account_to}`,
          function (error, results) {
            console.log(error);
            console.log(results);
          }
        );
        db.get(
          `UPDATE users SET balance = balance - ${amount} WHERE account_no = ${account_from}`,
          function (error, results) {
            var sent = "Money Transfered";
            response.render("transfer", { sent });
          }
        );
      } else {
        var sent = "You Don't Have Enough Funds.";
        response.render("transfer", { sent });
      }
    } else {
      var sent = "";
      response.render("transfer", { sent });
    }
  } else {
    response.redirect("/");
  }
});

//PATH TRAVERSAL CODE
app.get("/download", function (request, response) {
  if (request.session.loggedin) {
    file_name = request.session.file_history;
    response.render("download", { file_name });
  } else {
    response.redirect("/");
  }
  response.end();
});

app.post("/download", function (request, response) {
  if (request.session.loggedin) {
    var file_name = request.body.file;

    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html");

    // Change the filePath to current working directory using the "path" method
    const filePath = "history_files/" + file_name;
    console.log(filePath);
    try {
      content = fs.readFileSync(filePath, "utf8");
      response.end(content);
    } catch (err) {
      console.log(err);
      response.end("File not found");
    }
  } else {
    response.redirect("/");
  }
  response.end();
});

//XSS CODE
app.get("/public_forum", function (request, response) {
  if (request.session.loggedin) {
    db.all(`SELECT username,message FROM public_forum`, (err, rows) => {
      console.log(rows);
      console.log(err);
      response.render("forum", { rows });
    });
  } else {
    response.redirect("/");
  }
  //response.end();
});

app.post(
  "/public_forum", 
  [
    // validating the user comment input using express-validator
    body("comment")
    .trim()
    .escape()
    .isLength({ min: 1 })
    .withMessage("Comment cannot be empty")
  ],
  function (request, response) {
    if (request.session.loggedin) {
      const errors = validationResult(request);
      var comment = request.body.comment;
      var username = request.session.username;
      if (!errors.isEmpty()) {
        console.log(errors);
        db.all(`SELECT username,message FROM public_forum`, (err, rows) => {
          console.log(rows);
          console.log(err);
          response.render("forum", { rows });
        });
      } else {
        db.all(
          `INSERT INTO public_forum (username,message) VALUES ($username,$comment)`,
          {
            $username: username,
            $comment: comment
          },
          (err, rows) => {
            console.log(err);
          }
        );
        db.all(`SELECT username,message FROM public_forum`, (err, rows) => {
          console.log(rows);
          console.log(err);
          response.render("forum", { rows });
        });
      }
      comment = "";
    } else {
      response.redirect("/");
    }
  comment = "";
  //response.end();
});

//SQL UNION INJECTION
app.get("/public_ledger", function (request, response) {
  if (request.session.loggedin) {
    var id = request.query.id;
    if (id) {
      db.all(
        `SELECT * FROM public_ledger WHERE from_account = '${id}'`,
        (err, rows) => {
          console.log("PROCESSING INPU");
          console.log(err);
          if (rows) {
            response.render("ledger", { rows });
          } else {
            response.render("ledger", { rows });
          }
        }
      );
    } else {
      db.all(`SELECT * FROM public_ledger`, (err, rows) => {
        if (rows) {
          response.render("ledger", { rows });
        } else {
          response.render("ledger", { rows });
        }
      });
    }
  } else {
    response.redirect("/");
  }
  //response.end();
});

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
