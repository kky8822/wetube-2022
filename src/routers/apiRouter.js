import express from "express";
import { resisterView } from "../controllers/videoControllers";

const apiRouter = express.Router();

apiRouter.post("/videos/:id([0-9a-f]{24})/view", resisterView);

export default apiRouter;
