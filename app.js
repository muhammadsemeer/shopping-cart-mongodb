var createError = require("http-errors");
var express = require("express");
var path = require("path");
var hbs = require("express-handlebars");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var fileUpload = require("express-fileupload");
var db = require("./config/connection");
var session = require("express-session");
var userRouter = require("./routes/user");
var adminRouter = require("./routes/admin");
var subdomain = require("express-subdomain");
var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.engine(
  "hbs",
  hbs({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: __dirname + "/views/layout/",
    partialsDir: __dirname + "/views/partials/",
    helpers: {
      isPaid: (payment, options) => {
        if (payment === "Paid") {
          return options.fn(this);
        } else {
          return options.inverse(this);
        }
      },
      isPending: function (status, options) {
        if (status === "Pending") {
          return options.fn(this);
        } else {
          return options.inverse(this);
        }
      },
    },
  })
);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(fileUpload());
app.use(session({ secret: "key", cookie: { maxAge: 2592000000 } }));

//database connection
db.connect((err) => {
  if (err) throw err;
  console.log("Database Connected");
});

app.use("/", userRouter);
app.use(subdomain("admin", adminRouter));

// catch 404 and forward to error handler
app.use("*", (req, res) => {
  res.status(404).render("404.hbs");
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
