import multer from "multer";
import multerS3 from "multer-s3";
import aws from "aws-sdk";
import sftpStorage from "multer-sftp";

const storage = new sftpStorage({
  sftp: {
    host: "kky8822.ipdisk.co.kr",
    port: 21,
    user: process.env.FTP_ID,
    password: process.env.FTP_PASSWD,
  },
  destination: function (req, file, cb) {
    cb(null, "/tmp/my-uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now());
  },
});

const s3 = new aws.S3({
  credentials: {
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET,
  },
});

const isHeroku = process.env.NODE_ENV === "production";

const s3VideoUploader = multerS3({
  s3: s3,
  bucket: "wetube-2022-kye/videos",
  acl: "public-read",
});

const s3ImageUploader = multerS3({
  s3: s3,
  bucket: "wetube-2022-kye/images",
  acl: "public-read",
});

export const localsMiddleware = (req, res, next) => {
  res.locals.siteName = "Wetube";
  res.locals.loggedIn = Boolean(req.session.loggedIn);
  res.locals.loggedInUser = req.session.user || {};
  // console.log(res.locals);
  next();
};

export const protectorMiddleware = (req, res, next) => {
  if (req.session.loggedIn) {
    return next();
  } else {
    req.flash("error", "Log in first.");
    return res.redirect("/login");
  }
};

export const publicOnlyMiddleware = (req, res, next) => {
  if (!req.session.loggedIn) {
    return next();
  } else {
    req.flash("error", "Already Authorized");
    return res.redirect("/");
  }
};

export const avatarUpload = multer({
  dest: "uploads/avatars",
  limits: { fileSize: 3000000 },
  storage: isHeroku ? s3ImageUploader : undefined,
  // storage: storage,
});

export const videoUpload = multer({
  dest: "uploads/videos",
  limits: { fileSize: 100000000 },
  storage: isHeroku ? s3VideoUploader : undefined,
  // storage: storage,
});
