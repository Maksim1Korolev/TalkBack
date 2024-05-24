import asyncHandler from "express-async-handler";
import UserService from "../users/users.service.js";

// @desc   Get users
// @route  GET /auth-repository/users
// @access Public

export const getUsers = asyncHandler(async (req, res) => {
  const users = await UserService.getUsers();
  res.json({ users });
});

// @desc   Add a user
// @route  POST /auth-repository/users
// @access Public

export const addUser = asyncHandler(async (req, res) => {
  const { user } = req.body;
  await UserService.addUser(user);
  res.status(201).json({ message: "User added successfully" });
});

// @desc   Delete a user
// @route  DELETE /auth-repository/users/:id
// @access Public

export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await UserService.deleteUser(id);
  res.status(200).json({ message: "User deleted successfully" });
});
