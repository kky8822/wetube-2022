import User from "../models/User";
import Video from "../models/Video";
import bcrypt from "bcrypt";
import fetch from "cross-fetch";

export const getJoin = (req, res) =>
  res.render("users/join", { pageTitle: "Join" });

export const postJoin = async (req, res) => {
  const { name, email, username, password, password_c, location } = req.body;

  if (password != password_c) {
    return res.status(400).render("users/join", {
      pageTitle: "Join",
      errorMessage: "Confirm your password",
    });
  }

  const exists = await User.exists({ $or: [{ username }, { email }] });
  if (exists) {
    return res.status(400).render("users/join", {
      pageTitle: "Join",
      errorMessage: "This username/email is already taken.",
    });
  }

  try {
    await User.create({
      name,
      email,
      username,
      password,
      location,
    });
    return res.redirect("/login");
  } catch (error) {
    return res.status(400).render("users/join", {
      pageTitle: "Join",
      errorMessage: "Unexpercted errors are occured.",
    });
  }
};

export const getLogin = (req, res) =>
  res.render("users/login", { pageTitle: "Login" });

export const postLogin = async (req, res) => {
  const { username, password } = req.body;

  const exists = await User.exists({ username, socialOnly: false });
  if (!exists) {
    return res.status(400).render("users/login", {
      pageTitle: "Login",
      errorMessage: "An account with this username doesn't exist.",
    });
  }

  const user = await User.findOne({ username });
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(400).render("users/login", {
      pageTitle: "Login",
      errorMessage: "The Password is not correct.",
    });
  }

  try {
    req.session.loggedIn = true;
    req.session.user = user;
    res.redirect("/");
  } catch (error) {
    return res.status(400).render("users/login", {
      pageTitle: "Login",
      errorMessage: "Unexpercted errors are occured.",
    });
  }
};

export const startGithubLogin = (req, res) => {
  const baseUrl = "https://github.com/login/oauth/authorize";
  const config = {
    client_id: process.env.GH_CLIENT,
    allow_signup: false,
    scope: "read:user user:email",
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;

  return res.redirect(finalUrl);
};

export const finishGithubLogin = async (req, res) => {
  const baseUrl = "https://github.com/login/oauth/access_token";
  const config = {
    client_id: process.env.GH_CLIENT,
    client_secret: process.env.GH_SECRET,
    code: req.query.code,
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;

  const tokenRequest = await (
    await fetch(finalUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    })
  ).json();

  if ("access_token" in tokenRequest) {
    const { access_token } = tokenRequest;
    const userData = await (
      await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();

    const emailData = await (
      await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();

    const emailObj = emailData.find(
      (email) => email.primary === true && email.verified === true
    );
    if (!emailObj) {
      return res.redirect("/login");
    }

    let user = await User.findOne({ email: emailObj.email });
    if (!user) {
      user = await User.create({
        name: userData.name,
        email: emailObj.email,
        username: userData.login,
        password: "",
        location: userData.location,
        socialOnly: true,
        avatarUrl: userData.avatar_url,
      });
    }
    req.session.loggedIn = true;
    req.session.user = user;
    req.flash("success", "Hello!");
    res.redirect("/");
  } else {
    return res.redirect("/login");
  }
};

export const logout = (req, res) => {
  req.flash("info", "Bye Bye");
  req.session.user = null;
  res.locals.loggedInUser = req.session.user;
  req.session.loggedIn = false;
  return res.redirect("/");
};

export const getEdit = (req, res) => {
  return res.render("users/edit-profile", { pageTitle: "Edit Profile" });
};

export const postEdit = async (req, res) => {
  const {
    session: {
      user: { _id, avatarUrl },
    },
    body: { name, email, username, location },
    file,
  } = req;
  console.log(req.body);
  console.log(req.file);

  const isMe =
    res.locals.loggedInUser.name === name ||
    res.locals.loggedInUser.email === email;

  const exists = await User.exists({ $or: [{ username }, { email }] });

  if (!isMe & exists) {
    return res.status(400).render("users/edit-profile", {
      pageTitle: "Edit Profile",
      errorMessage: "This username/email is already taken.",
    });
  }

  try {
    const updateUser = await User.findByIdAndUpdate(
      _id,
      {
        avatarUrl: file ? file.location : avatarUrl,
        name,
        email,
        username,
        location,
      },
      { new: true }
    );
    req.session.user = updateUser;
    return res.redirect("/users/edit");
  } catch (error) {
    return res.status(400).render("users/edit-profile", {
      pageTitle: "Edit Profile",
      errorMessage: "Unexpercted errors are occured.",
    });
  }
};

export const getChangePassword = (req, res) => {
  if (req.session.user.socialOnly === true) {
    req.flash("error", "Can't change password.");
    return res.redirect("/");
  }
  return res.render("users/change-password", { pageTitle: "Change Password" });
};

export const postChangePassword = async (req, res) => {
  // send notification
  const {
    session: {
      user: { _id },
    },
    body: { oldPassword, newPassword, newPassword_c },
  } = req;
  const user = await User.findById(_id);

  const ok = await bcrypt.compare(oldPassword, user.password);
  if (!ok) {
    return res.status(400).render("users/change-password", {
      pageTitle: "Change Password",
      errorMessage: "The current password is incorrect.",
    });
  }

  if (newPassword !== newPassword_c) {
    return res.status(400).render("users/change-password", {
      pageTitle: "Change Password",
      errorMessage: "The password does not mathch confirmation.",
    });
  }

  user.password = newPassword;
  await user.save();
  // req.session.destroy();
  req.flash("info", "Password updated");
  return res.redirect("/users/logout");
};

export const getProfile = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).populate({
      path: "videos",
      populate: {
        path: "owner",
        model: "User",
      },
    });

    return res.render("users/profile", {
      pageTitle: user.name,
      user,
    });
  } catch {
    return res.status(404).render("404", { pageTitle: "User Not Found" });
  }
};
